import { ActiveUserGuard } from '@energyweb/origin-backend-utils';
import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { IssueCertificateCommand } from './commands/issue-certificate.command';
import { IIssueCertificateDTO } from './commands/issue-certificate.dto';
import { Certificate } from './certificate.entity';
import { GetAllCertificatesQuery } from './queries/get-all-certificates.query';

@Controller('certificate')
export class CertificateController {
    private readonly logger = new Logger(CertificateController.name);

    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

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
}
