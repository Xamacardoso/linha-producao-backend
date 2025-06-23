import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { scannerBodySchema } from '../schemas/scanner.schema';
import { IProduto } from '../types/entities';

interface IScanBody {
  numero_serie: string;
}

export default async function scannerRoutes(fastify: FastifyInstance) {
  
  fastify.post('/associar-ao-ultimo', { schema: { body: scannerBodySchema, tags: ['Scanner'], summary: 'Associa um serial ao último produto concluído' } },
  async (request: FastifyRequest<{ Body: IScanBody }>, reply: FastifyReply) => {
    const { numero_serie } = request.body;
    const client = await fastify.pg.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Encontra o produto concluído mais recente que AINDA NÃO TEM um 'id_produto' (número de série).
      //    "FOR UPDATE" é CRUCIAL aqui. Ele bloqueia a linha encontrada para evitar que duas chamadas
      //    simultâneas tentem pegar o mesmo produto, garantindo que não haja race conditions.
      const { rows: [targetProduct] } = await client.query<IProduto>(
        `SELECT id FROM produto 
         WHERE status_geral = 'Concluido' AND n_serie IS NULL 
         ORDER BY data_conclusao DESC 
         LIMIT 1 
         FOR UPDATE;`
      );

      // 2. Verifica se um produto foi encontrado
      if (!targetProduct) {
        await client.query('ROLLBACK');
        return reply.status(404).send({ message: 'Nenhum produto concluído aguardando número de série foi encontrado.' });
      }

      const produtoId = targetProduct.id;

      // 3. Aplica o número de série ao produto encontrado
      const { rows: [updatedProduct] } = await client.query<IProduto>(
        "UPDATE produto SET n_serie = $1 WHERE id = $2 RETURNING *",
        [numero_serie, produtoId]
      );

      await client.query('COMMIT');

      return reply.status(200).send({
        message: `Número de série '${numero_serie}' associado com sucesso.`,
        produto: updatedProduct
      });

    } catch (e: any) {
      await client.query('ROLLBACK');
      fastify.log.error(e);

      // Trata erro de violação de unicidade (se o número de série já existir no banco)
      if (e.code === '23505') {
          return reply.status(409).send({ message: `O número de série '${numero_serie}' já está em uso.` });
      }
      return reply.status(500).send({ message: 'Erro interno ao associar número de série.' });
    } finally {
      client.release();
    }
  });
}