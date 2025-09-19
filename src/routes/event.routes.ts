import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
// 1. Aqui importa-se o schema Zod e o tipo inferido
import { eventBodySchema, EventBody } from '../schemas/event.schema';
import { EventService } from '../services/event.service';
import { AppError } from '../lib/AppError';

//2. Remove-se a interface, pois não é mais necessária.

export default async function eventRoutes(fastify: FastifyInstance) {
  const eventService: EventService = new EventService();

  fastify.post('/', {
    //3. Usa-se o schema Zod para validação
    schema: {
      body: eventBodySchema,
      tags: ['Eventos de Linha'],
      summary: 'Processa eventos de START/STOP das etapas'
    }
  },
    //4. Usa-se o tipo 'EventBody' inferido pelo Zod no event.schema.ts
    async (request: FastifyRequest<{ Body: EventBody }>, reply: FastifyReply) => {
      // Agora 'request.body' é 100% seguro em tipos e já foi validado!
      const { tipo, etapa_id, linha_id } = request.body;

      try {
        let produtoId: number;

        produtoId = await eventService.startStop(etapa_id, linha_id, tipo);

        return reply.status(200).send({
          message: `Evento '${tipo}' para etapa ${etapa_id} na linha ${linha_id} processado com sucesso.`,
          produtoId: produtoId
        });

      } catch (e) {
        fastify.log.error(e);

        if (e instanceof AppError) {
          return reply.status(e.statusCode).send({ message: e.message });
        }

        return reply.status(500).send({ message: 'Erro interno do servidor.' });
      }
    });
}
