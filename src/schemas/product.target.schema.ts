import {z} from "zod";

export const productTargetBodySchema = z.object({
    meta: z.number()
        .min(1, { message: "A meta deve ser no mínimo 1" })
        .describe('Quantidade da meta de produção para a linha especificada.'),
});

export type ProductTargetRequestBody = z.infer<typeof productTargetBodySchema>;