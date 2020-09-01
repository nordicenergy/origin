import { MigrationInterface, QueryRunner } from 'typeorm';

export class RmUserId1598961526100 implements MigrationInterface {
    name = 'RmUserId1598961526100';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certification_request" DROP COLUMN "userId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certification_request" ADD "userId" character varying NOT NULL`
        );
    }
}
