import { Request, Response } from "express";
import { getRepository } from "typeorm";

import { MarketContractLookup } from "../../entity/MarketContractLookup";
import { STATUS_CODES } from '../../enums/StatusCodes';
import { StorageErrors } from '../../enums/StorageErrors';

export class MarketContractLookupActions {
    static async get(req: Request, res: Response) {
        console.log(`GET - MarketContractLookup`);
        const marketContractLookupRepository = getRepository(MarketContractLookup);
    
        const contracts: MarketContractLookup[] = await marketContractLookupRepository.find();
    
        res.send(
            contracts.map(contract => contract.address)
        );
    }

    static async post(req: Request, res: Response) {
        let { value } = req.body;
        value = value.toLowerCase();
    
        console.log(`POST - MarketContractLookup: ${value}`);
    
        const marketContractLookupRepository = getRepository(MarketContractLookup);
        const marketContracts: MarketContractLookup[] = await marketContractLookupRepository.find();
        const marketAddresses: string[] = marketContracts.map(contract => contract.address);
    
        if (marketAddresses.includes(value)) {
            res.status(STATUS_CODES.SUCCESS).send({
                message: StorageErrors.ALREADY_EXISTS
            });
    
            return;
        }
    
        const newMarketContractLookup = new MarketContractLookup();
        newMarketContractLookup.address = value.toLowerCase();
    
        await marketContractLookupRepository.save(newMarketContractLookup);
    
        res.status(STATUS_CODES.CREATED).send({
            message: `MarketContractLookup ${value} created`
        });
    }

    static async delete(req: Request, res: Response) {
        let { value } = req.body;
        value = value.toLowerCase();
    
        console.log(`DELETE - MarketContractLookup ${value}`);
    
        const marketContractLookupRepository = getRepository(MarketContractLookup);
        const marketContractLookup: MarketContractLookup = await marketContractLookupRepository.findOne(value);
    
        if (!marketContractLookup) {
            res.status(STATUS_CODES.NOT_FOUND).send({
                error: StorageErrors.NON_EXISTENT
            });
    
            return;
        }
    
        await marketContractLookupRepository.remove(marketContractLookup);
    
        res.status(STATUS_CODES.NO_CONTENT).send({
            message: `MarketContractLookup ${value} successfully deleted`
        });
    }
}
