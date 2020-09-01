import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CqrsModule } from '@nestjs/cqrs';
import { CertificationRequest } from './certification-request.entity';
import { CertificationRequestController } from './certification-request.controller';
import { BlockchainPropertiesModule } from '../blockchain/blockchain-properties.module';
import { Handlers } from './handlers';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([CertificationRequest]),
        BlockchainPropertiesModule
    ],
    controllers: [CertificationRequestController],
    providers: [...Handlers],
    exports: [...Handlers]
})
export class CertificationRequestModule {}
