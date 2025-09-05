import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { scannerBodySchema } from '../schemas/scanner.schema';
import { ScannerService } from '../services/scanner.service';
import { AppError } from '../lib/AppError';

const INTEGRITY_ERROR = '23505'; // Erro de violação de chave única

interface IScanBody {
  numero_serie: string;
  linha_id: number;
}

export default async function scannerRoutes(fastify: FastifyInstance) {
  const scannerService = new ScannerService();

  fastify.post('/associar', { schema: { body: scannerBodySchema, tags: ['Scanner'], summary: 'Associa um serial ao último produto concluído' } },
  async (request: FastifyRequest<{ Body: IScanBody }>, reply: FastifyReply) => {
    const { numero_serie, linha_id } = request.body;

    try {
      const produtoAtualizado = await scannerService.associarAoUltimo(numero_serie, Number(linha_id));
      return reply.status(200).send({
        message: 'Número de série associado com sucesso ao produto.',
        produto: produtoAtualizado
      });

    } catch (e: any) {
      fastify.log.error(e);

      if (e.code === INTEGRITY_ERROR) {
        return reply.status(400).send({ message: 'Numero de serie já associado a outro produto.' });
      }

      if (e instanceof AppError) {
        return reply.status(e.statusCode).send({ message: e.message });
      }

      return reply.status(500).send({ message: 'Erro ao associar numero de serie.' });
    } 
  });
}