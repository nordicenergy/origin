import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommandBus, QueryBus, CqrsModule } from '@nestjs/cqrs';
import { Certificate } from './certificate.entity';
import { CertificateController } from './certificate.controller';
import { Handlers } from './handlers';
import { BlockchainPropertiesModule } from '../blockchain/blockchain-properties.module';

@Module({
    imports: [CqrsModule, TypeOrmModule.forFeature([Certificate]), BlockchainPropertiesModule],
    controllers: [CertificateController],
    providers: [CommandBus, QueryBus, ...Handlers],
    exports: [...Handlers]
})
export class CertificateModule {}
