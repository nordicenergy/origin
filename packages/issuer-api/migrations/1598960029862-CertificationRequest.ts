import { MigrationInterface, QueryRunner } from 'typeorm';

export class CertificationRequest1598960029862 implements MigrationInterface {
    name = 'CertificationRequest1598960029862';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "certification_request" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "requestId" integer NOT NULL, "owner" character varying NOT NULL, "userId" character varying NOT NULL, "energy" character varying NOT NULL, "deviceId" character varying NOT NULL, "fromTime" integer NOT NULL, "toTime" integer NOT NULL, "files" text NOT NULL DEFAULT '[]', "created" integer NOT NULL, "approved" boolean NOT NULL, "approvedDate" TIMESTAMP WITH TIME ZONE, "revoked" boolean NOT NULL, "revokedDate" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_441881cf0ee9ade4923ed5d821f" UNIQUE ("requestId"), CONSTRAINT "PK_dfc23ef2bf22d33b9edf5e4e2c6" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(`ALTER TABLE "certificate" ADD "claims" text`);
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD CONSTRAINT "UQ_35cf49808f78b8bf3955b96e239" UNIQUE ("tokenId")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" DROP CONSTRAINT "UQ_35cf49808f78b8bf3955b96e239"`
        );
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "claims"`);
        await queryRunner.query(`DROP TABLE "certification_request"`);
    }
}
