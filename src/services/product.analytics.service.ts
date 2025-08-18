import { db } from '../db';
import { sql } from 'drizzle-orm';
import { AppError } from '../lib/AppError';

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

    const ocioTotalSegundos = this._calcularOcioTotal(analiseEtapas);
      
    return {
        analisePorEtapa: analiseEtapas,
        ocioTotalSegundos: ocioTotalSegundos,
    };
  }

  /**
   * Analisa o histórico de TODOS OS PRODUTOS CONCLUÍDOS de uma LINHA DE PRODUÇÃO.
   * Calcula as médias de tempo de ciclo e ociosidade para cada etapa.
   * @param linhaId O ID da linha de produção a ser analisada.
   * @returns Um objeto com as médias de tempo para a linha.
   */
  public async analisarTemposPorLinha(linhaId: number) {
    const query = sql`
      WITH HistoricoComJanela AS (
        SELECT
          p.linha_id,
          h.produto_id,
          h.etapa_id,
          e.nome_etapa,
          -- Calcula a duração da etapa e o tempo de ócio para cada produto individualmente
          (h.fim_ts - h.inicio_ts) as duracao_etapa,
          (h.inicio_ts - LAG(h.fim_ts, 1) OVER (PARTITION BY h.produto_id ORDER BY h.etapa_id)) as tempo_de_ocio
        FROM historico_etapa h
        JOIN etapa e ON h.etapa_id = e.id
        JOIN produto p ON h.produto_id = p.id
        WHERE p.linha_id = ${linhaId} AND p.status_geral = 'Concluido' AND h.fim_ts IS NOT NULL
      )
      -- Agrupa os resultados por etapa para calcular as médias
      SELECT
        h.etapa_id as "etapaId",
        h.nome_etapa as "nomeEtapa",
        AVG(h.duracao_etapa) as "duracaoMediaEtapa",
        AVG(COALESCE(h.tempo_de_ocio, INTERVAL '0 seconds')) as "tempoMedioDeOcio"
      FROM HistoricoComJanela h
      GROUP BY h.etapa_id, h.nome_etapa
      ORDER BY h.etapa_id;
    `;

    const { rows: analiseLinha } = await db.execute(query);

    if (analiseLinha.length === 0) {
      throw new AppError('Nenhum produto concluído encontrado nesta linha para análise.', 404);
    }
    
    const ocioTotalMedioSegundos = this._calcularOcioTotal(analiseLinha, 'tempoMedioDeOcio');

    return {
      analiseMediaPorEtapa: analiseLinha,
      ocioTotalMedioSegundos: ocioTotalMedioSegundos
    };
  }

  /**
   * Método privado para calcular o total de segundos de ócio a partir de um resultado de query.
   * @param resultados Array de resultados da query.
   * @param campoOcio O nome do campo que contém o intervalo de tempo de ócio.
   */
  private _calcularOcioTotal(resultados: any[], campoOcio = 'tempoDeOcio'): number {
    return resultados.reduce((sum: number, etapa: any) => {
      let seconds = 0;
      const tempoDeOcio = etapa[campoOcio];
      if (tempoDeOcio) {
          seconds += (tempoDeOcio.days || 0) * 86400;
          seconds += (tempoDeOcio.hours || 0) * 3600;
          seconds += (tempoDeOcio.minutes || 0) * 60;
          // O resultado de AVG() pode ser um número de segundos em vez de um objeto de intervalo
          seconds += (typeof tempoDeOcio === 'number' ? tempoDeOcio : (tempoDeOcio.seconds || 0));
      }
      return sum + seconds;
    }, 0);
  }
}