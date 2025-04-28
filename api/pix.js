const express = require('express');
const dotenv = require('dotenv');
const safe2pay = require('safe2pay');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Carregar variáveis de ambiente com caminho absoluto
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Verificar se .env.local existe, se não, tentar carregar do config.js
let config;
try {
  if (fs.existsSync(envPath)) {
    console.log('Arquivo .env.local encontrado, carregando variáveis de ambiente');
  } else {
    console.log('.env.local não encontrado, tentando carregar config.js');
    config = require('../config');
  }
} catch (error) {
  console.error('Erro ao carregar configurações:', error);
}

// Criar o router
const router = express.Router();

// Permitir requisições de origens diferentes (CORS)
router.use(cors());

// Configurar API do Safe2Pay com as credenciais 
if (config) {
  console.log('Configurando Safe2Pay com token do config.js');
  safe2pay.environment.setApiKey(config.SAFE2PAY_TOKEN);
} else {
  console.log('Configurando Safe2Pay com token do .env.local');
  safe2pay.environment.setApiKey(process.env.SAFE2PAY_TOKEN);
}

// Determinar se está em ambiente sandbox
const isSandbox = config ? config.SAFE2PAY_IS_SANDBOX : (process.env.SAFE2PAY_IS_SANDBOX === 'true');
console.log('Ambiente sandbox:', isSandbox);

// Endpoint para gerar PIX
router.post('/gerar', async (req, res) => {
  try {
    console.log('Requisição recebida para gerar PIX:', req.body);
    const { nome, cpf, email, telefone, valor, descricao = "Pagamento PIX", referencia } = req.body;

    // Validar dados recebidos
    if (!nome || !cpf || !email || !telefone || !valor) {
      console.log('Dados incompletos:', { nome, cpf, email, telefone, valor });
      return res.status(400).json({ error: 'Dados incompletos para geração do PIX' });
    }

    // Importar os modelos necessários
    const Transaction = safe2pay.model.transaction.Transaction;
    const Customer = safe2pay.model.general.Customer;
    const Product = safe2pay.model.general.Product;
    const Address = safe2pay.model.general.Address;
    const Pix = safe2pay.model.payment.Pix;
    const PaymentRequest = safe2pay.api.PaymentRequest;

    // Dados adicionais para referência
    const referenciaFinal = referencia 
      ? `${referencia}_${Date.now()}`
      : `PAGAMENTO_${Date.now()}`;
    
    // Criar a transação
    const transaction = new Transaction();
    transaction.IsSandbox = isSandbox;
    transaction.Application = descricao;
    transaction.Vendor = nome;
    transaction.CallbackUrl = ""; // URL de callback (opcional)
    transaction.PaymentMethod = "6"; // 6 é o código para PIX no Safe2Pay
    transaction.Reference = referenciaFinal;

    // Criar objeto PIX
    const pix = new Pix();
    pix.Expiration = 3600; // Tempo de expiração em segundos (1 hora)
    transaction.PaymentObject = pix;

    // Adicionar produto
    transaction.Products = [];
    const valorFloat = parseFloat(valor);
    const product = new Product();
    product.Code = "PRODUTO001";
    product.Description = descricao;
    product.UnitPrice = valorFloat;
    product.Quantity = 1;
    transaction.Products.push(product);

    console.log(`Valor do produto: R$ ${valorFloat.toFixed(2)}`);

    // Dados do cliente
    const customer = new Customer();
    customer.Name = nome;
    customer.Identity = cpf; // Usar CPF fornecido pelo usuário
    customer.Phone = telefone;
    customer.Email = email;

    // Criar e adicionar endereço
    const address = new Address();
    address.ZipCode = "78000000";      // CEP genérico
    address.Street = "Rua Exemplo";
    address.Number = "123";
    address.District = "Centro";
    address.StateInitials = "MT";
    address.CityName = "Cuiabá";
    address.CountryName = "Brasil";
    
    // Adicionar o endereço ao cliente
    customer.Address = address;
    
    // Adicionar cliente à transação
    transaction.Customer = customer;

    console.log('Payload montado:', JSON.stringify(transaction, null, 2));

    // Chamar API do Safe2Pay para gerar o PIX
    console.log('Enviando requisição para Safe2Pay...');
    console.log('Token API Safe2Pay usado:', config ? config.SAFE2PAY_TOKEN : process.env.SAFE2PAY_TOKEN);
    
    const response = await PaymentRequest.Payment(transaction);
    console.log('Resposta da Safe2Pay:', JSON.stringify(response, null, 2));

    if (response && response.HasError === false) {
      // Retornar dados do PIX para o frontend
      return res.json({
        success: true,
        qrCode: response.ResponseDetail.QrCode,
        pixCopiaECola: response.ResponseDetail.Key,
        idTransaction: response.ResponseDetail.IdTransaction
      });
    } else {
      console.error('Erro ao gerar PIX (HasError):', response);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao gerar PIX: ' + (response.Error || 'Erro desconhecido') 
      });
    }
  } catch (error) {
    console.error('Erro no servidor (Exception):', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// Endpoint para verificar status de uma transação
router.get('/verificar/:idTransaction', async (req, res) => {
  try {
    const idTransaction = req.params.idTransaction;
    
    if (!idTransaction) {
      return res.status(400).json({ 
        success: false,
        error: 'ID da transação não informado' 
      });
    }
    
    console.log(`Verificando status da transação: ${idTransaction}`);
    
    // Importar o modelo necessário
    const TransactionRequest = safe2pay.api.TransactionRequest;
    
    // Buscar informações da transação
    const response = await TransactionRequest.Get(idTransaction);
    
    console.log('Resposta da verificação de status:', JSON.stringify(response, null, 2));
    
    if (response && !response.HasError) {
      // Status de transação do Safe2Pay:
      // 1 = PENDENTE, 3 = AUTORIZADO, 4 = DISPONÍVEL, 8 = RECUSADO, etc.
      
      const statusCode = parseInt(response.ResponseDetail.Status);
      const isPaid = [3, 4, 11, 12].includes(statusCode);
      
      console.log(`Verificação de status - ID: ${idTransaction}, Status: ${statusCode}, Pago: ${isPaid}`);
      
      // Retornar informações relevantes
      return res.json({
        success: true,
        status: statusCode,
        statusDescription: getStatusDescription(statusCode),
        isPaid: isPaid,
        transactionData: response.ResponseDetail
      });
    } else {
      console.error('Erro ao verificar status (HasError):', response);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao verificar status: ' + (response.Error || 'Erro desconhecido') 
      });
    }
  } catch (error) {
    console.error('Erro no servidor (Exception):', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// Adicionar rota de teste que não depende da Safe2Pay
router.post('/teste', async (req, res) => {
  try {
    console.log('Requisição de teste recebida:', req.body);
    
    // Verificar dados básicos
    const { nome, cpf, email, telefone, valor } = req.body;
    
    if (!nome || !cpf || !email || !telefone || !valor) {
      console.log('Dados incompletos:', { nome, cpf, email, telefone, valor });
      return res.status(400).json({ 
        success: false,
        error: 'Dados incompletos' 
      });
    }
    
    // Simular um QR Code e resposta
    const mockQrCodeUrl = 'https://cdn.pixabay.com/photo/2014/04/02/10/14/qr-code-303382_960_720.png';
    const mockPixKey = '00020126330014BR.GOV.BCB.PIX0111123456789021TESTE PIX SIMULADO520400005303986540150.005802BR5913LOJA EXEMPLO6008BRASILIA62070503***6304E757';
    
    // Retornar resposta simulada com delay para parecer mais real
    setTimeout(() => {
      res.json({
        success: true,
        qrCode: mockQrCodeUrl,
        pixCopiaECola: mockPixKey,
        idTransaction: 'TEST' + Date.now()
      });
    }, 1500);
    
  } catch (error) {
    console.error('Erro no endpoint de teste:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// Endpoint para verificar status de teste
router.get('/teste-status/:idTransaction', async (req, res) => {
  try {
    const idTransaction = req.params.idTransaction;
    console.log(`Verificando status de teste: ${idTransaction}`);
    
    // Verificar se é um ID de teste
    if (!idTransaction || !idTransaction.startsWith('TEST')) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de transação inválido' 
      });
    }
    
    // Determinar aleatoriamente se o pagamento foi confirmado (30% de chance)
    const isPaid = Math.random() < 0.3;
    const status = isPaid ? 3 : 1; // 3=AUTORIZADO, 1=PENDENTE
    
    // Retornar resposta simulada
    res.json({
      success: true,
      status: status,
      statusDescription: getStatusDescription(status),
      isPaid: isPaid,
      transactionData: {
        IdTransaction: idTransaction,
        Amount: 150.00,
        PaymentDate: isPaid ? new Date().toISOString() : null
      }
    });
    
  } catch (error) {
    console.error('Erro no endpoint de teste de status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// Função para obter descrição do status
function getStatusDescription(statusCode) {
  const statusMap = {
    1: 'PENDENTE',
    2: 'EM PROCESSAMENTO',
    3: 'AUTORIZADO',
    4: 'DISPONÍVEL',
    5: 'EM DISPUTA',
    6: 'DEVOLVIDO',
    7: 'BAIXADO',
    8: 'RECUSADO',
    11: 'LIBERADO',
    12: 'EM CANCELAMENTO',
    13: 'CHARGEBACK'
  };
  
  return statusMap[statusCode] || `DESCONHECIDO (${statusCode})`;
}

module.exports = router; 