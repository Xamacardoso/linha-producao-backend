import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function productTargetRoutes(fastify: FastifyInstance) {
    // const productTargetService = new ProductTargetService();

    // Pega as metas de produção para o dia atual e a de todas as linhas
    fastify.get('/', {schema: { tags: ['Metas de Produção'], summary: 'Busca as metas de produção do dia atual, incluindo metas por linha' }},
    async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // const metas = await productTargetService.getMetasDiaAtual();
            // return reply.status(200).send(metas);

            return reply.status(200).send({ message: 'Rota não implementada.' }); // Placeholder para implementação futura

        } catch (e) {
            fastify.log.error(e);
            return reply.status(500).send({ message: 'Erro ao buscar metas de produção.' });
        }
    });

    // Pega as metas de uma linha de producao específica
    fastify.get('/:linhaId', { schema: { tags: ['Metas de Produção'], summary: 'Busca as metas de produção para uma linha específica' } },
    async (request: FastifyRequest<{ Params: { linhaId: string } }>, reply: FastifyReply) => {
        const linhaId = parseInt(request.params.linhaId, 10);

        try {
            // const metas = await productTargetService.getMetasPorLinha(linhaId);
            // return reply.status(200).send(metas);

            return reply.status(200).send({ message: 'Rota não implementada.' }); // Placeholder para implementação futura

        } catch (e) {
            fastify.log.error(e);
            return reply.status(500).send({ message: 'Erro ao buscar metas de produção.' });
        }
    }
    )
}