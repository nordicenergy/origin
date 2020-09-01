import { ActiveUserGuard } from '@energyweb/origin-backend-utils';
import {
    Body,
    Controller,
    Get,
    Logger,
    Post,
    UseGuards,
    Param,
    ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateCertificationRequestCommand } from './commands/create-certification-request.command';
import { ICreateCertificationRequestDTO } from './commands/create-certification-request.dto';
import { CertificationRequest } from './certification-request.entity';
import { GetAllCertificationRequestsQuery } from './queries/get-all-certification-requests.query';
import { GetCertificationRequestQuery } from './queries/get-certification-request.query';

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
}
