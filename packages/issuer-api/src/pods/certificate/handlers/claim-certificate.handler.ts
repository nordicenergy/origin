import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate as CertificateFacade, CertificateUtils } from '@energyweb/issuer';
import { BigNumber } from 'ethers';
import { ISuccessResponse } from '@energyweb/origin-backend-core';
import { BadRequestException } from '@nestjs/common';
import { ClaimCertificateCommand } from '../commands/claim-certificate.command';
import { Certificate } from '../certificate.entity';

@CommandHandler(ClaimCertificateCommand)
export class ClaimCertificateHandler implements ICommandHandler<ClaimCertificateCommand> {
    constructor(
        @InjectRepository(Certificate)
        private readonly repository: Repository<Certificate>
    ) {}

    async execute(command: ClaimCertificateCommand): Promise<ISuccessResponse> {
        const { certificateId, claimData, forAddress, amount } = command;

        const certificate = await this.repository.findOne(
            { id: certificateId },
            { relations: ['blockchain'] }
        );

        const cert = await new CertificateFacade(
            certificate.tokenId,
            certificate.blockchain.wrap()
        ).sync();

        if (certificate.issuedPrivately) {
            const claimerPrivateBalance = BigNumber.from(
                certificate.privateOwners[forAddress] ?? 0
            );
            const amountToClaim = BigNumber.from(amount);

            if (amountToClaim > claimerPrivateBalance) {
                throw new BadRequestException({
                    success: false,
                    message: `Claimer ${forAddress} has a private balance of ${claimerPrivateBalance.toString()} but wants to claim ${amount}.`
                });
            }
        }

        try {
            await cert.claim(
                claimData,
                BigNumber.from(amount ?? certificate.owners[forAddress]),
                forAddress,
                forAddress
            );
        } catch (error) {
            return {
                success: false,
                message: JSON.stringify(error)
            };
        }

        const updatedOwners = await CertificateUtils.calculateOwnership(
            certificate.tokenId,
            certificate.blockchain.wrap()
        );

        const updatedClaimers = await CertificateUtils.calculateClaims(
            certificate.tokenId,
            certificate.blockchain.wrap()
        );

        const claims = await cert.getClaimedData();

        await this.repository.update(certificateId, {
            owners: updatedOwners,
            claimers: updatedClaimers,
            claims
        });

        return {
            success: true
        };
    }
}
