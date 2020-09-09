import { ExtendedBaseEntity } from '@energyweb/origin-backend';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IsInt, Min, IsBoolean } from 'class-validator';

export interface ICertificationRequestDTO {
    requestId: number;
    deviceId: string;
    energy: string;
    owner: string;
    fromTime: number;
    toTime: number;
    files: string[];
    created: number;
    approved: boolean;
    revoked: boolean;
    approvedDate?: Date;
    revokedDate?: Date;
    issuedCertificateTokenId?: number;
}

@Entity()
@Unique(['requestId'])
export class CertificationRequest extends ExtendedBaseEntity implements ICertificationRequestDTO {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    requestId: number;

    @Column('varchar')
    owner: string;

    @Column('varchar', { nullable: false })
    energy: string;

    @Column()
    deviceId: string;

    @Column()
    @IsInt()
    @Min(0)
    fromTime: number;

    @Column()
    @IsInt()
    @Min(0)
    toTime: number;

    @Column('simple-array', { nullable: false, default: [] })
    files: string[];

    @Column()
    @IsInt()
    @Min(0)
    created: number;

    @Column()
    @IsBoolean()
    approved: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    approvedDate: Date;

    @Column()
    @IsBoolean()
    revoked: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    revokedDate: Date;

    @Column({ nullable: true })
    @IsInt()
    @Min(0)
    issuedCertificateTokenId: number;

    @Column()
    @IsBoolean()
    isPrivate: boolean;
}
