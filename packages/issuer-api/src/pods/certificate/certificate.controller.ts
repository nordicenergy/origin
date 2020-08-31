import { ActiveUserGuard, UserDecorator } from '@energyweb/origin-backend-utils';
import {
    Body,
    Controller,
    Get,
    Logger,
    Post,
    UseGuards,
    Param,
    ParseIntPipe,
    Put
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ISuccessResponse, ILoggedInUser } from '@energyweb/origin-backend-core';

import { IssueCertificateCommand } from './commands/issue-certificate.command';
import { IIssueCertificateDTO } from './commands/issue-certificate.dto';
import { Certificate } from './certificate.entity';
import { GetAllCertificatesQuery } from './queries/get-all-certificates.query';
import { GetCertificateQuery } from './queries/get-certificate.query';
import { TransferCertificateCommand } from './commands/transfer-certificate.command';
import { ITransferCertificateDTO } from './commands/transfer-certificate.dto';
import { IClaimCertificateDTO } from './commands/claim-certificate.dto';
import { ClaimCertificateCommand } from './commands/claim-certificate.command';

@Controller('certificate')
export class CertificateController {
    private readonly logger = new Logger(CertificateController.name);

    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

    @Get('/:id')
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async get(@Param('id', new ParseIntPipe()) id: number): Promise<Certificate> {
        return this.queryBus.execute(new GetCertificateQuery(id));
    }

    @Get()
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async getAll(): Promise<Certificate[]> {
        return this.queryBus.execute(new GetAllCertificatesQuery());
    }

    @Post()
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async issue(@Body() dto: IIssueCertificateDTO): Promise<Certificate> {
        return this.commandBus.execute(
            new IssueCertificateCommand(
                dto.netId,
                dto.to,
                dto.value,
                dto.fromTime,
                dto.toTime,
                dto.deviceId
            )
        );
    }

    @Put('/:id/transfer')
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async transfer(
        @UserDecorator() { blockchainAccountAddress }: ILoggedInUser,
        @Param('id', new ParseIntPipe()) certificateId: number,
        @Body() dto: ITransferCertificateDTO
    ): Promise<ISuccessResponse> {
        return this.commandBus.execute(
            new TransferCertificateCommand(
                certificateId,
                blockchainAccountAddress,
                dto.to,
                dto.amount
            )
        );
    }

    @Put('/:id/claim')
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async claim(
        @UserDecorator() { blockchainAccountAddress }: ILoggedInUser,
        @Param('id', new ParseIntPipe()) certificateId: number,
        @Body() dto: IClaimCertificateDTO
    ): Promise<ISuccessResponse> {
        return this.commandBus.execute(
            new ClaimCertificateCommand(
                certificateId,
                dto.claimData,
                blockchainAccountAddress,
                blockchainAccountAddress,
                dto.amount
            )
        );
    }
}
