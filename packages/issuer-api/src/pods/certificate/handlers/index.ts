import { GetAllCertificatesHandler } from './get-all-certificates.handler';
import { IssueCertificateHandler } from './issue-certificate.handler';
import { TransferCertificateHandler } from './transfer-certificate.handler';
import { GetCertificateHandler } from './get-certificate.handler';
import { ClaimCertificateHandler } from './claim-certificate.handler';
import { GetCertificateByTokenIdHandler } from './get-certificate-by-token.handler';
import { CertificateCreatedHandler } from './certificate-created.handler';

export const Handlers = [
    GetAllCertificatesHandler,
    IssueCertificateHandler,
    TransferCertificateHandler,
    GetCertificateHandler,
    ClaimCertificateHandler,
    GetCertificateByTokenIdHandler,
    CertificateCreatedHandler
];
