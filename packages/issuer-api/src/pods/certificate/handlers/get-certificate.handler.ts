import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../certificate.entity';
import { GetCertificateQuery } from '../queries/get-certificate.query';

@QueryHandler(GetCertificateQuery)
export class GetCertificateHandler implements IQueryHandler<GetCertificateQuery> {
    constructor(
        @InjectRepository(Certificate)
        private readonly repository: Repository<Certificate>
    ) {}

    async execute(query: GetCertificateQuery): Promise<Certificate> {
        console.log({ query, allCertificates: await this.repository.find() });

        const certificate = await this.repository.findOne(query.id);

        console.log({
            certificate
        });

        return certificate;
    }
}
