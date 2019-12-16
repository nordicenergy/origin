import axios, { AxiosResponse } from 'axios';
import 'mocha';
import dotenv from 'dotenv';
import { assert } from 'chai';
import * as fs from 'fs';
import * as http from 'http';

import { startAPI } from '../..';
import { STATUS_CODES } from '../../enums/StatusCodes';
import { StorageErrors }  from '../../enums/StorageErrors';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Currency API tests', async () => {
    dotenv.config({
        path: '.env.test'
    });
    let apiServer: http.Server;

    const BASE_API_URL = `http://localhost:${process.env.PORT}/api`;

    const currency = 'USD';
    const currency2 = 'EUR';

    beforeEach(async () => {
        apiServer = await startAPI();
    });

    afterEach(async () => {
        await apiServer.close();
        await sleep(100);

        try {
            fs.unlinkSync('db.sqlite');
        } catch (err) {
            return;
        }
    });

    describe('GET', () => {
        it('gets empty array when no currencies were set', async () => {
            const getResult: AxiosResponse = await axios.get(`${BASE_API_URL}/Currency`);

            assert.isEmpty(getResult.data);
            assert.deepEqual(getResult.data, []);
        });

        it('returns all currencies', async () => {
            await axios.post(`${BASE_API_URL}/Currency/${currency}`);
            await axios.post(`${BASE_API_URL}/Currency/${currency2}`);

            const getResult: AxiosResponse = await axios.get(`${BASE_API_URL}/Currency`);

            assert.deepEqual(
                getResult.data,
                [currency, currency2]
            );
        });
    });

    describe('POST', () => {
        it('creates a Currency', async () => {
            const postResult: AxiosResponse = await axios.post(
                `${BASE_API_URL}/Currency/${currency}`
            );
    
            assert.equal(postResult.status, STATUS_CODES.CREATED);
            assert.equal(postResult.data.message, `Currency ${currency} created`);
        });

        it('fails creating the same Currency', async () => {
            await axios.post(
                `${BASE_API_URL}/Currency/${currency}`
            );
    
            let failed = false;
    
            try {
                await axios.post(
                    `${BASE_API_URL}/Currency/${currency}`
                );
            } catch (error) {
                const { status, data } = error.response;

                assert.equal(status, STATUS_CODES.CONFLICT);
                assert.equal(data.error, StorageErrors.ALREADY_EXISTS);
                failed = true;
            }
    
            assert.isTrue(failed);
        });

    });

    describe('DELETE', () => {
        it('deletes a currency', async () => {
            await axios.post(
                `${BASE_API_URL}/Currency/${currency}`
            );
    
            const deleteResult = await axios.delete(
                `${BASE_API_URL}/Currency/${currency}`
            );
            assert.equal(deleteResult.status, STATUS_CODES.NO_CONTENT);
    
            let failed: boolean = false;
    
            try {
                await axios.delete(`${BASE_API_URL}/Currency/${currency}`);
            } catch (error) {
                const { status, data } = error.response;
                assert.equal(status, STATUS_CODES.NOT_FOUND);
                assert.equal(data.error, StorageErrors.NON_EXISTENT);
                failed = true;
            }
    
            assert.isTrue(failed);
        });
    });

});
