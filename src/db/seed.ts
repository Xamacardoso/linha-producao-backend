import { db } from './index';
import * as dotenv from 'dotenv';
import { linhaProducao, etapa } from './schema';

dotenv.config();

async function main() {
    console.log('[SEED] Iniciando o seeding...');

    console.log('[SEED] Apagando dados antigos para evitar duplicidade...');
    await db.delete(etapa);
    await db.delete(linhaProducao);

    console.log('[SEED] Povoando a tabela linha_producao...');

    await db.insert(linhaProducao).values([
        { nomeLinha: 'Linha 1', localizacao: 'Galpão Superior' },
        { nomeLinha: 'Linha 2', localizacao: 'Galpão Superior' },
        { nomeLinha: 'Linha 3', localizacao: 'Galpão Superior' },
        { nomeLinha: 'Linha 4', localizacao: 'Galpão Inferior' },
        { nomeLinha: 'Linha 5', localizacao: 'Galpão Inferior' },
    ]);

    console.log('[SEED] Povoando a tabela etapa...');
    await db.insert(etapa).values([
        { nomeEtapa: '1 - MONTAGEM DA CARCAÇA', descricao: 'Montagem da carcaça do produto' },
        { nomeEtapa: '2 - MOTORIZAÇÃO DO CLIMATIZADOR', descricao: 'Motorização do climatizador' },
        { nomeEtapa: '3 - INSPEÇÃO INICIAL', descricao: 'Inspeção inicial do produto' },
        { nomeEtapa: '4 - FECHAMENTO DE ESTRUTURA', descricao: 'Fechamento da estrutura do produto' },
        { nomeEtapa: '5 - ACABAMENTO', descricao: 'Acabamento do produto e embalagem' },
    ]);

    console.log('[SEED] Povoamento realizado com sucesso!');
    process.exit(0); // Finaliza o processo do script
}

main().catch((error) => {
    console.error('[SEED] Erro ao executar o seeding:', error);
    process.exit(1);
});







