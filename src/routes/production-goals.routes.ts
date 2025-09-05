// src/routes/production-goals.routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductTargetService } from '../services/product.target.service';
import { AppError } from '../lib/AppError';
import { productTargetBodySchema } from '../schemas/product.target.schema';

interface IBody {
  meta: number;
}

export default async function productionGoalsRoutes(fastify: FastifyInstance) {
  const productTargetService = new ProductTargetService();

  fastify.post(
    '/:lineId/meta-diaria',
    {
      schema: {
        tags: ['Metas de Produção'],
        description: 'Define/atualiza a meta diária para a linha especificada.',
        params: {
          type: 'object',
          required: ['lineId'],
          properties: {
            lineId: { type: 'string', description: 'ID da linha' },
          },
        },
        body: productTargetBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              metaAtual: { type: 'object' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { lineId: string }; Body: IBody }>,
      reply: FastifyReply
    ) => {
      const lineId = parseInt(request.params.lineId, 10);
      const { meta } = request.body;

      if (isNaN(lineId)) {
        return reply.status(400).send({ success: false, message: 'lineId inválido' });
      }

      try {
        const metaAtualizada = await productTargetService.atualizarMetaLinha(lineId, meta);
        return reply
          .status(200)
          .send({ success: true, message: 'Meta diária definida/atualizada', metaAtual: metaAtualizada });
      } catch (e: any) {
        fastify.log.error(e);
        if (e instanceof AppError) {
          return reply.status(e.statusCode).send({ success: false, message: e.message });
        }
        return reply.status(500).send({ success: false, message: 'Erro ao definir meta diária' });
      }
    }
  );
}
