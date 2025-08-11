import { startApp } from './app';

// Função para iniciar o servidor
const start = async () => {
  try {
    // Inicializar a aplicação
    const app = await startApp();
    
    // Configurações do servidor
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    // Iniciar o servidor
    await app.listen({ port, host, listenTextResolver: (address) => {
      console.log(`=== Sistema do Sindicato dos Estivadores ===`);
      console.log(`Servidor rodando em http://${host}:${port}`);
      console.log(`Documentação Swagger disponível em http://${host}:${port}/documentation`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
      console.log(`Data/Hora de inicialização: ${new Date().toLocaleString()}`);
      console.log(`========================================`);
    }});
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar o servidor
start();