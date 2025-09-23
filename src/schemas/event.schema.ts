import { z } from 'zod'; // importa o objeto principal do zod

export const eventBodySchema = z.object({
  tipo: z.enum(['start', 'stop'])
    .describe('O tipo de evento ocorrido.'),

  etapa_id: z.number()
    .min(1, { message: "A etapa deve ser no mínimo 1" })
    .max(5, { message: "A etapa deve ser no máximo 5" })
    .describe('O número da etapa onde o evento ocorreu.'),
  
  linha_id: z.number()
    .min(1, { message: "O ID da linha deve ser no mínimo 1" })
    .describe('O ID da linha de produção onde o evento ocorreu.'),
});

export type EventRequestBody = z.infer<typeof eventBodySchema>;