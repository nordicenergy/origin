import { GetAllCertificatesHandler } from './get-all-certificates.handler';
import { IssueCertificateHandler } from './issue-certificate.handler';
import { TransferCertificateHandler } from './transfer-certificate.handler';
import { GetCertificateHandler } from './get-certificate.handler';

export const Handlers = [
    GetAllCertificatesHandler,
    IssueCertificateHandler,
    TransferCertificateHandler,
    GetCertificateHandler
];
