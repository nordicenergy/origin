import { Event as BlockchainEvent, ContractTransaction, ethers, BigNumber } from 'ethers';

import { Timestamp } from '@energyweb/utils-general';

import { getEventsFromContract } from '../utils/events';
import { encodeClaimData, decodeClaimData } from './CertificateUtils';
import { IBlockchainProperties } from './BlockchainProperties';
import { MAX_ENERGY_PER_CERTIFICATE } from './CertificationRequest';

export interface ICertificateEnergy {
    publicVolume: BigNumber;
    claimedVolume: BigNumber;
}

export interface IClaimData {
    beneficiary?: string;
    address?: string;
    region?: string;
    zipCode?: string;
    countryCode?: string;
}

export interface IClaim {
    id: number;
    from: string;
    to: string;
    topic: number;
    value: number;
    claimData: IClaimData;
}

export interface ICertificate {
    id: number;
    issuer: string;
    deviceId: string;
    energy: ICertificateEnergy;
    generationStartTime: number;
    generationEndTime: number;
    certificationRequestId: number;
    creationTime: number;
    creationBlockHash: string;

    isClaimed: boolean;
    isOwned: boolean;
    claims: IClaim[];
}

export class Certificate implements ICertificate {
    public deviceId: string;

    public energy: ICertificateEnergy;

    public generationStartTime: number;

    public generationEndTime: number;

    public issuer: string;

    public creationTime: number;

    public creationBlockHash: string;

    public certificationRequestId: number;

    public initialized = false;

    public data: string;

    public claims: IClaim[];

    constructor(public id: number, public blockchainProperties: IBlockchainProperties) {}

    public static async create(
        to: string,
        value: BigNumber,
        fromTime: Timestamp,
        toTime: Timestamp,
        deviceId: string,
        blockchainProperties: IBlockchainProperties
    ): Promise<Certificate> {
        if (value.gt(MAX_ENERGY_PER_CERTIFICATE)) {
            throw new Error(
                `Too much energy requested. Requested: ${value}, Max: ${MAX_ENERGY_PER_CERTIFICATE}`
            );
        }

        const newCertificate = new Certificate(null, blockchainProperties);

        const getIdFromEvents = (logs: BlockchainEvent[]): number =>
            Number(logs.find((log) => log.event === 'CertificationRequestApproved').topics[2]);

        const { issuer } = blockchainProperties;
        const issuerWithSigner = issuer.connect(blockchainProperties.activeUser);

        const data = await issuer.encodeData(fromTime, toTime, deviceId);

        const properChecksumToAddress = ethers.utils.getAddress(to);

        const tx = await issuerWithSigner.issue(properChecksumToAddress, value, data);
        const { events } = await tx.wait();

        newCertificate.id = getIdFromEvents(events);

        return newCertificate.sync();
    }

    async sync(): Promise<Certificate> {
        if (this.id === null) {
            return this;
        }

        const { registry } = this.blockchainProperties;
        const certOnChain = await registry.getCertificate(this.id);

        this.data = certOnChain.data;

        this.claims = await this.getClaimedData();

        const { issuer } = this.blockchainProperties;

        const decodedData = await issuer.decodeData(this.data);

        const allIssuanceLogs = await getEventsFromContract(
            registry,
            registry.filters.IssuanceSingle(null, null, null)
        );
        const issuanceLog = allIssuanceLogs.filter(
            (event) => event._id.toString() === this.id.toString()
        )[0];
        const issuanceBlock = await registry.provider.getBlock(issuanceLog.blockHash);

        this.generationStartTime = Number(decodedData['0']);
        this.generationEndTime = Number(decodedData['1']);
        this.deviceId = decodedData['2'];
        this.issuer = certOnChain.issuer;
        this.creationTime = Number(issuanceBlock.timestamp);
        this.creationBlockHash = issuanceLog.blockHash;

        const certificationRequestApprovedEvents = await getEventsFromContract(
            issuer,
            issuer.filters.CertificationRequestApproved(null, null, this.id)
        );

        this.certificationRequestId = certificationRequestApprovedEvents[0]._id;

        const owner = await this.blockchainProperties.activeUser.getAddress();
        const ownedEnergy = await registry.balanceOf(owner, this.id);
        const claimedEnergy = await registry.claimedBalanceOf(owner, this.id);

        this.energy = {
            publicVolume: ownedEnergy,
            claimedVolume: claimedEnergy
        };

        this.initialized = true;

        return this;
    }

    get isOwned(): boolean {
        if (!this.energy) {
            return false;
        }

        return this.energy.publicVolume.gt(0);
    }

    get isClaimed(): boolean {
        if (!this.energy) {
            return false;
        }

        const { claimedVolume } = this.energy;

        return claimedVolume.gt(0);
    }

    async claim(
        claimData: IClaimData,
        amount?: BigNumber,
        from?: string,
        to?: string
    ): Promise<ContractTransaction> {
        const { publicVolume } = this.energy;

        if (publicVolume.eq(0) && !amount) {
            throw new Error(
                `claim(): You do not own a share in the certificate. If you're an operator, please define an amount.`
            );
        }

        const { activeUser, registry } = this.blockchainProperties;
        const registryWithSigner = registry.connect(activeUser);

        const activeUserAddress = await activeUser.getAddress();

        const encodedClaimData = await encodeClaimData(claimData, this.blockchainProperties);

        const claimTx = await registryWithSigner.safeTransferAndClaimFrom(
            from ?? activeUserAddress,
            to ?? activeUserAddress,
            this.id,
            amount || publicVolume,
            this.data,
            encodedClaimData
        );

        await claimTx.wait();

        return claimTx;
    }

    async transfer(to: string, amount?: BigNumber, from?: string): Promise<ContractTransaction> {
        if (await this.isRevoked()) {
            throw new Error(`Unable to transfer Certificate #${this.id}. It has been revoked.`);
        }

        const { activeUser } = this.blockchainProperties;
        const fromAddress = from ?? (await activeUser.getAddress());
        const toAddress = ethers.utils.getAddress(to);

        const { publicVolume } = this.energy;

        const amountToTransfer = amount ?? publicVolume;

        const { registry } = this.blockchainProperties;
        const registryWithSigner = registry.connect(activeUser);

        const tx = await registryWithSigner.safeTransferFrom(
            fromAddress,
            toAddress,
            this.id,
            amountToTransfer,
            this.data
        );

        await tx.wait();

        return tx;
    }

    async revoke(): Promise<ContractTransaction> {
        const { issuer } = this.blockchainProperties;
        const issuerWithSigner = issuer.connect(this.blockchainProperties.activeUser);

        const tx = await issuerWithSigner.revokeCertificate(this.id);
        await tx.wait();

        return tx;
    }

    async isRevoked(): Promise<boolean> {
        const { issuer } = this.blockchainProperties;

        const revokedEvents = await getEventsFromContract(
            issuer,
            issuer.filters.CertificateRevoked(this.id)
        );

        return revokedEvents.length > 0;
    }

    async getClaimedData(): Promise<IClaim[]> {
        const { registry } = this.blockchainProperties;

        const claims: IClaim[] = [];

        const claimSingleEvents = await getEventsFromContract(
            registry,
            registry.filters.ClaimSingle(null, null, null, null, null, null)
        );

        for (const claimEvent of claimSingleEvents) {
            if (claimEvent._id.toNumber() === this.id) {
                const { _claimData, _id, _claimIssuer, _claimSubject, _topic, _value } = claimEvent;
                const claimData = await decodeClaimData(_claimData, this.blockchainProperties);

                claims.push({
                    id: _id.toNumber(),
                    from: _claimIssuer,
                    to: _claimSubject,
                    topic: _topic.toNumber(),
                    value: _value.toNumber(),
                    claimData
                });
            }
        }

        const claimBatchEvents = await getEventsFromContract(
            registry,
            registry.filters.ClaimBatch(null, null, null, null, null, null)
        );

        for (const claimBatchEvent of claimBatchEvents) {
            if (
                claimBatchEvent._ids.map((idAsBN: BigNumber) => idAsBN.toNumber()).includes(this.id)
            ) {
                const {
                    _ids,
                    _claimData,
                    _claimIssuer,
                    _claimSubject,
                    _topics,
                    _values
                } = claimBatchEvent;
                const claimIds = _ids.map((idAsBN: BigNumber) => idAsBN.toNumber());

                const index = claimIds.indexOf(this.id);
                const claimData = await decodeClaimData(
                    _claimData[index],
                    this.blockchainProperties
                );

                claims.push({
                    id: _ids[index].toNumber(),
                    from: _claimIssuer,
                    to: _claimSubject,
                    topic: _topics[index]?.toNumber(),
                    value: _values[index].toNumber(),
                    claimData
                });
            }
        }

        return claims;
    }
}
