/* eslint-disable no-unused-expressions */
import { INestApplication } from '@nestjs/common';
import { expect } from 'chai';
import request from 'supertest';

import moment from 'moment';
import { DatabaseService } from './database.service';
import { bootstrapTestInstance, deviceManager } from './issuer-api';

describe('Certification Request tests', () => {
    let app: INestApplication;
    let databaseService: DatabaseService;

    before(async () => {
        ({ databaseService, app } = await bootstrapTestInstance());

        await app.init();
    });

    after(async () => {
        await databaseService.cleanUp();
        await app.close();
    });

    it('should deploy and create a certification request + entry in the DB', async () => {
        const devId = 'ABC-123';
        const generationStartTime = moment().subtract(2, 'month').unix();
        const generationEndTime = moment().subtract(1, 'month').unix();
        const proofFiles = ['test.pdf', 'test2.pdf'];

        const energyGenerated = '1000000';

        await request(app.getHttpServer())
            .post('/certification-request')
            .send({
                to: deviceManager.address,
                energy: energyGenerated,
                fromTime: generationStartTime,
                toTime: generationEndTime,
                deviceId: devId,
                files: proofFiles
            })
            .expect(201)
            .expect((res) => {
                const {
                    deviceId,
                    fromTime,
                    toTime,
                    created,
                    requestId,
                    owner,
                    approved,
                    revoked,
                    files,
                    energy
                } = res.body;

                expect(deviceId).to.equal(devId);
                expect(fromTime).to.equal(generationStartTime);
                expect(toTime).to.equal(generationEndTime);
                expect(created).to.be.above(1);
                expect(requestId).to.be.above(-1);
                expect(owner).to.equal(deviceManager.address);
                expect(approved).to.be.false;
                expect(revoked).to.be.false;
                expect(JSON.stringify(files)).to.equal(JSON.stringify(proofFiles));
                expect(energy).to.equal(energyGenerated);
            });

        await request(app.getHttpServer())
            .get(`/certification-request`)
            .expect(200)
            .expect((res) => {
                expect(res.body.length).to.equal(1);
            });
    });
});
