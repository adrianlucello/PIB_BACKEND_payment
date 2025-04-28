const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Importar rotas
const pixRoutes = require('./pix');
const cartaoRoutes = require('./cartao');

// Carregar variáveis de ambiente com caminho absoluto
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Verificar arquivos de configuração
console.log('Verificando configurações...');
if (fs.existsSync(envPath)) {
  console.log('Arquivo .env.local encontrado');
} else {
  console.log('Arquivo .env.local NÃO encontrado, tentando usar config.js');
  try {
    const config = require('../config');
    console.log('config.js foi carregado com sucesso');
    
    // Verificar se contém token
    if (config.SAFE2PAY_TOKEN) {
      console.log('Token Safe2Pay encontrado no config.js');
    } else {
      console.warn('AVISO: Token Safe2Pay NÃO encontrado no config.js');
    }
  } catch (error) {
    console.error('ERRO: Não foi possível carregar config.js:', error.message);
  }
}

// Configurar express
const app = express();
const PORT = process.env.API_PORT || 3001; // Porta diferente do servidor principal

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

// Adicionar middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configurar pasta public para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para externo.html
app.get('/externo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'externo.html'));
});

// Rota para teste.html
app.get('/teste', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teste.html'));
});

// Middleware para tratamento de erros de parse de JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Erro de parse JSON:', err);
    return res.status(400).json({ 
      success: false, 
      error: 'JSON inválido' 
    });
  }
  next(err);
});

// Usar rotas
app.use('/pix', pixRoutes);
app.use('/cartao', cartaoRoutes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Rota não encontrada' 
  });
});

// Middleware para tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Erro interno do servidor' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`API PIX rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log(`Exemplo externo: http://localhost:${PORT}/externo`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app; 