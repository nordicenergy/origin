import { ExtendedBaseEntity } from '@energyweb/origin-backend';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsInt } from 'class-validator';
import { CertificateUtils } from '@energyweb/issuer';
import { BlockchainProperties } from '../blockchain/blockchain-properties.entity';

export interface ICertificate {
    blockchain: BlockchainProperties;
    tokenId: number;
    deviceId: string;
    generationStartTime: number;
    generationEndTime: number;
    creationTime: number;
    creationBlockHash: string;
}

@Entity()
export class Certificate extends ExtendedBaseEntity implements ICertificate {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => BlockchainProperties)
    blockchain: BlockchainProperties;

    @Column()
    tokenId: number;

    @Column()
    deviceId: string;

    @Column()
    @IsInt()
    generationStartTime: number;

    @Column()
    @IsInt()
    generationEndTime: number;

    @Column()
    @IsInt()
    creationTime: number;

    @Column()
    creationBlockHash: string;

    @Column('simple-json')
    owners: CertificateUtils.IShareInCertificate;
}
