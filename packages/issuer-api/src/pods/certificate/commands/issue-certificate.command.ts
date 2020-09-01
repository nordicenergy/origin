export class IssueCertificateCommand {
    constructor(
        public readonly to: string,
        public readonly energy: string,
        public readonly fromTime: number,
        public readonly toTime: number,
        public readonly deviceId: string
    ) {}
}
