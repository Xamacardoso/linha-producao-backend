import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eventBodySchema, EventRequestBody } from '../schemas/event.schema';
import { EventService } from '../services/event.service';
import { AppError } from '../lib/AppError';

export default async function eventRoutes(fastify: FastifyInstance) {
  const eventService: EventService = new EventService();

  fastify.post('/linhas/:linhaId/etapas/:etapaId', {
    schema: {
      body: eventBodySchema,
      tags: ['Eventos de Linha'],
      summary: 'Processa eventos de START/STOP das etapas'
    }
  },
    
  async (request: FastifyRequest<{ Params: {linhaId: string, etapaId: string}, Body: EventRequestBody }>, reply: FastifyReply) => {
    const linha_id = parseInt(request.params.linhaId, 10);
    const etapa_id = parseInt(request.params.etapaId, 10);
    const tipo : "start" | "stop" = request.body.tipo;

    try {
      let produtoId: number = await eventService.startStop(etapa_id, linha_id, tipo);

      return reply.status(200).send({
        message: createEventMessage(tipo, etapa_id, linha_id),
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

  function createEventMessage(tipo: string, etapa_id: number, linha: number): string {
    return `Evento '${tipo}' para etapa ${etapa_id} na linha ${linha} processado com sucesso.`;
  }
}
