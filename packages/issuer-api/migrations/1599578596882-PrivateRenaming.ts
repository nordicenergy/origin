import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrivateRenaming1599578596882 implements MigrationInterface {
    name = 'PrivateRenaming1599578596882';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" RENAME COLUMN "isIssuedPrivately" TO "issuedPrivately"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" RENAME COLUMN "issuedPrivately" TO "isIssuedPrivately"`
        );
    }
}
