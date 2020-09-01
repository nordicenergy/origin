import { ISuccessResponse } from '@energyweb/origin-backend-core';

export class ApproveCertificationRequestCommand {
    constructor(public readonly id: number) {}
}

export interface IApproveCertificationRequestResult extends ISuccessResponse {
    newCertificateId?: number;
}
