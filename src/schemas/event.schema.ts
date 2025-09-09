// Usamos "as const" para que o TypeScript trate isso como um objeto imutável,
// o que melhora a inferência de tipos e a validação no Fastify.
export const eventBodySchema = {
    type: 'object',
    required: ['tipo', 'etapa_id', 'linha_id'],
    properties: {
      tipo: { type: 'string', enum: ['start', 'stop'], description: 'O tipo de evento ocorrido.' },
      etapa_id: { type: 'number', minimum: 1, maximum: 5, description: 'O número da etapa onde o evento ocorreu.' },
      linha_id: { type: 'number', minimum: 1, description: 'O ID da linha de produção onde o evento ocorreu.' },
    },
  } as const;