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
        const devId = 'ABC-123';
        const fromTime = moment().subtract(2, 'month').unix();
        const toTime = moment().subtract(1, 'month').unix();

        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                netId: provider.network.chainId,
                to: '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8', // ganache address #1
                value: '1000000',
                fromTime,
                toTime,
                deviceId: devId
            })
            .expect(201)
            .expect((res) => {
                const {
                    deviceId,
                    generationStartTime,
                    generationEndTime,
                    creationTime,
                    creationBlockHash,
                    tokenId
                } = res.body;

                expect(deviceId).to.equal(devId);
                expect(fromTime).to.equal(generationStartTime);
                expect(toTime).to.equal(generationEndTime);
                expect(creationTime).to.be.above(1);
                expect(creationBlockHash);
                expect(tokenId).to.be.above(-1);
            });

        await request(app.getHttpServer())
            .get(`/certificate`)
            .expect(200)
            .expect((res) => {
                expect(res.body);
            });
    });
});
