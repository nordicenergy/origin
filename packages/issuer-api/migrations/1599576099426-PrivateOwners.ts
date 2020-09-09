import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrivateOwners1599576099426 implements MigrationInterface {
    name = 'PrivateOwners1599576099426';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "certificate" ADD "privateOwners" text NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD "isIssuedPrivately" boolean NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "isIssuedPrivately"`);
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "privateOwners"`);
        await queryRunner.query(`ALTER TABLE "certificate" ADD "isPrivate" boolean NOT NULL`);
    }
}
