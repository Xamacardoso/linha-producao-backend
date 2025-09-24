import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ProductTargetService } from "../services/product.target.service";
import { AppError } from "../lib/AppError";
import { productTargetBodySchema, ProductTargetRequestBody } from "../schemas/product.target.schema";

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
    fastify.get('/linhas/:linhaId', { schema: { tags: ['Metas de Produção'], summary: 'Busca as metas de produção para uma linha específica' } },
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

    // Meta para criar ou atualizar um registro de meta de produção em uma linha específica
    fastify.put('/linhas/:linhaId', { schema: { tags: ['Metas de Produção'], summary: 'Cria uma meta de produção para uma determinada linha de montagem, ou atualiza, se já existir previamente', body: productTargetBodySchema } },
        async (request: FastifyRequest<{ Params: { linhaId: string }, Body: ProductTargetRequestBody }>, reply: FastifyReply) => {
            const linhaId = parseInt(request.params.linhaId, 10);
            const { meta } = request.body;
            
            try {
                const metaExistente = await productTargetService.listarMetaLinha(linhaId);

                if (!metaExistente) {
                    const novaMeta = await productTargetService.criarMetaLinha(linhaId, meta);
                    return reply.status(201).send({ message: 'Meta de produção criada com sucesso.', meta: novaMeta });
                }

                const metaAtualizada = await productTargetService.atualizarMetaLinha(linhaId, meta);
    
                return reply.status(200).send({ message: 'Meta de produção atualizada com sucesso.', metaAtual: metaAtualizada });
    
            } catch (e) {
                fastify.log.error(e);
    
                if (e instanceof AppError) {
                    return reply.status(e.statusCode).send({ message: e.message });
                }
    
                return reply.status(500).send({ message: 'Erro ao atualizar meta de produção.' });
            }
        });
}