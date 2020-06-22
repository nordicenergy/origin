import {
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
    UnauthorizedException,
    ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, FindOneOptions, FindManyOptions } from 'typeorm';
import {
    ILoggedInUser,
    DeviceStatus,
    CertificationRequestValidationData,
    ISuccessResponse
} from '@energyweb/origin-backend-core';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';

import { CertificationRequest } from './certification-request.entity';
import { CertificationRequestQueueItemDTO } from './certification-request-queue-item.dto';
import { StorageErrors } from '../../enums/StorageErrors';
import { CertificationRequestQueueItem } from './certification-request-queue-item.entity';
import { DeviceService } from '../device/device.service';

@Injectable()
export class CertificationRequestService {
    constructor(
        @InjectRepository(CertificationRequest)
        private readonly repository: Repository<CertificationRequest>,
        @InjectRepository(CertificationRequestQueueItem)
        private readonly queueRepository: Repository<CertificationRequestQueueItem>,
        private readonly deviceService: DeviceService
    ) {}

    async create(cert: DeepPartial<CertificationRequest>) {
        if (cert.device.status !== DeviceStatus.Active) {
            throw new UnprocessableEntityException({
                success: false,
                error: `Cannot create certification requests for device with status: ${
                    DeviceStatus[cert.device.status]
                }. Should be ${DeviceStatus[DeviceStatus.Active]}.`
            });
        }

        const deviceId = cert.device.externalDeviceIds.find(
            (externalDeviceId) => externalDeviceId.type === process.env.ISSUER_ID
        )?.id;

        await this.validateGenerationPeriod({
            fromTime: cert.fromTime,
            toTime: cert.toTime,
            deviceId
        });

        const queuedData = await this.queueRepository.findOne({
            deviceId,
            fromTime: cert.fromTime,
            toTime: cert.toTime
        });

        if (!queuedData) {
            throw new NotFoundException(
                `CertificationRequestService.create(): Unable to find queued data for certification request ${cert.id}`
            );
        }

        const certificationRequest = this.repository.create({
            ...cert,
            energy: queuedData.energy,
            files: queuedData.files ?? []
        });

        await this.repository.save(certificationRequest);
        await this.queueRepository.remove(queuedData);

        return certificationRequest;
    }

    async queue(
        dto: CertificationRequestQueueItemDTO,
        loggedUser: ILoggedInUser
    ): Promise<CertificationRequestQueueItem> {
        const { fromTime, toTime, deviceId, energy, files } = dto;

        await this.validateGenerationPeriod(
            {
                fromTime,
                toTime,
                deviceId
            },
            loggedUser
        );

        const device = await this.deviceService.findByExternalId({
            id: deviceId,
            type: process.env.ISSUER_ID
        });

        if (device.organization !== loggedUser.organizationId) {
            throw new UnauthorizedException('You are not the device manager.');
        }

        let queueItem = await this.queueRepository.findOne({
            deviceId,
            fromTime,
            toTime
        });

        if (!queueItem) {
            queueItem = this.queueRepository.create(dto);
        } else {
            queueItem.energy = energy;
            queueItem.files = files ?? [];
        }

        return this.queueRepository.save(queueItem);
    }

    async registerApproved(id: number): Promise<CertificationRequest> {
        const certificationRequest = await this.repository.findOne(id);

        if (!certificationRequest) {
            throw new NotFoundException(
                `approveCertificationRequest(): ${StorageErrors.NON_EXISTENT}`
            );
        }

        certificationRequest.approved = true;
        certificationRequest.approvedDate = new Date();

        return this.repository.save(certificationRequest);
    }

    async registerRevoked(id: number): Promise<CertificationRequest> {
        const certificationRequest = await this.repository.findOne(id);

        if (!certificationRequest) {
            throw new NotFoundException(
                `approveCertificationRequest(): ${StorageErrors.NON_EXISTENT}`
            );
        }

        certificationRequest.revoked = true;
        certificationRequest.revokedDate = new Date();

        return this.repository.save(certificationRequest);
    }

    async get(
        id: number,
        options?: FindOneOptions<CertificationRequest>
    ): Promise<CertificationRequest> {
        return this.repository.findOne(id, { ...options, relations: ['device'] });
    }

    async getAll(options?: FindManyOptions<CertificationRequest>): Promise<CertificationRequest[]> {
        return this.repository.find({ ...options, relations: ['device'] });
    }

    async validateGenerationPeriod(
        validationData: CertificationRequestValidationData,
        loggedUser?: ILoggedInUser
    ): Promise<ISuccessResponse> {
        const moment = extendMoment(Moment);
        const unix = (timestamp: number) => moment.unix(timestamp);

        const { fromTime, toTime, deviceId } = validationData;
        let device;

        try {
            device = await this.deviceService.findByExternalId({
                type: process.env.ISSUER_ID,
                id: deviceId
            });
        } catch (e) {
            throw new NotFoundException({
                success: false,
                message: `Device with external ID "${deviceId}" doesn't exist.`
            });
        }

        if (loggedUser) {
            if (device.organization !== loggedUser.organizationId) {
                throw new UnauthorizedException({
                    success: false,
                    message: 'You are not the device manager.'
                });
            }
        }

        const deviceCertificationRequests = await this.getAll({
            where: { device, revoked: false }
        });

        const generationTimeRange = moment.range(unix(fromTime), unix(toTime));

        for (const certificationRequest of deviceCertificationRequests) {
            const certificationRequestGenerationRange = moment.range(
                unix(certificationRequest.fromTime),
                unix(certificationRequest.toTime)
            );

            if (generationTimeRange.overlaps(certificationRequestGenerationRange)) {
                throw new ConflictException({
                    success: false,
                    message: `Wanted generation time clashes with an existing certification request: ${certificationRequest.id}`
                });
            }
        }

        return { success: true, message: 'The generation period is valid.' };
    }
}
