import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as schema from './schema';

dotenv.config();

// Cria uma instância do pool de conexão com o banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Exportar cliente drizzle com os seus schemas
export const db = drizzle(pool, { schema });