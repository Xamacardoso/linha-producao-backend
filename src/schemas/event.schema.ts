import { z } from 'zod'; // importa o objeto principal do zod

export const eventBodySchema = z.object({
  tipo: z.enum(['start', 'stop'])
    .describe('O tipo de evento ocorrido.')
});

export type EventRequestBody = z.infer<typeof eventBodySchema>;