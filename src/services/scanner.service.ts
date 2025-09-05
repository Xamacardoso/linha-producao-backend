import { db } from "../db";
import { produto } from "../db/schema"; // Schema do modelo de produto na linha
import { eq, and, isNull, desc } from "drizzle-orm";
import { AppError } from "../lib/AppError";

// Inferindo o tipo do produto a partir do schema para reutilização
export type Produto = typeof produto.$inferSelect;

export class ScannerService {
    // Método para associar um número de série ao último produto concluído na linha especificada
    public async associarAoUltimo(numeroSerie: string, linhaId: number): Promise<Produto> {
        // Garantindo atomicidade da operação
        const updatedProduct = await db.transaction(async (tx) => {  // tx é a transação da ORM ativa
            // Encontra o produto
            const [targetProduct] = await tx
                .select({id: produto.id})
                .from(produto)
                .where(
                    and (
                        eq(produto.statusGeral, 'Concluido' ),
                        isNull(produto.nSerie),
                        eq(produto.linhaId, linhaId) // Funcao eq para COMPARAR valores
                    )
                )
                .orderBy(desc(produto.dataConclusao)) // Pega o ULTIMO produto concluido
                .limit(1)
                .for('update');

            // Verifica se um produto foi encontrado
            if (!targetProduct) {
                throw new AppError('Nenhum produto concluído aguardando número de série foi encontrado.', 404);
            }

            // Aplica o numero de serie e retorna o produto atualizado
            const [updated] = await tx 
                .update(produto)
                .set({ nSerie: numeroSerie })
                .where(eq(produto.id, targetProduct.id))
                .returning();

            return updated; // Retorna o produto atualizado
        });

        return updatedProduct;
    }
}