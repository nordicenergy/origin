import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate as CertificateFacade, CertificateUtils } from '@energyweb/issuer';
import { BigNumber } from 'ethers';
import { ISuccessResponse } from '@energyweb/origin-backend-core';
import { TransferCertificateCommand } from '../commands/transfer-certificate.command';
import { Certificate } from '../certificate.entity';

@CommandHandler(TransferCertificateCommand)
export class TransferCertificateHandler implements ICommandHandler<TransferCertificateCommand> {
    constructor(
        @InjectRepository(Certificate)
        private readonly repository: Repository<Certificate>
    ) {}

    async execute(command: TransferCertificateCommand): Promise<ISuccessResponse> {
        const { certificateId, from, to, amount } = command;

        const certificate = await this.repository.findOne(
            { id: certificateId },
            { relations: ['blockchain'] }
        );

        const cert = await new CertificateFacade(
            certificate.tokenId,
            certificate.blockchain.wrap()
        ).sync();

        try {
            await cert.transfer(to, amount ? BigNumber.from(amount) : null, from);
        } catch (error) {
            return {
                success: false,
                message: JSON.stringify(error)
            };
        }

        const newOwners = await CertificateUtils.calculateOwnership(
            certificate.tokenId,
            certificate.blockchain.wrap()
        );

        await this.repository.update(certificateId, {
            owners: newOwners
        });

        return {
            success: true
        };
    }
}
