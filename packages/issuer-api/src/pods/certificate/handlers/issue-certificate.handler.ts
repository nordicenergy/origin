import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate as CertificateFacade, CertificateUtils } from '@energyweb/issuer';
import { BigNumber } from 'ethers';
import { IssueCertificateCommand } from '../commands/issue-certificate.command';
import { Certificate } from '../certificate.entity';
import { BlockchainPropertiesService } from '../../blockchain/blockchain-properties.service';

@CommandHandler(IssueCertificateCommand)
export class IssueCertificateHandler implements ICommandHandler<IssueCertificateCommand> {
    constructor(
        @InjectRepository(Certificate)
        private readonly repository: Repository<Certificate>,
        private readonly blockchainPropertiesService: BlockchainPropertiesService
    ) {}

    async execute(command: IssueCertificateCommand): Promise<Certificate> {
        const { to, value, fromTime, toTime, deviceId, netId } = command;

        const blockchainProperties = await this.blockchainPropertiesService.get(netId);

        const cert = await CertificateFacade.create(
            to,
            BigNumber.from(value),
            fromTime,
            toTime,
            deviceId,
            blockchainProperties.wrap()
        );

        const certificateOwners = await CertificateUtils.calculateOwnership(
            cert.id,
            blockchainProperties.wrap()
        );

        const certificate = this.repository.create({
            blockchain: blockchainProperties,
            tokenId: cert.id,
            deviceId: cert.deviceId,
            generationStartTime: cert.generationStartTime,
            generationEndTime: cert.generationEndTime,
            creationTime: cert.creationTime,
            creationBlockHash: cert.creationBlockHash,
            owners: certificateOwners
        });

        return this.repository.save(certificate);
    }
}
