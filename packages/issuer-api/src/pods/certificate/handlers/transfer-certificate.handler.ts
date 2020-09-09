import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate as CertificateFacade, CertificateUtils } from '@energyweb/issuer';
import { BigNumber } from 'ethers';
import { ISuccessResponse } from '@energyweb/origin-backend-core';
import { BadRequestException } from '@nestjs/common';
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

        const onChainCert = await new CertificateFacade(
            certificate.tokenId,
            certificate.blockchain.wrap()
        ).sync();

        if (certificate.issuedPrivately) {
            const senderBalance = BigNumber.from(certificate.privateOwners[from] ?? 0);
            const receiverBalance = BigNumber.from(certificate.privateOwners[to] ?? 0);
            const amountToTransfer = BigNumber.from(amount);

            if (amountToTransfer > senderBalance) {
                throw new BadRequestException({
                    success: false,
                    message: `Sender ${from} has a balance of ${senderBalance.toString()} but wants to send ${amount}`
                });
            }

            const newSenderBalance = senderBalance.sub(amountToTransfer);
            const newReceiverBalance = receiverBalance.add(amountToTransfer);

            await this.repository.update(certificateId, {
                privateOwners: {
                    ...certificate.privateOwners,
                    [from]: newSenderBalance.toString(),
                    [to]: newReceiverBalance.toString()
                }
            });
        } else {
            try {
                await onChainCert.transfer(to, amount ? BigNumber.from(amount) : null, from);
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
        }

        return {
            success: true
        };
    }
}
