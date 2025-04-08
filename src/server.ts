import { startApp } from './app';

const start = async () => {
  try {
    const app = await startApp();
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host, listenTextResolver: (address) => {
      console.log(`Servidor rodando em http://${host}:${port}`);
      console.log(`Swagger UI disponível em http://${host}:${port}/documentation`);
    }});
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

start();