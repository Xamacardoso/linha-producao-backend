import { AppError } from "../lib/AppError";
import { db } from "../db";
import { metaProducao } from "../db/schema"; // Importando o schema da meta de produção
import { eq, and, sql } from "drizzle-orm";

export class ProductTargetService {
    public async listarMetasDiaAtual(): Promise<any>{
        const metas = await db.select()
            .from(metaProducao)
            .where(sql`${metaProducao.data}::date = CURRENT_DATE`) // Filtra apenas por dia, mês e ano
            .orderBy(metaProducao.linhaId); // Ordena por linhaId

        for (const meta of metas) {
            console.log(`Linha ID: ${meta.linhaId}, Meta: ${meta.quantidadeMeta}, Data: ${meta.data}\n\n\n`); // Log para verificar as metas
        }

        if (metas.length === 0) {
            throw new AppError('Nenhuma meta de produção encontrada para o dia atual.', 404);
        }

        const arrayMetas = metas.map(meta => ({
            linhaId: meta.linhaId,
            meta: meta.quantidadeMeta
        }))

        const metaTotal: number = metas.reduce((total, meta) => total + meta.quantidadeMeta, 0); // Soma das metas

        return {
            data: new Date().toISOString().split('T')[0], // Data de hoje
            metaTotal: metaTotal, // Total de metas do dia
            metas: arrayMetas   
        }
    }

    public async listarMetaLinha(linhaId: number): Promise<any> {
        const [meta] = await db.select()
            .from(metaProducao)
            .where(
                and(
                    eq(metaProducao.linhaId, linhaId), // Filtra pela linha especificada
                    sql`${metaProducao.data}::date = CURRENT_DATE` // Filtra pela data de hoje
                )
            )

        if (!meta) {
            throw new AppError('Meta de produção não encontrada para a linha especificada.', 404);
        }

        return {
            linhaId: meta.linhaId,
            meta: meta.quantidadeMeta,
            data: new Date(meta.data).toISOString().split('T')[0] // Formata a data para YYYY-MM-DD
        }
    }

    public async criarMetaLinha(linhaId: number, meta: number): Promise<any> {
        // Busca se já existe uma meta para a linha e data de hoje
        const [metaExistente] = await db.select()
            .from(metaProducao)
            .where(
                and(
                    eq(metaProducao.linhaId, linhaId),
                    sql`${metaProducao.data}::date = CURRENT_DATE` // Filtra pela data de hoje
                )
            );

        // Se já existe, não cria uma nova meta, mas lança um erro
        if (metaExistente) {
            throw new AppError('Já existe uma meta de produção para esta linha no dia atual.', 400);
        }

        const [novaMeta] = await db.insert(metaProducao)
            .values({
                linhaId: linhaId,
                quantidadeMeta: meta,
                data: new Date().toISOString() // Data de hoje
            })
            .returning();

        return {
            linhaId: novaMeta.linhaId,
            meta: novaMeta.quantidadeMeta,
            data: novaMeta.data
        }
    }

    public async atualizarMetaLinha(linhaId: number, meta: number): Promise<any> {
        const [metaAtualizada] = await db.update(metaProducao)
            .set({ quantidadeMeta: meta }) // Atualiza a meta
            .where(
                and(
                    eq(metaProducao.linhaId, linhaId), // Filtra pela linha especificada
                    sql`${metaProducao.data}::date = CURRENT_DATE` // Filtra pela data de hoje
                )
            )
            .returning();

        if (!metaAtualizada) {
            throw new AppError('Meta de produção não encontrada para atualização.', 404);
        }

        return {
            linhaId: metaAtualizada.linhaId,
            meta: metaAtualizada.quantidadeMeta,
            data: metaAtualizada.data
        }
    }
}