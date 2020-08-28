/* eslint-disable no-unused-expressions */
import { INestApplication } from '@nestjs/common';
import { expect } from 'chai';
import request from 'supertest';

import { providers } from 'ethers';
import moment from 'moment';
import { DatabaseService } from './database.service';
import { bootstrapTestInstance, deviceManager, registryDeployer } from './issuer-api';

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

        const value = '1000000';

        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                netId: provider.network.chainId,
                to: deviceManager.address, // ganache address #1
                value,
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
                    tokenId,
                    owners
                } = res.body;

                expect(deviceId).to.equal(devId);
                expect(fromTime).to.equal(generationStartTime);
                expect(toTime).to.equal(generationEndTime);
                expect(creationTime).to.be.above(1);
                expect(creationBlockHash);
                expect(tokenId).to.be.above(-1);
                expect(owners[deviceManager.address]).to.equal(value);
            });

        await request(app.getHttpServer())
            .get(`/certificate`)
            .expect(200)
            .expect((res) => {
                expect(res.body);
            });
    });

    it('should transfer a certificate', async () => {
        const value = '1000000';

        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                netId: provider.network.chainId,
                to: deviceManager.address,
                value,
                fromTime: moment().subtract(2, 'month').unix(),
                toTime: moment().subtract(1, 'month').unix(),
                deviceId: 'ABC-123'
            })
            .expect(201)
            .expect(async (res) => {
                const { id, owners } = res.body;
                console.log({
                    id
                });

                expect(owners[deviceManager.address]).to.equal(value);

                await request(app.getHttpServer())
                    .put(`/certificate/${id}`)
                    .send({
                        to: registryDeployer.address,
                        amount: value
                    })
                    .expect(200)
                    .expect((transferResponse) => {
                        expect(transferResponse.body.success).to.be.true;
                    });

                await request(app.getHttpServer())
                    .get(`/certificate/${id}`)
                    .expect(200)
                    .expect((getResponse) => {
                        console.log({
                            body: getResponse.body
                        });
                        const { owners: newOwners } = getResponse.body;

                        expect(newOwners[registryDeployer.address]).to.equal(value);
                    });
            });
    });
});
