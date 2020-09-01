export interface ICreateCertificationRequestDTO {
    to: string;
    energy: string;
    fromTime: number;
    toTime: number;
    deviceId: string;
    files?: string[];
}
