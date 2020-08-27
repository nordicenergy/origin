import { ExtendedBaseEntity } from '@energyweb/origin-backend';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { IsInt } from 'class-validator';
import { IBlockchainProperties, Contracts } from '@energyweb/issuer';
import { getProviderWithFallback } from '@energyweb/utils-general';
import { Signer, Wallet } from 'ethers';

@Entity()
export class BlockchainProperties extends ExtendedBaseEntity {
    @PrimaryColumn()
    @IsInt()
    netId: number;

    @Column()
    registry: string;

    @Column()
    issuer: string;

    @Column()
    rpcNode: string;

    @Column()
    platformOperatorPrivateKey: string;

    @Column({ nullable: true })
    rpcNodeFallback: string;

    wrap(signerOrPrivateKey?: Signer | string): IBlockchainProperties {
        const web3 = getProviderWithFallback(this.rpcNode, this.rpcNodeFallback);

        let signer: Signer;

        if (signerOrPrivateKey) {
            signer =
                typeof signerOrPrivateKey === 'string'
                    ? new Wallet(signerOrPrivateKey, web3)
                    : signerOrPrivateKey;
        } else {
            signer = new Wallet(this.platformOperatorPrivateKey, web3);
        }

        return {
            web3,
            registry: Contracts.factories.RegistryFactory.connect(this.registry, signer ?? web3),
            issuer: Contracts.factories.IssuerFactory.connect(this.issuer, signer ?? web3),
            activeUser: signer
        };
    }
}
