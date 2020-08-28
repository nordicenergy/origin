import { MigrationInterface, QueryRunner } from 'typeorm';

export class CertificateOwners1598535237036 implements MigrationInterface {
    name = 'CertificateOwners1598535237036';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" ADD "owners" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "owners"`);
    }
}
