import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BigNumber } from 'ethers';
import { CertificationRequest as CertificationRequestFacade } from '@energyweb/issuer';

import { BadRequestException } from '@nestjs/common';
import {
    ApproveCertificationRequestCommand,
    IApproveCertificationRequestResult
} from '../commands/approve-certification-request.command';
import { CertificationRequest } from '../certification-request.entity';
import { BlockchainPropertiesService } from '../../blockchain/blockchain-properties.service';
import { CertificateCreatedEvent } from '../../certificate/events/certificate-created-event';

@CommandHandler(ApproveCertificationRequestCommand)
export class ApproveCertificationRequestHandler
    implements ICommandHandler<ApproveCertificationRequestCommand> {
    constructor(
        @InjectRepository(CertificationRequest)
        private readonly repository: Repository<CertificationRequest>,
        private readonly blockchainPropertiesService: BlockchainPropertiesService,
        private readonly eventBus: EventBus
    ) {}

    async execute(
        command: ApproveCertificationRequestCommand
    ): Promise<IApproveCertificationRequestResult> {
        const { id } = command;

        const certificationRequest = await this.repository.findOne(id);

        if (certificationRequest.approved) {
            throw new BadRequestException({
                success: false,
                message: `Certificate #${id} has already been approved`
            });
        }

        const blockchainProperties = await this.blockchainPropertiesService.get();

        const certReq = await new CertificationRequestFacade(
            id,
            blockchainProperties.wrap()
        ).sync();

        let newCertificateId;

        try {
            newCertificateId = await certReq.approve(BigNumber.from(certificationRequest.energy));
        } catch (e) {
            return {
                success: false,
                message: e.message
            };
        }

        const certificateId = await this.eventBus.publish(
            new CertificateCreatedEvent(newCertificateId)
        );
        console.log({
            certificateId
        });

        await this.repository.update(id, { approved: true });

        return {
            success: true,
            message: `Successfully approved certificationRequest ${id}. Created a new certificate with the ID ${certificateId}`,
            newCertificateId: certificateId
        };
    }
}
