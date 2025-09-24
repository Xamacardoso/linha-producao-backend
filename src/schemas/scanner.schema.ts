import z from "zod";

export const scannerBodySchema = z.object({
    numero_serie: z.string().min(1, { message: "O número de série não pode ser vazio" })
        .describe('O número de série lido do QR code.'),
    linha_id: z.number().min(1, { message: "O ID da linha deve ser no mínimo 1" })
        .describe('O ID da linha de produção onde o produto foi concluído.'),
});

export type ScannerRequestBody = z.infer<typeof scannerBodySchema>;