import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1781559575478 implements MigrationInterface {
    name = 'Initial1781559575478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "experiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "puesto" text, "empresa" text, "inicio" text, "termino" text, "descripcion" text, "orden" integer NOT NULL DEFAULT '0', "candidate_id" uuid, CONSTRAINT "PK_884f0913a63882712ea578e7c85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "education" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" text, "institucion" text, "anio" text, "orden" integer NOT NULL DEFAULT '0', "candidate_id" uuid, CONSTRAINT "PK_bf3d38701b3030a8ad634d43bd6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "html_content" text NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5624219dd33b4644599d4d4b231" UNIQUE ("name"), CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "name" text NOT NULL, "ms_object_id" text, "role" text NOT NULL DEFAULT 'recruiter', "avatar_url" text, "last_login" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_b4d2b1ba6a9d39073a1b55d7a80" UNIQUE ("ms_object_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombres" text NOT NULL, "apellidos" text NOT NULL, "rut" text, "ubicacion" text, "mail" text, "numero" text, "profesion" text, "resumen" text, "stack" text array NOT NULL DEFAULT '{}', "idiomas" jsonb NOT NULL DEFAULT '{}', "raw_json" jsonb NOT NULL DEFAULT '{}', "tt_candidate_id" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "template_id" uuid, "created_by" uuid, CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "experiences" ADD CONSTRAINT "FK_f624485191aee00cc75f9c1d7e6" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "education" ADD CONSTRAINT "FK_e5cd2741ebeb6c59b192cafcc94" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_0ba2fd19f2fdaa3863a62a6b041" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_2f5704e992ce07f67336e8eadd2" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT "FK_2f5704e992ce07f67336e8eadd2"`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT "FK_0ba2fd19f2fdaa3863a62a6b041"`);
        await queryRunner.query(`ALTER TABLE "education" DROP CONSTRAINT "FK_e5cd2741ebeb6c59b192cafcc94"`);
        await queryRunner.query(`ALTER TABLE "experiences" DROP CONSTRAINT "FK_f624485191aee00cc75f9c1d7e6"`);
        await queryRunner.query(`DROP TABLE "candidates"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "templates"`);
        await queryRunner.query(`DROP TABLE "education"`);
        await queryRunner.query(`DROP TABLE "experiences"`);
    }

}
