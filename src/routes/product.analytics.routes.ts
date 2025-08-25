import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../lib/AppError';
import { ProductAnalyticsService } from '../services/product.analytics.service';

export default async function productAnalyticsRoutes(fastify: FastifyInstance) {
  const productAnalyticsService = new ProductAnalyticsService();

  // Rota para buscar análise de tempos de um produto específico
  fastify.get('/produto/:produtoId', { schema: { tags: ['Análises'], summary: 'Calcula tempos de ciclo e ociosidade de um produto específico, identificado por "produtoId"' } },
  async (request: FastifyRequest<{ Params: { produtoId: string } }>, reply: FastifyReply) => {
    const produtoId = parseInt(request.params.produtoId, 10);

    try {
      const analise = await productAnalyticsService.analisarTempoProduto(produtoId);
      return reply.status(200).send(analise);

    } catch (e) {
      fastify.log.error(e);

      if (e instanceof AppError) {
        return reply.status(e.statusCode).send({ message: e.message });
      }

      return reply.status(500).send({ message: 'Erro interno ao analisar tempos do produto.' });
    }
  });


  // Rota para análise de uma linha de producao
  fastify.get('/linha/:linhaId', { schema: { tags: ['Análises'], summary: 'Calcula tempos médios para uma linha de produção' } },
    async (request: FastifyRequest<{ Params: { linhaId: string } }>, reply: FastifyReply) => {
      const linhaId = parseInt(request.params.linhaId, 10);

      try {
        const analise = await productAnalyticsService.analisarTemposPorLinha(linhaId);
        return reply.status(200).send(analise);

      } catch (e) {
        fastify.log.error(e);

        if (e instanceof AppError) {
          return reply.status(e.statusCode).send({ message: e.message });
        }

        return reply.status(500).send({ message: 'Erro interno ao analisar tempos da linha.' });
      }
  });
}
