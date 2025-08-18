import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eventBodySchema } from '../schemas/event.schema';
import { EventService } from '../services/event.service';

interface IEventBody {
  tipo: 'start' | 'stop';
  etapa: number;
  linha_id: number;
}

export default async function eventRoutes(fastify: FastifyInstance) {
  const eventService: EventService = new EventService();

  fastify.post('/', { schema: { body: eventBodySchema, tags: ['Eventos de Linha'], summary: 'Processa eventos de START/STOP das etapas' } }, 
  async (request: FastifyRequest<{ Body: IEventBody }>, reply: FastifyReply) => {
    const { tipo, etapa, linha_id } = request.body;

    try {
      let produtoId: number;
      
      produtoId = await eventService.startStop(etapa, linha_id, tipo);

      return reply.status(200).send({ 
        message: `Evento '${tipo}' para etapa ${etapa} na linha ${linha_id} processado com sucesso.`,
        produtoId: produtoId 
      });
      
    } catch (e) {
      fastify.log.error(e);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    }
  });
}
