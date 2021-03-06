import { BigNumber } from 'ethers';
import { IOrganization } from '.';

export enum DeviceStatus {
    Submitted,
    Denied,
    Active
}

export interface IExternalDeviceId {
    id: string;
    type: string;
}

export type ExternalDeviceIdType = Pick<IExternalDeviceId, 'type'> & {
    autogenerated?: boolean;
    required?: boolean;
};

export interface ISmartMeterRead {
    meterReading: BigNumber | string;
    timestamp: number;
}

export interface ISmartMeterReadWithStatus extends ISmartMeterRead {
    certified: boolean;
}

export interface IEnergyGenerated {
    energy: BigNumber;
    timestamp: number;
}

export interface IEnergyGeneratedWithStatus extends IEnergyGenerated {
    certified: boolean;
}

export interface ISmartMeterReadStats {
    certified: BigNumber | string;
    uncertified: BigNumber | string;
}

export interface ISmartMeterReadingsAdapter {
    getAll(device: IDevice): Promise<ISmartMeterRead[]>;
    save(device: IDevice, smReads: ISmartMeterRead[]): Promise<void>;
}

export interface IDeviceProductInfo {
    deviceType: string;
    region: string;
    province: string;
    country: string;
    operationalSince: number;
    gridOperator: string;
}

export interface IDeviceProperties extends IDeviceProductInfo {
    id: number;
    status: DeviceStatus;
    facilityName: string;
    description: string;
    images: string;
    address: string;
    capacityInW: number;
    gpsLatitude: string;
    gpsLongitude: string;
    timezone: string;
    complianceRegistry: string;
    otherGreenAttributes: string;
    typeOfPublicSupport: string;
    externalDeviceIds?: IExternalDeviceId[];
    meterStats?: ISmartMeterReadStats;
    deviceGroup?: string;
    smartMeterReads?: ISmartMeterRead[];
    defaultAskPrice: number;
    automaticPostForSale: boolean;
    files?: string;
}

export interface IDevice extends IDeviceProperties {
    organization: IOrganization | IOrganization['id'];
}

export interface IDeviceWithRelationsIds extends IDevice {
    organization: IOrganization['id'];
}

export interface IDeviceWithRelations extends IDevice {
    organization: IOrganization;
}

export type DeviceCreateData = Omit<IDeviceProperties, 'id' | 'meterStats'>;
export type DeviceUpdateData = Pick<IDevice, 'status'>;
export type DeviceSettingsUpdateData = Pick<IDevice, 'defaultAskPrice' | 'automaticPostForSale'>;

export const sortLowestToHighestTimestamp = (
    a: ISmartMeterRead | IEnergyGenerated,
    b: ISmartMeterRead | IEnergyGenerated
): number => {
    if (a.timestamp > b.timestamp) return 1;
    if (b.timestamp > a.timestamp) return -1;

    return 0;
};
