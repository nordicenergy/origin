/* eslint-disable no-unused-expressions */
import { INestApplication } from '@nestjs/common';
import { expect } from 'chai';
import request from 'supertest';

import moment from 'moment';
import { IClaimData, IClaim } from '@energyweb/issuer';
import { DatabaseService } from './database.service';
import { bootstrapTestInstance, deviceManager, registryDeployer } from './issuer-api';

const certificateTestData = {
    to: deviceManager.address,
    deviceId: 'ABC-123',
    fromTime: moment().subtract(2, 'month').unix(),
    toTime: moment().subtract(1, 'month').unix(),
    energy: '1000000'
};

describe('Certificate tests', () => {
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

    it('should deploy and create a certificate entry in the DB', async () => {
        await request(app.getHttpServer())
            .post('/certificate')
            .send(certificateTestData)
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

                expect(deviceId).to.equal(certificateTestData.deviceId);
                expect(certificateTestData.fromTime).to.equal(generationStartTime);
                expect(certificateTestData.toTime).to.equal(generationEndTime);
                expect(creationTime).to.be.above(1);
                expect(creationBlockHash);
                expect(tokenId).to.be.above(-1);
                expect(owners[deviceManager.address]).to.equal(certificateTestData.energy);
            });

        await request(app.getHttpServer())
            .get(`/certificate`)
            .expect(200)
            .expect((res) => {
                expect(res.body.length).to.equal(1);
            });
    });

    it('should transfer a certificate', async () => {
        let certificateId: number;

        await request(app.getHttpServer())
            .post('/certificate')
            .send(certificateTestData)
            .expect(201)
            .expect((res) => {
                const { id, owners } = res.body;
                certificateId = id;

                expect(owners[deviceManager.address]).to.equal(certificateTestData.energy);
            });

        await request(app.getHttpServer())
            .put(`/certificate/${certificateId}/transfer`)
            .send({
                to: registryDeployer.address,
                amount: certificateTestData.energy
            })
            .expect(200)
            .expect((transferResponse) => {
                expect(transferResponse.body.success).to.be.true;
            });

        await request(app.getHttpServer())
            .get(`/certificate/${certificateId}`)
            .expect(200)
            .expect((getResponse) => {
                const { owners: newOwners } = getResponse.body;

                expect(newOwners[registryDeployer.address]).to.equal(certificateTestData.energy);
            });
    });

    it('should claim a certificate', async () => {
        const value = '1000000';
        const claimData: IClaimData = {
            beneficiary: 'Testing beneficiary 1234',
            address: 'Random address 123, Somewhere',
            region: 'Northernmost Region',
            zipCode: '321-45',
            countryCode: 'DE'
        };

        let certificateId: number;

        await request(app.getHttpServer())
            .post('/certificate')
            .send(certificateTestData)
            .expect(201)
            .expect((res) => {
                certificateId = res.body.id;
            });

        await request(app.getHttpServer())
            .put(`/certificate/${certificateId}/claim`)
            .send({ claimData })
            .expect(200)
            .expect((claimResponse) => {
                expect(claimResponse.body.success).to.be.true;
            });

        await request(app.getHttpServer())
            .get(`/certificate/${certificateId}`)
            .expect(200)
            .expect((getResponse) => {
                const { claimers, claims, owners } = getResponse.body;

                expect(owners[deviceManager.address]).to.equal('0');
                expect(claimers[deviceManager.address]).to.equal(value);
                expect(
                    claims.some(
                        (claim: IClaim) =>
                            claim.to === deviceManager.address &&
                            claim.from === deviceManager.address &&
                            JSON.stringify(claim.claimData) === JSON.stringify(claimData) &&
                            claim.value === parseInt(value, 10)
                    )
                ).to.be.true;
            });
    });

    it('should create a private certificate', async () => {
        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                ...certificateTestData,
                isPrivate: true
            })
            .expect(201)
            .expect((res) => {
                const { privateOwners } = res.body;

                expect(privateOwners[deviceManager.address]).to.equal(certificateTestData.energy);
            });
    });

    it('should transfer a private certificate', async () => {
        let certificateId;

        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                ...certificateTestData,
                isPrivate: true
            })
            .expect(201)
            .expect((res) => {
                certificateId = res.body.id;
                const { privateOwners } = res.body;

                expect(privateOwners[deviceManager.address]).to.equal(certificateTestData.energy);
                expect(privateOwners[registryDeployer.address]).to.equal(undefined);
            });

        await request(app.getHttpServer())
            .put(`/certificate/${certificateId}/transfer`)
            .send({
                to: registryDeployer.address,
                amount: certificateTestData.energy
            })
            .expect(200)
            .expect((transferResponse) => {
                expect(transferResponse.body.success).to.be.true;
            });

        await request(app.getHttpServer())
            .get(`/certificate/${certificateId}`)
            .expect(200)
            .expect((getResponse) => {
                const { privateOwners } = getResponse.body;

                expect(privateOwners[deviceManager.address]).to.equal('0');
                expect(privateOwners[registryDeployer.address]).to.equal(
                    certificateTestData.energy
                );
            });
    });

    it('should claim a private certificate', async () => {
        const value = '1000000';
        const claimData: IClaimData = {
            beneficiary: 'Testing beneficiary 1234',
            address: 'Random address 123, Somewhere',
            region: 'Northernmost Region',
            zipCode: '321-45',
            countryCode: 'DE'
        };

        let certificateId: number;

        await request(app.getHttpServer())
            .post('/certificate')
            .send({
                ...certificateTestData,
                isPrivate: false
            })
            .expect(201)
            .expect((res) => {
                certificateId = res.body.id;
            });

        await request(app.getHttpServer())
            .put(`/certificate/${certificateId}/claim`)
            .send({ claimData })
            .expect(200)
            .expect((claimResponse) => {
                expect(claimResponse.body.success).to.be.true;
            });

        await request(app.getHttpServer())
            .get(`/certificate/${certificateId}`)
            .expect(200)
            .expect((getResponse) => {
                const { claimers, claims, privateOwners } = getResponse.body;

                expect(privateOwners[deviceManager.address]).to.equal('0');
                expect(claimers[deviceManager.address]).to.equal(value);
                expect(
                    claims.some(
                        (claim: IClaim) =>
                            claim.to === deviceManager.address &&
                            claim.from === deviceManager.address &&
                            JSON.stringify(claim.claimData) === JSON.stringify(claimData) &&
                            claim.value === parseInt(value, 10)
                    )
                ).to.be.true;
            });
    });
});
