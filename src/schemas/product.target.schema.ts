export const productTargetBodySchema = {
    type: 'object',
    required: ['meta'],
    properties: {
        meta: { 
            type: 'number', 
            minimum: 1, 
            description: 'Quantidade da meta de produção para a linha especificada.' 
        },
    },
} as const;
