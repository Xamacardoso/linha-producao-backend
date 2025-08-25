import { db } from '../db';
import { AppError } from '../lib/AppError';
import { produto, historicoEtapa, etapa } from '../db/schema';
import { sql, eq, inArray, desc } from 'drizzle-orm';

export class ProductAnalyticsService {

  /**
   * Analisa o histórico de um PRODUTO ESPECÍFICO para calcular tempos de ciclo e ociosidade.
   * @param produtoId O ID do produto a ser analisado.
   * @returns Um objeto com a análise detalhada para aquele produto.
   */
  public async analisarTempoProduto(produtoId: number) {
    const query = sql`
      WITH HistoricoComJanela AS (
          SELECT
              h.produto_id,
              h.etapa_id,
              e.nome_etapa,
              h.inicio_ts,
              h.fim_ts,
              LAG(h.fim_ts, 1) OVER (PARTITION BY h.produto_id ORDER BY h.etapa_id) AS "fimEtapaAnterior"
          FROM historico_etapa h
          JOIN etapa e ON h.etapa_id = e.id
          WHERE h.produto_id = ${produtoId}
      )
      SELECT
          h.etapa_id AS "etapaId",
          h.nome_etapa AS "nomeEtapa",
          h.inicio_ts AS "inicioEtapa",
          h.fim_ts AS "fimEtapa",
          (h.fim_ts - h.inicio_ts) as "duracaoEtapa",
          CASE
              WHEN h."fimEtapaAnterior" IS NOT NULL AND h.inicio_ts IS NOT NULL
              THEN h.inicio_ts - h."fimEtapaAnterior"
              ELSE INTERVAL '0 seconds'
          END AS "tempoDeOcio"
      FROM HistoricoComJanela h
      ORDER BY h.etapa_id;
    `;

    const { rows: analiseEtapas } = await db.execute(query);

    if (analiseEtapas.length === 0) {
      throw new AppError('Produto não encontrado ou sem histórico para análise.', 404);
    }

    const tempoOcioTotal = this._calcularOcioTotal(analiseEtapas);
      
    return {
        analisePorEtapa: analiseEtapas,
        ocioTotal: tempoOcioTotal,
    };
  }

  /**
   * Realiza uma análise completa do fluxo de uma linha de produção, detalhando cada produto.
   * @param linhaId O ID da linha de produção.
   * @returns Um objeto contendo a contagem de produtos concluídos e uma lista detalhada de cada produto com seu histórico e tempos de ócio.
   */
  public async analisarTemposPorLinha(linhaId: number) {
    // 1. Buscar todos os produtos da linha
    const produtosNaLinha = await db.select()
      .from(produto)
      .where(eq(produto.linhaId, linhaId))
      .orderBy(desc(produto.dataCriacao));

    if (produtosNaLinha.length === 0) {
      throw new AppError('Nenhum produto encontrado para esta linha de produção.', 404);
    }

    // 2. Contar quantos estão concluídos
    const produtosConcluidosCount = produtosNaLinha.filter(p => p.statusGeral === 'Concluido').length;

    // 3. Buscar todo o histórico de etapas para esses produtos de uma só vez
    const productIds = produtosNaLinha.map(p => p.id);
    const todosHistoricos = await db.select({
        produtoId: historicoEtapa.produtoId,
        etapaId: historicoEtapa.etapaId,
        nomeEtapa: etapa.nomeEtapa,
        inicioTs: historicoEtapa.inicioTs,
        fimTs: historicoEtapa.fimTs,
    })
    .from(historicoEtapa)
    .innerJoin(etapa, eq(historicoEtapa.etapaId, etapa.id))
    .where(inArray(historicoEtapa.produtoId, productIds))
    .orderBy(historicoEtapa.produtoId, historicoEtapa.etapaId);

    // 4. Processar os dados em TypeScript para calcular o tempo de ócio
    const produtosDetalhados = produtosNaLinha.map(p => {
        const historicoDoProduto = todosHistoricos.filter(h => h.produtoId === p.id);
        let ultimoFimTs: number | null = null; // timestamp em milissegundos
        let ocioTotalSegs = 0;

        const etapasComOcio = historicoDoProduto.map(h => {
            let tempoDeOcioSegs = 0;
            // Garante que inicioTs e fimTs são datas válidas
            const inicioTsMs = h.inicioTs ? new Date(h.inicioTs).getTime() : null;
            const fimTsMs = h.fimTs ? new Date(h.fimTs).getTime() : null;

            if (ultimoFimTs !== null && inicioTsMs !== null) {
                // Calcula a diferença em segundos
                tempoDeOcioSegs = Math.max(0, Math.floor((inicioTsMs - ultimoFimTs) / 1000));
                ocioTotalSegs += tempoDeOcioSegs;
            }
            
            // Atualiza o último timestamp de finalização para a próxima iteração
            if (fimTsMs !== null) {
                ultimoFimTs = fimTsMs;
            }

            return {
                etapaId: h.etapaId,
                nomeEtapa: h.nomeEtapa,
                inicioTs: h.inicioTs,
                fimTs: h.fimTs,
                tempoDeOcio: this._formatarDuracaoParaString(tempoDeOcioSegs)
            };
        });

        return {
            produtoId: p.id,
            nSerie: p.nSerie,
            status: p.statusGeral,
            ocioTotal: this._formatarDuracaoParaString(ocioTotalSegs),
            historico: etapasComOcio
        };
    });

    return {
      produtosConcluidos: produtosConcluidosCount,
      totalProdutosNaLinha: produtosNaLinha.length,
      analiseProdutos: produtosDetalhados
    };
  }

  public async analisarTemposPorLinhaNaDataAtual(linhaId: number) {
    // 1. Buscar todos os produtos da linha criados na data atual
    const produtosNaLinhaHoje = await db.select()
      .from(produto)
      .where(sql`${produto.linhaId} = ${linhaId} AND DATE(${produto.dataCriacao}) = CURRENT_DATE`)
      .orderBy(desc(produto.dataCriacao));

    if (produtosNaLinhaHoje.length === 0) {
      throw new AppError('Nenhum produto encontrado para esta linha de produção na data atual.', 404);
    }

    // 2. Contar quantos estão concluídos
    const produtosConcluidosCount = produtosNaLinhaHoje.filter(p => p.statusGeral === 'Concluido').length;

    // 3. Buscar todo o histórico de etapas para esses produtos de uma só vez
    const productIds = produtosNaLinhaHoje.map(p => p.id);
    const todosHistoricos = await db.select({
      produtoId: historicoEtapa.produtoId,
      etapaId: historicoEtapa.etapaId,
      nomeEtapa: etapa.nomeEtapa,
      inicioTs: historicoEtapa.inicioTs,
      fimTs: historicoEtapa.fimTs,
    })
      .from(historicoEtapa)
      .innerJoin(etapa, eq(historicoEtapa.etapaId, etapa.id))
      .where(inArray(historicoEtapa.produtoId, productIds))
      .orderBy(historicoEtapa.produtoId, historicoEtapa.etapaId);

    // 4. Processar os dados em TypeScript para calcular o tempo de ócio
    const produtosDetalhados = produtosNaLinhaHoje.map(p => {
      const historicoDoProduto = todosHistoricos.filter(h => h.produtoId === p.id);
      let ultimoFimTs: number | null = null; // timestamp em milissegundos
      let ocioTotalSegs = 0;

      const etapasComOcio = historicoDoProduto.map(h => {
        let tempoDeOcioSegs = 0;
        // Garante que inicioTs e fimTs são datas válidas
        const inicioTsMs = h.inicioTs ? new Date(h.inicioTs).getTime() : null;
        const fimTsMs = h.fimTs ? new Date(h.fimTs).getTime() : null;

        if (ultimoFimTs !== null && inicioTsMs !== null) {
          // Calcula a diferença em segundos
          tempoDeOcioSegs = Math.max(0, Math.floor((inicioTsMs - ultimoFimTs) / 1000));
          ocioTotalSegs += tempoDeOcioSegs;
        }

        // Atualiza o último timestamp de finalização para a próxima iteração
        if (fimTsMs !== null) {
          ultimoFimTs = fimTsMs;
        }

        return {
          etapaId: h.etapaId,
          nomeEtapa: h.nomeEtapa,
          inicioTs: h.inicioTs,
          fimTs: h.fimTs,
          tempoDeOcio: this._formatarDuracaoParaString(tempoDeOcioSegs)
        };
      });

      return {
        produtoId: p.id,
        nSerie: p.nSerie,
        status: p.statusGeral,
        ocioTotal: this._formatarDuracaoParaString(ocioTotalSegs),
        historico: etapasComOcio
      };
    });

    return {
      produtosConcluidos: produtosConcluidosCount,
      totalProdutosNaLinha: produtosNaLinhaHoje.length,
      analiseProdutos: produtosDetalhados
    };
  }

  /**
   * Calcula o tempo total de ócio no formato "HH:MM:SS" a partir dos resultados da query.
   * @param resultados Array de resultados da query.
   * @param campoOcio O nome do campo que contém o intervalo de tempo de ócio.
   * @returns Tempo total de ócio no formato "HH:MM:SS"
   */
  private _calcularOcioTotal(resultados: any[], campoOcio = 'tempoDeOcio'): string {
    let totalSeconds = 0;

    for (const etapa of resultados) {
      const tempo = etapa[campoOcio];
      if (!tempo) continue;

      if (typeof tempo === 'number') {
        totalSeconds += tempo;
      } else if (typeof tempo === 'string') {
        // Formatos possíveis: "D days HH:MM:SS" ou "HH:MM:SS"
        const match = tempo.match(/(?:(\d+)\s+days?\s+)?(\d{1,2}):(\d{2}):(\d{2})/);
        if (match) {
          const days = parseInt(match[1] || '0', 10);
          const hours = parseInt(match[2] || '0', 10);
          const minutes = parseInt(match[3] || '0', 10);
          const seconds = parseInt(match[4] || '0', 10);
          totalSeconds += days * 86400 + hours * 3600 + minutes * 60 + seconds;
        } else {
          const asNumber = Number(tempo);
          if (!isNaN(asNumber)) {
            totalSeconds += asNumber;
          }
        }
      }
    }

    return this._formatarDuracaoParaString(totalSeconds);
  }

  // Formata uma duração em segundos para o formato "HH:MM:SS"
  private _formatarDuracaoParaString(duracaoSegundos: number): string {
    const horas = Math.floor(duracaoSegundos / 3600);
    const minutos = Math.floor((duracaoSegundos % 3600) / 60);
    const segundos = duracaoSegundos % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
  }

}