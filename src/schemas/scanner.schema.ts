export const scannerBodySchema = {
    type: 'object',
    required: ['numero_serie'],
    properties: {
      numero_serie: { type: 'string', minLength: 1, description: 'O número de série lido do QR code.' },
    },
  } as const;