import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});