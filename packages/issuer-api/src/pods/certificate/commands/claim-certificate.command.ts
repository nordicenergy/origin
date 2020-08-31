import { IClaimData } from '@energyweb/issuer';

export class ClaimCertificateCommand {
    constructor(
        public readonly certificateId: number,
        public readonly claimData: IClaimData,
        public readonly from: string,
        public readonly to: string,
        public readonly amount?: string
    ) {}
}
