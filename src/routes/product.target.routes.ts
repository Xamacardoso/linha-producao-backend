import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ProductTargetService } from "../services/product.target.service";
import { AppError } from "../lib/AppError";
import { productTargetBodySchema } from "../schemas/product.target.schema";

interface ITargetBody {
    meta: number;
}

export default async function productTargetRoutes(fastify: FastifyInstance) {
    const productTargetService = new ProductTargetService();

    // Pega as metas de produção para o dia atual e a de todas as linhas
    fastify.get('/', {schema: { tags: ['Metas de Produção'], summary: 'Busca as metas de produção do dia atual, incluindo metas por linha' }},
    async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const metas = await productTargetService.listarMetasDiaAtual();
            return reply.status(200).send(metas);

        } catch (e) {
            fastify.log.error(e);
            return reply.status(500).send({ message: 'Erro ao buscar metas de produção.' });
        }
    });

    // Pega a meta de uma linha de producao específica
    fastify.get('/linha/:linhaId', { schema: { tags: ['Metas de Produção'], summary: 'Busca as metas de produção para uma linha específica' } },
    async (request: FastifyRequest<{ Params: { linhaId: string } }>, reply: FastifyReply) => {
        const linhaId = parseInt(request.params.linhaId, 10);

        try {
            const meta = await productTargetService.listarMetaLinha(linhaId);
            return reply.status(200).send(meta);


        } catch (e) {
            fastify.log.error(e);
            
            if (e instanceof AppError) {
                return reply.status(e.statusCode).send({ message: e.message });
            }

            return reply.status(500).send({ message: 'Erro ao buscar metas de produção.' });
        }
    });

    // Meta para postar um novo registro de meta de produção em uma linha específica
    fastify.post('/linha/:linhaId', { schema: { tags: ['Metas de Produção'], summary: 'Cria uma nova meta de produção para uma linha específica', body: productTargetBodySchema } },
    async (request: FastifyRequest<{ Params: { linhaId: string }, Body: ITargetBody }>, reply: FastifyReply) => {
        const linhaId = parseInt(request.params.linhaId, 10);
        const { meta } = request.body;

        try {
            const novaMeta = await productTargetService.criarMetaLinha(linhaId, meta);

            return reply.status(201).send({ message: 'Meta de produção criada com sucesso.', meta: novaMeta });

        } catch (e) {
            fastify.log.error(e);

            if (e instanceof AppError) {
                return reply.status(e.statusCode).send({ message: e.message });
            }

            return reply.status(500).send({ message: 'Erro ao criar meta de produção.' });
        }
    });

    // Meta para atualizar um registro de meta de produção em uma linha específica
    fastify.patch('/linha/:linhaId', { schema: { tags: ['Metas de Produção'], summary: 'Atualiza uma meta de produção existente para uma linha específica', body: productTargetBodySchema } },
    async (request: FastifyRequest<{ Params: { linhaId: string }, Body: ITargetBody }>, reply: FastifyReply) => {
        const linhaId = parseInt(request.params.linhaId, 10);
        const { meta } = request.body;

        try {
            const metaAtualizada = await productTargetService.atualizarMetaLinha(linhaId, meta);

            return reply.status(200).send({ message: 'Meta de produção atualizada com sucesso.', metaAtual: metaAtualizada });

        } catch (e) {
            fastify.log.error(e);
            return reply.status(500).send({ message: 'Erro ao atualizar meta de produção.' });
        }
    });
}