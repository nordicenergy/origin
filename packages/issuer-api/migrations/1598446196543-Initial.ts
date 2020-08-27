import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1598446196543 implements MigrationInterface {
    name = 'Initial1598446196543';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "blockchain_properties" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "netId" integer NOT NULL, "registry" character varying NOT NULL, "issuer" character varying NOT NULL, "rpcNode" character varying NOT NULL, "rpcNodeFallback" character varying, CONSTRAINT "PK_feb5a7a02b39327ac5514f5b842" PRIMARY KEY ("netId"))`
        );
        await queryRunner.query(
            `CREATE TABLE "certificate" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "tokenId" integer NOT NULL, "deviceId" character varying NOT NULL, "generationStartTime" integer NOT NULL, "generationEndTime" integer NOT NULL, "creationTime" integer NOT NULL, "creationBlockHash" character varying NOT NULL, "blockchainNetId" integer, CONSTRAINT "PK_8daddfc65f59e341c2bbc9c9e43" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "certificate" ADD CONSTRAINT "FK_981cc41a30a13cc2f3b38f8350a" FOREIGN KEY ("blockchainNetId") REFERENCES "blockchain_properties"("netId") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certificate" DROP CONSTRAINT "FK_981cc41a30a13cc2f3b38f8350a"`
        );
        await queryRunner.query(`DROP TABLE "certificate"`);
        await queryRunner.query(`DROP TABLE "blockchain_properties"`);
    }
}
