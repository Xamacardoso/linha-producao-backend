export const alertBodySchema = {
    type: 'object',
    required: ['linha_id', 'etapa_id'],
    properties: {
      linha_id: { type: 'number', description: 'ID da linha de produção onde o alerta ocorreu.' },
      etapa_id: { type: 'number', description: '(Opcional) ID da etapa específica onde o alerta ocorreu.' },
    },
  } as const;