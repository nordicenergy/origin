import { IClaimData } from '@energyweb/issuer';

export interface IClaimCertificateDTO {
    claimData: IClaimData;
    amount?: string;
}
