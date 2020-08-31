import { MigrationInterface, QueryRunner } from 'typeorm';

export class CertificateClaims1598875274057 implements MigrationInterface {
    name = 'CertificateClaims1598875274057';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" ADD "claimers" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificate" DROP COLUMN "claimers"`);
    }
}
