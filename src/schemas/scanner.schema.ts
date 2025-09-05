export const scannerBodySchema = {
    type: 'object',
    required: ['numero_serie', 'linha_id'],
    properties: {
      numero_serie: { type: 'string', minLength: 1, description: 'O número de série lido do QR code.' },
      linha_id: { type: 'number', minimum: 1, description: 'O ID da linha de produção onde o produto foi concluído.' },
    },
  } as const;