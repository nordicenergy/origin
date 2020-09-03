import { IEventHandler, EventsHandler } from '@nestjs/cqrs';
import { Certificate as CertificateFacade, CertificateUtils } from '@energyweb/issuer';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CertificateCreatedEvent } from '../events/certificate-created-event';
import { BlockchainPropertiesService } from '../../blockchain/blockchain-properties.service';
import { Certificate } from '../certificate.entity';

@EventsHandler(CertificateCreatedEvent)
export class CertificateCreatedHandler implements IEventHandler<CertificateCreatedEvent> {
    constructor(
        @InjectRepository(Certificate)
        private readonly repository: Repository<Certificate>,
        private readonly blockchainPropertiesService: BlockchainPropertiesService
    ) {}

    async handle(event: CertificateCreatedEvent): Promise<Certificate> {
        const blockchainProperties = await this.blockchainPropertiesService.get();

        const cert = await new CertificateFacade(
            event.certificateId,
            blockchainProperties.wrap()
        ).sync();

        const certificateOwners = await CertificateUtils.calculateOwnership(
            event.certificateId,
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
