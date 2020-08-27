export class IssueCertificateCommand {
    constructor(
        public netId: number,
        public to: string,
        public value: string,
        public fromTime: number,
        public toTime: number,
        public deviceId: string
    ) {}
}
