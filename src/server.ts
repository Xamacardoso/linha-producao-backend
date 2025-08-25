import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyPostgres from '@fastify/postgres';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import * as dotenv from 'dotenv';

// Importa as rotas
import eventRoutes from './routes/event.routes';
import scannerRoutes from './routes/scanner.routes';
import alertRoutes from './routes/alert.routes';
import productAnalyticsRoutes from './routes/product.analytics.routes';
import productTargetRoutes from './routes/product.target.routes';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const server: FastifyInstance = Fastify({
  logger: true,
});

// Middleware para capturar erros de parsing JSON
server.addHook('onError', (request, reply, error, done) => {
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    reply.status(400).send({
      error: 'JSON malformado',
      message: 'O corpo da requisição deve ser um JSON válido',
      details: error.message
    });
  }
  done();
});

// --- Middlewares e Plugins ---
// Registra o CORS para permitir requisições de outras origens (ex: seu frontend)
server.register(cors, { origin: '*' }); // Em produção, restrinja a origem para o domínio do seu frontend

// Registra o plugin para conectar ao Banco de Dados PostgreSQL
server.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL,
});

// Registra o Swagger para gerar a especificação OpenAPI
server.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'API de Monitoramento de Linha de Produção',
      description: 'Documentação dos endpoints da API para gerenciar o fluxo da linha de produção.',
      version: '1.0.0'
    },
    host: `localhost:${process.env.PORT || 3000}`, // Host dinâmico
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

// Registra a UI do Swagger para criar uma página de documentação interativa
server.register(fastifySwaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list', // 'full', 'none'
    deepLinking: true
  },
});

// --- Registro de Rotas ---
// Cada grupo de rotas é registrado com um prefixo para manter a API organizada
server.register(eventRoutes, { prefix: '/api/eventos' });
server.register(scannerRoutes, { prefix: '/api/scanner' });
server.register(alertRoutes, { prefix: '/api/alertas' });
server.register(productTargetRoutes, { prefix: '/api/metas' });
server.register(productAnalyticsRoutes, { prefix: '/api/analise-tempo' });

// --- Inicialização do Servidor ---
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    // O host '0.0.0.0' é importante para rodar dentro de containers Docker
    await server.listen({ port, host: '0.0.0.0' });
    await server.ready();
    server.swagger(); // Garante que a especificação swagger seja gerada
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();