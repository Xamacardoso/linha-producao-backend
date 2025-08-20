import { db } from './index';
import * as dotenv from 'dotenv';
import { linhaProducao, etapa, produto, historicoEtapa, metaProducao, alerta } from './schema';

dotenv.config();

const HOJE = new Date(); 

async function main() {
    console.log('[SEED] Iniciando o seeding...');

    console.log('[SEED] Apagando dados antigos para evitar duplicidade...');
    await db.delete(etapa);
    await db.delete(alerta);
    await db.delete(linhaProducao);
    await db.delete(produto);
    await db.delete(historicoEtapa);
    await db.delete(metaProducao);
    console.log('[SEED] Dados antigos apagados.');

    console.log('[SEED] Povoando a tabela linha_producao...');
    await povoarLinhasProducao();
    
    console.log('[SEED] Povoando a tabela meta_producao...');
    await povoarMetasProducao();

    console.log('[SEED] Povoando a tabela etapa...');
    await povoarEtapas();

    console.log('[SEED] Povoando a tabela produto e historico_etapa...');
    await povoarProdutos();

    console.log('[SEED] Povoando a tabela alerta...');
    await povoarAlertas();

    console.log('[SEED] Povoamento realizado com sucesso!');
    process.exit(0); // Finaliza o processo do script
}

async function povoarMetasProducao() {
    await db.insert(metaProducao).values([
        { linhaId: 1, quantidadeMeta: 100, data: HOJE.toISOString() },
        { linhaId: 2, quantidadeMeta: 150, data: HOJE.toISOString() },
        { linhaId: 3, quantidadeMeta: 150, data: HOJE.toISOString() },
        { linhaId: 4, quantidadeMeta: 150, data: HOJE.toISOString() },
        { linhaId: 5, quantidadeMeta: 100, data: HOJE.toISOString() },
    ]);
}

async function povoarLinhasProducao() {
    await db.insert(linhaProducao).values([
        { nomeLinha: 'Linha 1', localizacao: 'Galpão Superior' },
        { nomeLinha: 'Linha 2', localizacao: 'Galpão Superior' },
        { nomeLinha: 'Linha 3', localizacao: 'Galpão Superior' },
        { nomeLinha: 'Linha 4', localizacao: 'Galpão Inferior' },
        { nomeLinha: 'Linha 5', localizacao: 'Galpão Inferior' },
    ]);
}

async function povoarEtapas() {
    await db.insert(etapa).values([
        { nomeEtapa: '1 - MONTAGEM DA CARCAÇA', descricao: 'Montagem da carcaça do produto' },
        { nomeEtapa: '2 - MOTORIZAÇÃO DO CLIMATIZADOR', descricao: 'Motorização do climatizador' },
        { nomeEtapa: '3 - INSPEÇÃO INICIAL', descricao: 'Inspeção inicial do produto' },
        { nomeEtapa: '4 - FECHAMENTO DE ESTRUTURA', descricao: 'Fechamento da estrutura do produto' },
        { nomeEtapa: '5 - ACABAMENTO', descricao: 'Acabamento do produto e embalagem' },
    ]);
}

async function povoarProdutos() {
    // --- Produto 1: Concluído ---
    const [p1] = await db.insert(produto).values({
        linhaId: 1,
        statusGeral: 'Concluido',
        dataConclusao: new Date(HOJE.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
    }).returning();
    await db.insert(historicoEtapa).values([
        { produtoId: p1.id, etapaId: 1, inicioTs: new Date(HOJE.getTime() - (2 * 60 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (1.8 * 60 * 60 * 1000)).toISOString() },
        { produtoId: p1.id, etapaId: 2, inicioTs: new Date(HOJE.getTime() - (1.7 * 60 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (1.5 * 60 * 60 * 1000)).toISOString() },
        { produtoId: p1.id, etapaId: 3, inicioTs: new Date(HOJE.getTime() - (1.4 * 60 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (1.3 * 60 * 60 * 1000)).toISOString() },
        { produtoId: p1.id, etapaId: 4, inicioTs: new Date(HOJE.getTime() - (1.2 * 60 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (1.1 * 60 * 60 * 1000)).toISOString() },
        { produtoId: p1.id, etapaId: 5, inicioTs: new Date(HOJE.getTime() - (1.05 * 60 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (1 * 60 * 60 * 1000)).toISOString() },
    ]);

    // --- Produto 2: Em produção, na etapa 3 ---
    const [p2] = await db.insert(produto).values({
        linhaId: 1,
        statusGeral: 'Em producao',
    }).returning();
    await db.insert(historicoEtapa).values([
        { produtoId: p2.id, etapaId: 1, inicioTs: new Date(HOJE.getTime() - (45 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (40 * 60 * 1000)).toISOString() },
        { produtoId: p2.id, etapaId: 2, inicioTs: new Date(HOJE.getTime() - (35 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (30 * 60 * 1000)).toISOString() },
        { produtoId: p2.id, etapaId: 3, inicioTs: new Date(HOJE.getTime() - (20 * 60 * 1000)).toISOString(), fimTs: null }, // Parado aqui
        { produtoId: p2.id, etapaId: 4, inicioTs: null, fimTs: null },
        { produtoId: p2.id, etapaId: 5, inicioTs: null, fimTs: null },
    ]);

    // --- Produto 3: Aguardando para iniciar a etapa 2 ---
    const [p3] = await db.insert(produto).values({
        linhaId: 2,
        statusGeral: 'Em producao',
    }).returning();
    await db.insert(historicoEtapa).values([
        { produtoId: p3.id, etapaId: 1, inicioTs: new Date(HOJE.getTime() - (15 * 60 * 1000)).toISOString(), fimTs: new Date(HOJE.getTime() - (10 * 60 * 1000)).toISOString() }, // Acabou de finalizar
        { produtoId: p3.id, etapaId: 2, inicioTs: null, fimTs: null },
        { produtoId: p3.id, etapaId: 3, inicioTs: null, fimTs: null },
        { produtoId: p3.id, etapaId: 4, inicioTs: null, fimTs: null },
        { produtoId: p3.id, etapaId: 5, inicioTs: null, fimTs: null },
    ]);
}

async function povoarAlertas() {
    await db.insert(alerta).values([
        {linhaId: 2, etapaId: 3, descricao: 'Reposicao de peças atrasada', inicioAlertaTs: new Date(HOJE.getTime() - (5 * 60 * 1000)).toISOString(), statusAlerta: 'Aberto'},
        {linhaId: 3, etapaId: 2, descricao: 'Falha no motor', inicioAlertaTs: new Date(HOJE.getTime() - (10 * 60 * 1000)).toISOString(), statusAlerta: 'Fechado', fimAlertaTs: new Date(HOJE.getTime() - (2 * 60 * 1000)).toISOString()},
    ]);
}


main().catch((error) => {
    console.error('[SEED] Erro ao executar o seeding:', error);
    process.exit(1);
});







