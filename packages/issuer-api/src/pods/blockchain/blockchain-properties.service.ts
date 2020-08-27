import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockchainProperties } from './blockchain-properties.entity';

export class BlockchainPropertiesService {
    constructor(
        @InjectRepository(BlockchainProperties)
        private readonly repository: Repository<BlockchainProperties>
    ) {}

    public async create(
        netId: number,
        registry: string,
        issuer: string,
        rpcNode: string,
        platformOperatorPrivateKey: string,
        rpcNodeFallback?: string
    ): Promise<BlockchainProperties> {
        const blockchain = this.repository.create({
            netId,
            registry,
            issuer,
            rpcNode,
            rpcNodeFallback,
            platformOperatorPrivateKey
        });

        return this.repository.save(blockchain);
    }

    public async get(netId: number): Promise<BlockchainProperties> {
        return this.repository.findOne({ netId });
    }
}
