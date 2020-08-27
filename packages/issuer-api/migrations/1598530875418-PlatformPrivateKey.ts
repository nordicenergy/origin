import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformPrivateKey1598530875418 implements MigrationInterface {
    name = 'PlatformPrivateKey1598530875418';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "blockchain_properties" ADD "platformOperatorPrivateKey" character varying NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "blockchain_properties" DROP COLUMN "platformOperatorPrivateKey"`
        );
    }
}
