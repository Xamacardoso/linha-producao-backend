import { z } from 'zod';

export const alertBodySchema = z.object({
  linha_id: z.number()
    .min(1, { message: "O ID da linha deve ser no mínimo 1" })
    .describe('O ID da linha de produção onde o alerta ocorreu.'),

  etapa_id: z.number()
    .min(1, { message: "A etapa deve ser no mínimo 1" })
    .max(5, { message: "A etapa deve ser no máximo 5" })
    .describe('O número da etapa onde o alerta ocorreu.'),
})

export type AlertRequestBody = z.infer<typeof alertBodySchema>;