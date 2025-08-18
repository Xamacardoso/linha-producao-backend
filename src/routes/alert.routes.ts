import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { alertBodySchema } from '../schemas/alert.schema';
import { Alerta, AlertService } from '../services/alert.service';
import { AppError } from '../lib/AppError';

interface IAlertBody {
    linha_id: number;
    etapa_id: number;
}

export default async function alertRoutes(fastify: FastifyInstance) {
  const alertService: AlertService = new AlertService();

  // Rota para buscar todos os alertas
  fastify.get('/', { schema: { tags: ['Alertas'], summary: 'Lista todos os alertas abertos' } },
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const alertas: Alerta[] = await alertService.listarAlertas();
      return reply.status(200).send(alertas);

    } catch (e) {
      fastify.log.error(e);
      return reply.status(500).send({ message: 'Erro ao listar alertas.' });
    }
  });

  // Rota para INICIAR um novo alerta
  fastify.post('/', { schema: { body: alertBodySchema, tags: ['Alertas'], summary: 'Cria um novo alerta na linha' } },
  async (request: FastifyRequest<{ Body: IAlertBody }>, reply: FastifyReply) => {
    const { linha_id, etapa_id } = request.body;
    
    try {
      const newAlert = await alertService.criarAlerta(linha_id, etapa_id);
      return reply.status(201).send(newAlert);

    } catch (e) {
      fastify.log.error(e);
      return reply.status(500).send({ message: 'Erro ao criar alerta.' });
    }
  });   

  // Rota para RESOLVER/FINALIZAR um alerta existente
  fastify.patch('/:linhaId/:etapaId/resolver', { schema: { tags: ['Alertas'], summary: 'Resolve o último alerta aberto para uma linha e etapa' } },
  async (request: FastifyRequest<{ Params: { linhaId: string, etapaId: string } }>, reply: FastifyReply) => {
    const { linhaId, etapaId } = request.params;
    
    try {
      const resolvedAlert: Alerta = await alertService.resolverAlerta(Number(linhaId), Number(etapaId));
      return reply.status(200).send(resolvedAlert);
    } catch (e) {
      fastify.log.error(e);

      if (e instanceof AppError) {
        return reply.status(e.statusCode).send({ message: e.message });
      }

      return reply.status(500).send({ message: 'Erro ao resolver alerta.' });
    }
  });
}
