import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eventBodySchema } from '../schemas/event.schema';

interface IEventBody {
  tipo: 'start' | 'stop';
  etapa: number;
  linha_id: number;
}

export default async function eventRoutes(fastify: FastifyInstance) {
  fastify.post('/', { schema: { body: eventBodySchema, tags: ['Eventos de Linha'], summary: 'Processa eventos de START/STOP das etapas' } }, 
  async (request: FastifyRequest<{ Body: IEventBody }>, reply: FastifyReply) => {
    const { tipo, etapa, linha_id } = request.body;
    let produtoId: number | null = null;

    const client = await fastify.pg.connect();

    try {
      // Inicia uma transação para garantir que todas as operações sejam atômicas
      await client.query('BEGIN'); 

      if (tipo === 'start') {
        // --- CASO ESPECIAL: START NA ETAPA 1 (CRIAÇÃO DE PRODUTO) ---
        if (etapa === 1) {
          // 1. Cria a entidade principal do produto na tabela 'produtos'
          const { rows: [newProduct] } = await client.query(
            "INSERT INTO produto (linha_id, status_geral) VALUES ($1, 'Em producao') RETURNING id",
            [linha_id]
          );
          produtoId = newProduct.id;

          // 2. Cria os 5 registros de histórico de etapas para o novo produto, com timestamps nulos
          for (let i = 1; i <= 5; i++) {
            await client.query(
              'INSERT INTO historico_etapa (produto_id, etapa_id) VALUES ($1, $2)',
              [produtoId, i]
            );
          }
          
          // 3. Define o timestamp de início APENAS para a primeira etapa, que acabou de começar
          await client.query(
              'UPDATE historico_etapa SET inicio_ts = NOW() WHERE produto_id = $1 AND etapa_id = 1',
              [produtoId]
          );

        // --- CASO GERAL: START NAS ETAPAS 2, 3, 4 ---
        } else {
          const etapaAnterior = etapa - 1;
          // Procura pelo único produto que está aguardando para iniciar esta etapa na linha específica
          const { rows } = await client.query(
            `SELECT p.id FROM produto p WHERE p.linha_id = $1 AND p.status_geral = 'Em producao' AND EXISTS (SELECT 1 FROM historico_etapa h WHERE h.produto_id = p.id AND h.etapa_id = $2 AND h.fim_ts IS NOT NULL) AND EXISTS (SELECT 1 FROM historico_etapa h WHERE h.produto_id = p.id AND h.etapa_id = $3 AND h.inicio_ts IS NULL) LIMIT 1;`,
            [linha_id, etapaAnterior, etapa]
          );

          if (rows.length > 0) {
            produtoId = rows[0].id;
            // Atualiza o histórico para registrar o início da etapa
            await client.query('UPDATE historico_etapa SET inicio_ts = NOW() WHERE produto_id = $1 AND etapa_id = $2', [produtoId, etapa]);
          } else {
            // Se nenhum produto for encontrado, desfaz a transação e retorna um erro
            await client.query('ROLLBACK');
            client.release();
            return reply.status(404).send({ message: `Nenhum produto encontrado aguardando a etapa ${etapa} na linha ${linha_id}.` });
          }
        }

      } else if (tipo === 'stop') {
        // Lógica para encontrar o produto que está OCUPANDO a etapa atual na linha específica
        const { rows } = await client.query(
          `SELECT h.produto_id FROM historico_etapa h 
           JOIN produto p ON h.produto_id = p.id 
           WHERE h.etapa_id = $1 AND h.fim_ts IS NULL AND h.inicio_ts IS NOT NULL 
           AND p.linha_id = $2 LIMIT 1`,
          [etapa, linha_id]
        );
        
        if (rows.length > 0) {
          produtoId = rows[0].produto_id;
          // Finaliza a etapa atual, registrando o timestamp de fim
          await client.query('UPDATE historico_etapa SET fim_ts = NOW() WHERE produto_id = $1 AND etapa_id = $2', [produtoId, etapa]);
          
          // --- CASO ESPECIAL: STOP NA ETAPA 5 (CONCLUSÃO DO PRODUTO) ---
          if (etapa === 5) {
            // Além de finalizar a etapa, atualiza o status geral do produto para 'Concluido'
            await client.query(
              "UPDATE produto SET status_geral = 'Concluido', data_conclusao = NOW() WHERE id = $1", 
              [produtoId]
            );
          }
        } else {
          await client.query('ROLLBACK');
          client.release();
          return reply.status(404).send({ message: `Nenhum produto encontrado ocupando a etapa ${etapa} na linha ${linha_id}.` });
        }
      }

      // Se todas as operações foram bem-sucedidas, confirma a transação
      await client.query('COMMIT'); 
      return reply.status(200).send({ 
        message: `Evento '${tipo}' para etapa ${etapa} na linha ${linha_id} processado com sucesso.`,
        produtoId: produtoId 
      });

    } catch (e) {
      // Se qualquer erro ocorrer, desfaz todas as operações da transação
      await client.query('ROLLBACK'); 
      fastify.log.error(e);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    } finally {
      // Libera a conexão com o banco de dados de volta para o pool
      client.release(); 
    }
  });
}
