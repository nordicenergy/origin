/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contracts } from '@energyweb/issuer';
import { UserStatus } from '@energyweb/origin-backend-core';
import { RolesGuard } from '@energyweb/origin-backend-utils';
import { CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { getProviderWithFallback } from '@energyweb/utils-general';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { useContainer } from 'class-validator';

import { entities } from '../src';
import { AppModule } from '../src/app.module';
import { DatabaseService } from './database.service';
import { BlockchainPropertiesService } from '../src/pods/blockchain/blockchain-properties.service';

const web3 = 'http://localhost:8581';
const provider = getProviderWithFallback(web3);

// ganache account 2
const registryDeployer = '0xc4b87d68ea2b91f9d3de3fcb77c299ad962f006ffb8711900cb93d94afec3dc3';

const deployRegistry = async () => {
    return Contracts.migrateRegistry(provider, registryDeployer);
};

const deployIssuer = async (registry: string) => {
    return Contracts.migrateIssuer(provider, registryDeployer, registry);
};

export const authenticatedUser = { id: 1, organization: { id: '1000' }, status: UserStatus.Active };

const authGuard: CanActivate = {
    canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = authenticatedUser;

        return true;
    }
};

const testLogger = new Logger('e2e');

export const bootstrapTestInstance = async () => {
    const registry = await deployRegistry();
    const issuer = await deployIssuer(registry.address);

    const moduleFixture = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: Number(process.env.DB_PORT) ?? 5432,
                username: process.env.DB_USERNAME ?? 'postgres',
                password: process.env.DB_PASSWORD ?? 'postgres',
                database: process.env.DB_DATABASE ?? 'origin',
                entities,
                logging: ['info']
            }),
            AppModule
        ],
        providers: [DatabaseService]
    })
        .overrideGuard(AuthGuard('default'))
        .useValue(authGuard)
        .overrideGuard(RolesGuard)
        .useValue(authGuard)
        .compile();

    const app = moduleFixture.createNestApplication();

    const blockchainPropertiesService = await app.resolve<BlockchainPropertiesService>(
        BlockchainPropertiesService
    );
    const databaseService = await app.resolve<DatabaseService>(DatabaseService);

    await blockchainPropertiesService.create(
        provider.network.chainId,
        registry.address,
        issuer.address,
        web3,
        registryDeployer
    );

    app.useLogger(testLogger);
    app.enableCors();

    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    return {
        databaseService,
        registry,
        issuer,
        provider,
        app
    };
};
