import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function productAnalyticsRoutes(fastify: FastifyInstance) {
  
  // Rota para buscar análise de tempos de um produto específico
  fastify.get('/:produtoId/analise-tempo', { schema: { tags: ['Análises'], summary: 'Calcula tempos de ciclo e ociosidade de um produto específico, identificado por "produtoId"' } },
  async (request: FastifyRequest<{ Params: { produtoId: string } }>, reply: FastifyReply) => {
    const { produtoId } = request.params;

    try {
      // Query com Window Function (LAG) para calcular durações e ociosidade
      const query = `
        WITH HistoricoComJanela AS (
            SELECT
                h.produto_id,
                h.etapa_id,
                e.nome_etapa,
                h.inicio_ts,
                h.fim_ts,
                -- Pega o timestamp de fim da etapa anterior para o mesmo produto
                LAG(h.fim_ts, 1) OVER (PARTITION BY h.produto_id ORDER BY h.etapa_id) AS "fimEtapaAnterior"
            FROM historico_etapa h
            JOIN etapa e ON h.etapa_id = e.id
            WHERE h.produto_id = $1
        )
        SELECT
            h.etapa_id AS "etapaId",
            h.nome_etapa AS "nomeEtapa",
            -- Duração da etapa em si (ciclo)
            (h.fim_ts - h.inicio_ts) as "duracaoEtapa",
            -- Tempo de ócio (espera) antes do início desta etapa
            CASE
                WHEN h."fimEtapaAnterior" IS NOT NULL AND h.inicio_ts IS NOT NULL
                THEN h.inicio_ts - h."fimEtapaAnterior"
                ELSE INTERVAL '0 seconds'
            END AS "tempoDeOcio"
        FROM HistoricoComJanela h
        ORDER BY h.etapa_id;
      `;

      const { rows: analiseEtapas } = await fastify.pg.query(query, [produtoId]);
      
      if (analiseEtapas.length === 0) {
        return reply.status(404).send({ message: 'Produto não encontrado ou sem histórico para análise.' });
      }

      // Calcula o tempo de ócio total a partir dos resultados
      const ocioTotalSegundos = analiseEtapas.reduce((sum: number, etapa: any) => {
        // O formato de intervalo do node-pg é um objeto { hours, minutes, seconds, ... }
        let seconds = 0;
        if (etapa.tempoDeOcio) {
            seconds += (etapa.tempoDeOcio.days || 0) * 86400;
            seconds += (etapa.tempoDeOcio.hours || 0) * 3600;
            seconds += (etapa.tempoDeOcio.minutes || 0) * 60;
            seconds += (etapa.tempoDeOcio.seconds || 0);
        }
        return sum + seconds;
      }, 0);
      
      return reply.status(200).send({
          analisePorEtapa: analiseEtapas,
          ocioTotalSegundos: ocioTotalSegundos,
      });

    } catch (e) {
      fastify.log.error(e);
      return reply.status(500).send({ message: 'Erro interno ao analisar tempos do produto.' });
    }
  });
}
