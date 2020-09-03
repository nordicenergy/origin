import { MigrationInterface, QueryRunner } from 'typeorm';

export class IssuedCertificateTokenId1599135977737 implements MigrationInterface {
    name = 'IssuedCertificateTokenId1599135977737';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certification_request" ADD "issuedCertificateTokenId" integer`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certification_request" DROP COLUMN "issuedCertificateTokenId"`
        );
    }
}
