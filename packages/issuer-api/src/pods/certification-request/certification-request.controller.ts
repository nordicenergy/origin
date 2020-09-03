import { ActiveUserGuard, RolesGuard, Roles } from '@energyweb/origin-backend-utils';
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
import { Role, ISuccessResponse } from '@energyweb/origin-backend-core';

import { CreateCertificationRequestCommand } from './commands/create-certification-request.command';
import { ICreateCertificationRequestDTO } from './commands/create-certification-request.dto';
import { CertificationRequest } from './certification-request.entity';
import { GetAllCertificationRequestsQuery } from './queries/get-all-certification-requests.query';
import { GetCertificationRequestQuery } from './queries/get-certification-request.query';
import { ApproveCertificationRequestCommand } from './commands/approve-certification-request.command';
import { RevokeCertificationRequestCommand } from './commands/revoke-certification-request.command';

@Controller('certification-request')
export class CertificationRequestController {
    private readonly logger = new Logger(CertificationRequestController.name);

    constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

    @Get('/:id')
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async get(@Param('id', new ParseIntPipe()) id: number): Promise<CertificationRequest> {
        return this.queryBus.execute(new GetCertificationRequestQuery(id));
    }

    @Get()
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async getAll(): Promise<CertificationRequest[]> {
        return this.queryBus.execute(new GetAllCertificationRequestsQuery());
    }

    @Post()
    @UseGuards(AuthGuard(), ActiveUserGuard)
    public async create(
        @Body() dto: ICreateCertificationRequestDTO
    ): Promise<CertificationRequest> {
        return this.commandBus.execute(
            new CreateCertificationRequestCommand(
                dto.to,
                dto.energy,
                dto.fromTime,
                dto.toTime,
                dto.deviceId,
                dto.files
            )
        );
    }

    @Put('/:id/approve')
    @UseGuards(AuthGuard(), ActiveUserGuard, RolesGuard)
    @Roles(Role.Issuer, Role.Admin)
    public async approve(@Param('id', new ParseIntPipe()) id: number): Promise<ISuccessResponse> {
        return this.commandBus.execute(new ApproveCertificationRequestCommand(id));
    }

    @Put('/:id/revoke')
    @UseGuards(AuthGuard(), ActiveUserGuard, RolesGuard)
    @Roles(Role.Issuer, Role.Admin)
    public async revoke(@Param('id', new ParseIntPipe()) id: number): Promise<ISuccessResponse> {
        return this.commandBus.execute(new RevokeCertificationRequestCommand(id));
    }
}
