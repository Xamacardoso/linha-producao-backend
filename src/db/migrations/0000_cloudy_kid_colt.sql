CREATE TABLE "alerta" (
	"id" serial PRIMARY KEY NOT NULL,
	"linha_id" integer NOT NULL,
	"etapa_id" integer,
	"descricao" text NOT NULL,
	"inicio_alerta_ts" timestamp with time zone NOT NULL,
	"fim_alerta_ts" timestamp with time zone,
	"status_alerta" varchar(50) DEFAULT 'Aberto'
);
--> statement-breakpoint
CREATE TABLE "etapa" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_etapa" varchar(100) NOT NULL,
	"descricao" text
);
--> statement-breakpoint
CREATE TABLE "historico_etapa" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"etapa_id" integer NOT NULL,
	"inicio_ts" timestamp with time zone,
	"fim_ts" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "linha_producao" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_linha" varchar(100) NOT NULL,
	"localizacao" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "produto" (
	"id" serial PRIMARY KEY NOT NULL,
	"n_serie" varchar(50),
	"linha_id" integer NOT NULL,
	"status_geral" varchar(50) DEFAULT 'Em producao',
	"data_criacao" timestamp with time zone DEFAULT now(),
	"data_conclusao" timestamp with time zone,
	CONSTRAINT "produto_n_serie_unique" UNIQUE("n_serie"),
	CONSTRAINT "produto_n_serie_key" UNIQUE("n_serie")
);
--> statement-breakpoint
ALTER TABLE "alerta" ADD CONSTRAINT "fk_linha_alerta" FOREIGN KEY ("linha_id") REFERENCES "public"."linha_producao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerta" ADD CONSTRAINT "fk_etapa_alerta" FOREIGN KEY ("etapa_id") REFERENCES "public"."etapa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_etapa" ADD CONSTRAINT "fk_produto" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_etapa" ADD CONSTRAINT "fk_etapa" FOREIGN KEY ("etapa_id") REFERENCES "public"."etapa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto" ADD CONSTRAINT "fk_linha" FOREIGN KEY ("linha_id") REFERENCES "public"."linha_producao"("id") ON DELETE no action ON UPDATE no action;