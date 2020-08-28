import { EventFilter, utils, providers, BigNumber, ContractTransaction } from 'ethers';

import { Certificate, IClaimData, ICertificate } from './Certificate';
import { getEventsFromContract, IBlockchainEvent } from '../utils/events';
import { IBlockchainProperties } from './BlockchainProperties';

export interface IShareInCertificate {
    [address: string]: string;
}

export const encodeClaimData = async (
    claimData: IClaimData,
    blockchainProperties: IBlockchainProperties
): Promise<string> => {
    const { beneficiary, address, region, zipCode, countryCode } = claimData;

    return blockchainProperties.registry.encodeClaimData(
        beneficiary ?? '',
        address ?? '',
        region ?? '',
        zipCode ?? '',
        countryCode ?? ''
    );
};

export const decodeClaimData = async (
    encodedClaimData: string,
    blockchainProperties: IBlockchainProperties
): Promise<IClaimData> => {
    const {
        _beneficiary,
        _address,
        _region,
        _zipCode,
        _countryCode
    } = await blockchainProperties.registry.decodeClaimData(encodedClaimData);

    return {
        beneficiary: _beneficiary,
        address: _address,
        region: _region,
        zipCode: _zipCode,
        countryCode: _countryCode
    };
};

export async function claimCertificates(
    certificateIds: number[],
    claimData: IClaimData,
    blockchainProperties: IBlockchainProperties
): Promise<ContractTransaction> {
    const certificatesPromises = certificateIds.map((certId) =>
        new Certificate(certId, blockchainProperties).sync()
    );
    const certificates = await Promise.all(certificatesPromises);

    const ownsAllCertificates = certificates.every((cert) => cert.isOwned === true);

    if (!ownsAllCertificates) {
        throw new Error(`You can only claim your own certificates`);
    }

    const values = certificates.map((cert) => cert.energy.publicVolume);

    const encodedClaimData = await encodeClaimData(claimData, blockchainProperties);
    const data = utils.randomBytes(32);

    const { activeUser, registry } = blockchainProperties;

    const registryWithSigner = registry.connect(activeUser);

    const activeUserAddress = await activeUser.getAddress();

    const claimTx = await registryWithSigner.safeBatchTransferAndClaimFrom(
        activeUserAddress,
        activeUserAddress,
        certificateIds,
        values,
        data,
        certificates.map(() => encodedClaimData)
    );

    await claimTx.wait();

    return claimTx;
}

export async function transferCertificates(
    certificateIds: number[],
    to: string,
    blockchainProperties: IBlockchainProperties
): Promise<ContractTransaction> {
    const certificatesPromises = certificateIds.map((certId) =>
        new Certificate(certId, blockchainProperties).sync()
    );
    const certificates = await Promise.all(certificatesPromises);

    const ownsAllCertificates = certificates.every((cert) => cert.isOwned === true);

    if (!ownsAllCertificates) {
        throw new Error(`You can only claim your own certificates`);
    }

    const values = certificates.map((cert) => cert.energy.publicVolume);

    // TO-DO: replace with proper data
    const data = utils.randomBytes(32);

    const { registry, activeUser } = blockchainProperties;
    const registryWithSigner = registry.connect(activeUser);

    const activeUserAddress = await activeUser.getAddress();

    const transferTx = await registryWithSigner.safeBatchTransferFrom(
        activeUserAddress,
        to,
        certificateIds,
        values,
        data
    );

    await transferTx.wait();

    return transferTx;
}

export async function getAllCertificates(
    blockchainProperties: IBlockchainProperties
): Promise<Certificate[]> {
    const { issuer } = blockchainProperties;

    const certificationRequestApprovedEvents = await getEventsFromContract(
        issuer,
        issuer.filters.CertificationRequestApproved(null, null, null)
    );
    const certificatePromises = certificationRequestApprovedEvents.map((event) =>
        new Certificate(event._certificateId.toNumber(), blockchainProperties).sync()
    );

    return Promise.all(certificatePromises);
}

export async function getAllOwnedCertificates(
    blockchainProperties: IBlockchainProperties
): Promise<Certificate[]> {
    const { registry, activeUser } = blockchainProperties;
    const owner = await activeUser.getAddress();

    const transfers = await getEventsFromContract(
        registry,
        registry.filters.TransferSingle(null, null, owner, null, null)
    );
    const certificateIds = [
        ...new Set<number>(transfers.map((transfer) => transfer._id.toNumber()))
    ];
    const balances = await registry.balanceOfBatch(
        Array(certificateIds.length).fill(owner),
        certificateIds
    );
    const available = certificateIds.filter((id, index) => !balances[index].isZero());

    const certificatePromises = available.map((id) =>
        new Certificate(id, blockchainProperties).sync()
    );

    return Promise.all(certificatePromises);
}

export const getAllCertificateEvents = async (
    certId: number,
    blockchainProperties: IBlockchainProperties
): Promise<IBlockchainEvent[]> => {
    const { registry } = blockchainProperties;

    const getEvent = async (filter: EventFilter, eventName: string) => {
        const logs = await registry.provider.getLogs({
            ...filter,
            fromBlock: 0,
            toBlock: 'latest'
        });

        const parsedLogs = await Promise.all(
            logs.map(
                async (event: providers.Log): Promise<IBlockchainEvent> => {
                    const eventBlock = await registry.provider.getBlock(event.blockHash);

                    return {
                        name: eventName,
                        transactionHash: event.transactionHash,
                        blockHash: event.blockHash,
                        timestamp: eventBlock.timestamp,
                        ...registry.interface.decodeEventLog(eventName, event.data, event.topics)
                    };
                }
            )
        );
        return parsedLogs.filter((event) => event._id.toNumber() === certId);
    };

    const issuanceSingleEvents = await getEvent(
        registry.filters.IssuanceSingle(null, null, null),
        'IssuanceSingle'
    );

    const transferSingleEvents = await getEvent(
        registry.filters.TransferSingle(null, null, null, null, null),
        'TransferSingle'
    );

    const claimSingleEvents = await getEvent(
        registry.filters.ClaimSingle(null, null, null, null, null, null),
        'ClaimSingle'
    );

    return [...issuanceSingleEvents, ...transferSingleEvents, ...claimSingleEvents];
};

export const calculateOwnership = async (
    certificateId: ICertificate['id'],
    blockchainProperties: IBlockchainProperties
): Promise<IShareInCertificate> => {
    const ownedShares: IShareInCertificate = {};
    const { registry } = blockchainProperties;

    const transferSingleEvents = (
        await getEventsFromContract(
            registry,
            registry.filters.TransferSingle(null, null, null, null, null)
        )
    ).filter((event) => event._id.eq(certificateId));

    const transferBatchEvents = (
        await getEventsFromContract(
            registry,
            registry.filters.TransferBatch(null, null, null, null, null)
        )
    ).filter((e) => e._ids.some((id: BigNumber) => id.eq(certificateId)));

    const allHistoricOwners = [
        ...new Set([...transferSingleEvents, ...transferBatchEvents].map((event) => event._to))
    ];

    const allHistoricOwnersBalances = await Promise.all(
        allHistoricOwners.map((ownerAddress) => registry.balanceOf(ownerAddress, certificateId))
    );

    allHistoricOwners.forEach((owner, index) => {
        ownedShares[owner] = allHistoricOwnersBalances[index].toString();
    });

    return ownedShares;
};

export async function approveOperator(
    operator: string,
    blockchainProperties: IBlockchainProperties
): Promise<ContractTransaction> {
    const { activeUser, registry } = blockchainProperties;

    const registryWithSigner = registry.connect(activeUser);

    const approveOperatorTx = await registryWithSigner.setApprovalForAll(operator, true);

    await approveOperatorTx.wait();

    return approveOperatorTx;
}
