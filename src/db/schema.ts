import { pgTable, serial, varchar, foreignKey, unique, integer, timestamp, text } from "drizzle-orm/pg-core"

export const linhaProducao = pgTable("linha_producao", {
	id: serial().primaryKey().notNull(),
	nomeLinha: varchar("nome_linha", { length: 100 }).notNull(),
	localizacao: varchar({ length: 100 }),
});

export const produto = pgTable("produto", {
	id: serial().primaryKey().notNull(),
	nSerie: varchar("n_serie", { length: 50 }).unique(),
	linhaId: integer("linha_id").notNull(),
	statusGeral: varchar("status_geral", { length: 50 }).default('Em producao'),
	dataCriacao: timestamp("data_criacao", { withTimezone: true, mode: 'string' }).defaultNow(),
	dataConclusao: timestamp("data_conclusao", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.linhaId],
			foreignColumns: [linhaProducao.id],
			name: "fk_linha"
		}),
	unique("produto_n_serie_key").on(table.nSerie),
]);

export const historicoEtapa = pgTable("historico_etapa", {
	id: serial().primaryKey().notNull(),
	produtoId: integer("produto_id").notNull(),
	etapaId: integer("etapa_id").notNull(),
	inicioTs: timestamp("inicio_ts", { withTimezone: true, mode: 'string' }),
	fimTs: timestamp("fim_ts", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.produtoId],
			foreignColumns: [produto.id],
			name: "fk_produto"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.etapaId],
			foreignColumns: [etapa.id],
			name: "fk_etapa"
		}),
]);

export const etapa = pgTable("etapa", {
	id: serial().primaryKey().notNull(),
	nomeEtapa: varchar("nome_etapa", { length: 100 }).notNull(),
	descricao: text(),
});

export const alerta = pgTable("alerta", {
	id: serial().primaryKey().notNull(),
	linhaId: integer("linha_id").notNull(),
	etapaId: integer("etapa_id"),
	descricao: text().notNull(),
	inicioAlertaTs: timestamp("inicio_alerta_ts", { withTimezone: true, mode: 'string' }).notNull(),
	fimAlertaTs: timestamp("fim_alerta_ts", { withTimezone: true, mode: 'string' }),
	statusAlerta: varchar("status_alerta", { length: 50 }).default('Aberto'),
}, (table) => [
	foreignKey({
			columns: [table.linhaId],
			foreignColumns: [linhaProducao.id],
			name: "fk_linha_alerta"
		}),
	foreignKey({
			columns: [table.etapaId],
			foreignColumns: [etapa.id],
			name: "fk_etapa_alerta"
		}),
]);

export const metaProducao = pgTable("meta_producao", {
	id: serial().primaryKey().notNull(),
	linhaId: integer("linha_id").notNull(),
	data: timestamp("data", { withTimezone: true, mode: 'string' }).notNull(),
	quantidadeMeta: integer("quantidade_meta").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.linhaId],
			foreignColumns: [linhaProducao.id],
			name: "fk_linha_meta"
		}),
	unique("meta_unica_por_linha_data").on(table.linhaId, table.data),
]);