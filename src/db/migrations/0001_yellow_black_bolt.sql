CREATE TABLE "meta_producao" (
	"id" serial PRIMARY KEY NOT NULL,
	"linha_id" integer NOT NULL,
	"data" timestamp with time zone NOT NULL,
	"quantidade_meta" integer NOT NULL,
	CONSTRAINT "meta_unica_por_linha_data" UNIQUE("linha_id","data")
);
--> statement-breakpoint
ALTER TABLE "meta_producao" ADD CONSTRAINT "fk_linha_meta" FOREIGN KEY ("linha_id") REFERENCES "public"."linha_producao"("id") ON DELETE no action ON UPDATE no action;