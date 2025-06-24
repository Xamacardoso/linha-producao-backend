import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { alertBodySchema } from '../schemas/alert.schema';
import { IAlerta } from '../types/entities';

interface IAlertBody {
    linha_id: number;
    etapa_id: number;
}

export default async function alertRoutes(fastify: FastifyInstance) {

  // Rota para INICIAR um novo alerta
  fastify.post('/', { schema: { body: alertBodySchema, tags: ['Alertas'], summary: 'Cria um novo alerta na linha' } },
  async (request: FastifyRequest<{ Body: IAlertBody }>, reply: FastifyReply) => {
    const { linha_id, etapa_id } = request.body;
    try {
      const { rows: [newAlert] } = await fastify.pg.query<IAlerta>(
        "INSERT INTO alerta (linha_id, etapa_id, inicio_alerta_ts, status_alerta) VALUES ($1, $2, NOW(), 'Aberto') RETURNING *",
        [linha_id, etapa_id]
      );
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
      // Primeiro, busca o último alerta aberto para a linha e etapa especificadas
      const { rows: [lastOpenAlert] } = await fastify.pg.query<IAlerta>(
        `SELECT * FROM alerta 
         WHERE linha_id = $1 AND etapa_id = $2 AND status_alerta = 'Aberto'
         ORDER BY inicio_alerta_ts DESC
         LIMIT 1`,
        [linhaId, etapaId]
      );

      if (!lastOpenAlert) {
        return reply.status(404).send({ message: 'Nenhum alerta aberto encontrado para esta linha e etapa.' });
      }

      // Agora, resolve esse alerta
      const { rows: [resolvedAlert] } = await fastify.pg.query<IAlerta>(
        "UPDATE alerta SET fim_alerta_ts = NOW(), status_alerta = 'Resolvido' WHERE id = $1 RETURNING *",
        [lastOpenAlert.id]
      );

      return reply.status(200).send(resolvedAlert);
    } catch (e) {
      fastify.log.error(e);
      return reply.status(500).send({ message: 'Erro ao resolver alerta.' });
    }
  });
}
