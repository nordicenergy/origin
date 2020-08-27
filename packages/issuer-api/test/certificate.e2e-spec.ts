import { INestApplication } from '@nestjs/common';
import { expect } from 'chai';
import request from 'supertest';

import { providers } from 'ethers';
import moment from 'moment';
import { DatabaseService } from './database.service';
import { bootstrapTestInstance } from './issuer-api';

describe('Certificate tests', () => {
    let app: INestApplication;
    let databaseService: DatabaseService;
    let provider: providers.FallbackProvider;

    before(async () => {
        ({ databaseService, app, provider } = await bootstrapTestInstance());

        await app.init();
    });

    after(async () => {
        await databaseService.cleanUp();
        await app.close();
    });

    it('should deploy and create a certificate entry in the DB', async () => {
        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                netId: provider.network.chainId,
                to: '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8', // ganache address #1
                value: '1000000',
                fromTime: moment().subtract(2, 'month').unix(),
                toTime: moment().subtract(1, 'month').unix(),
                deviceId: 'ABC-123'
            })
            .expect(201)
            .expect((res) => {
                console.log(res.body);

                expect(res.body);
            });

        await request(app.getHttpServer())
            .get(`/certificate`)
            .expect(200)
            .expect((res) => {
                console.log(res.body);

                expect(res.body);
            });
    });
});
