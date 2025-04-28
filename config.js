// Configuração do Safe2Pay
// Carrega valores do arquivo .env.local ou .env
require('dotenv').config({ path: '.env.local' });

// Verificar se estamos em ambiente de produção
const isProduction = process.env.NODE_ENV === 'production';

// Função para obter valor de variável de ambiente ou usar fallback
const getEnvValue = (key, fallback = '') => {
  return process.env[key] || fallback;
};

module.exports = {
  // Valores das variáveis de ambiente
  SAFE2PAY_TOKEN: getEnvValue('SAFE2PAY_TOKEN'),
  SAFE2PAY_SECRET_KEY: getEnvValue('SAFE2PAY_SECRET_KEY'),
  SAFE2PAY_MERCHANT_ID: getEnvValue('SAFE2PAY_MERCHANT_ID'),
  SAFE2PAY_IS_SANDBOX: getEnvValue('SAFE2PAY_IS_SANDBOX', 'false') === 'true',
  SAFE2PAY_BASE_URL: getEnvValue('SAFE2PAY_BASE_URL', 'https://payment.safe2pay.com.br/v2'),
  
  // Variáveis adicionais
  IS_PRODUCTION: isProduction
}; 