import { db } from "../db";
import { alerta, etapa } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AppError } from "../lib/AppError";

export type Alerta = typeof alerta.$inferSelect;

export class AlertService {
    public async criarAlerta(linhaId: number, etapaId: number) : Promise<Alerta> {
        const [newAlert] = await db
            .insert(alerta)
            .values({
                linhaId: linhaId,
                etapaId: etapaId,
                inicioAlertaTs: new Date().toISOString(),
                statusAlerta: 'Aberto',
                
                // Descrição padrão, pode ser alterada posteriormente
                descricao: `Alerta na etapa ${etapaId}, na linha ${linhaId}`
            })
            .returning();

        return newAlert;
    }

    public async resolverAlerta(linhaId: number, etapaId: number) : Promise<Alerta> {
        // Busca o alerta
        const [lastOpenAlert] = await db
            .select()
            .from(alerta)
            .where(
                and(
                    eq(alerta.linhaId, linhaId),
                    eq(alerta.etapaId, etapaId),
                    eq(alerta.statusAlerta, 'Aberto')
                )
            )
            .orderBy(desc(alerta.inicioAlertaTs)) // Pega o último alerta aberto
            .limit(1);

        if (!lastOpenAlert) {
            throw new AppError('Nenhum alerta aberto encontrado para a linha e etapa especificadas.', 404);
        }

        // Atualiza ele
        const [resolvedAlert] = await db
            .update(alerta)
            .set({
                fimAlertaTs: new Date().toISOString(),
                statusAlerta: 'Resolvido'
            })
            .where(eq(alerta.id, lastOpenAlert.id))
            .returning();
        
        return resolvedAlert;
    }

    public async listarAlertas() {
        const alertas: Alerta[] = await db.select().from(alerta)
            .orderBy(desc(alerta.inicioAlertaTs)); // Ordena por data de início do alerta
        
        if (alertas.length === 0) {
            throw new AppError('Nenhum alerta encontrado.', 404);
        }

        return alertas;
    }
}