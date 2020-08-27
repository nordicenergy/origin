export class IssueCertificateCommand {
    constructor(
        public readonly netId: number,
        public readonly to: string,
        public readonly value: string,
        public readonly fromTime: number,
        public readonly toTime: number,
        public readonly deviceId: string
    ) {}
}
