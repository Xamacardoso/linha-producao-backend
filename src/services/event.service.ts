import { db } from "src/db";
import { produto, historicoEtapa, etapa } from "src/db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { AppError } from "src/lib/AppError";

export class EventService {
    public async startStop(etapa: number, linhaId: number, tipo: 'start' | 'stop'): Promise<number> {
        if (tipo === 'start') {
            return this.iniciarEtapa(etapa, linhaId);
        } else if (tipo === 'stop') {
            return this.finalizarEtapa(etapa, linhaId);
        } else {
            throw new AppError('Tipo de evento inválido. Use "start" ou "stop".', 400);
        }

    }

    private async iniciarEtapa(etapa: number, linhaId: number): Promise<number> {
        if (etapa === 1) {
            return this.iniciarProducao(linhaId);
        } else {
            return this.avancarEtapa(etapa, linhaId);
        }
    }

    private async avancarEtapa(etapa: number, linhaId: number) {
        const etapaAnterior = etapa - 1;

        const [produtoParaAvancar] = await db.select({id: produto.id})
            .from(produto)
            .where(
                and(
                    eq(produto.linhaId, linhaId),
                    eq(produto.statusGeral, 'Em producao'),
                    isNotNull(
                        db.select().from(historicoEtapa).where(
                            and(
                                eq(historicoEtapa.produtoId, produto.id),
                                eq(historicoEtapa.etapaId, etapaAnterior),
                                isNotNull(historicoEtapa.fimTs)
                            )
                        )
                    ),
                    isNull(
                        db.select().from(historicoEtapa).where(
                            and(
                                eq(historicoEtapa.produtoId, produto.id),
                                eq(historicoEtapa.etapaId, etapa),
                                isNull(historicoEtapa.fimTs)
                            )
                        )   
                    )
                )
            )
            .limit(1);
        
        if (!produtoParaAvancar) {
            throw new AppError(`Nenhum produto encontrado para avançar na etapa ${etapa} da linha ${linhaId}`, 404);
        }

        const { id: produtoId } = produtoParaAvancar;

        await db.update(historicoEtapa)
            .set({inicioTs: new Date().toISOString()})
            .where(and(eq(historicoEtapa.produtoId, produtoId), eq(historicoEtapa.etapaId, etapa)));

        return produtoId;
    }

    private async finalizarEtapa(etapa: number, linhaId: number) : Promise<number> {
        return db.transaction(async (tx) => {
            // Encontra o produto que está ativo na etapa e linha especificadas
            const [produtoNaEtapa] = await tx
              .select({ produtoId: historicoEtapa.produtoId })
              .from(historicoEtapa)
              .innerJoin(produto, eq(historicoEtapa.produtoId, produto.id))
              .where(
                and(
                  eq(historicoEtapa.etapaId, etapa),
                  eq(produto.linhaId, linhaId),
                  isNotNull(historicoEtapa.inicioTs),
                  isNull(historicoEtapa.fimTs)
                )
              )
              .limit(1);
            
            if (!produtoNaEtapa) {
              throw new AppError(`Nenhum produto encontrado ocupando a etapa ${etapa} na linha ${linhaId}.`, 404);
            }
            
            const { produtoId } = produtoNaEtapa;
      
            // Sempre finaliza o timestamp da etapa atual
            await tx
              .update(historicoEtapa)
              .set({ fimTs: new Date().toISOString() })
              .where(and(eq(historicoEtapa.produtoId, produtoId), eq(historicoEtapa.etapaId, etapa)));
            
            // Se for a última etapa, chama o método privado para concluir o status do produto
            if (etapa === 5) {
              await this.finalizarProducao(produtoId, tx);
            }
      
            return produtoId;
          });
    }

    private async iniciarProducao(linhaId: number) : Promise<number> {
        return db.transaction(async (tx) => {
            const [newProduct] = await tx
                .insert(produto)
                .values({ linhaId: linhaId, statusGeral: 'Em producao' })
                .returning({ id: produto.id });

            const produtoId = newProduct.id;

            const todasEtapas = [1,2,3,4,5].map(numEtapa => ({
                produtoId: produtoId,
                etapaId: numEtapa,
            }));

            await tx.insert(historicoEtapa).values(todasEtapas);

            await tx.update(historicoEtapa)
                .set({ inicioTs: new Date().toISOString() })
                .where(and(
                    eq(historicoEtapa.produtoId, produtoId),
                    eq(historicoEtapa.etapaId, 1),
                ));
                
            return produtoId;
        });
    }

    private async finalizarProducao(produtoId: number, tx: any) {
        const [produtoConcluido] = await tx
            .update(produto)
            .set({
                statusGeral: 'Concluido',
                dataConclusao: new Date().toISOString()
            })
            .where(eq(produto.id, produtoId))
            .returning();

        if (!produtoConcluido) {
            throw new AppError('Produto não encontrado para finalizar produção', 404);
        }

        return produtoConcluido;
    }
}