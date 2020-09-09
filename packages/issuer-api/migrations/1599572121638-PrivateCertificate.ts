import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrivateCertificate1599572121638 implements MigrationInterface {
    name = 'PrivateCertificate1599572121638';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" ADD "isPrivate" boolean NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "certification_request" ADD "isPrivate" boolean NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certification_request" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "isPrivate"`);
    }
}
