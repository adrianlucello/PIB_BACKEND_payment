const express = require('express');
const safe2pay = require('safe2pay');
const dotenv = require('dotenv');
const path = require('path');
const config = require('../config');

const router = express.Router();

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
safe2pay.environment.setApiKey(config.SAFE2PAY_TOKEN);

// Endpoint para pagamento com cartão de crédito
router.post('/pagar', async (req, res) => {
  try {
    const { nome, numero, validade, cvv, parcelas, valor, inscricaoId, cpf, email, telefone } = req.body;

    // Validação básica dos dados
    if (!nome || !numero || !validade || !cvv || !parcelas || !valor || !cpf) {
      return res.status(400).json({ success: false, error: 'Dados incompletos para pagamento com cartão' });
    }

    // Importar os modelos necessários
    const Transaction = safe2pay.model.transaction.Transaction;
    const Customer = safe2pay.model.general.Customer;
    const Product = safe2pay.model.general.Product;
    const Address = safe2pay.model.general.Address;
    const CreditCard = safe2pay.model.payment.CreditCard;
    const PaymentRequest = safe2pay.api.PaymentRequest;

    // Dados adicionais para referência
    const referencia = inscricaoId 
      ? `INSCRICAO_${inscricaoId}_${Date.now()}`
      : `INSCRICAO_${Date.now()}`;
    
    // Criar a transação
    const transaction = new Transaction();
    transaction.IsSandbox = config.SAFE2PAY_IS_SANDBOX;
    transaction.Application = "Inscrição Face a Face com Deus";
    transaction.Vendor = nome;
    transaction.CallbackUrl = ""; // URL de callback (opcional)
    transaction.PaymentMethod = "2"; // 2 é o código para cartão de crédito no Safe2Pay
    transaction.Reference = referencia;

    // Criar objeto Cartão de Crédito
    const creditCard = new CreditCard();
    creditCard.Holder = nome;
    creditCard.CardNumber = numero.replace(/\s/g, '');
    creditCard.ExpirationDate = validade;
    creditCard.SecurityCode = cvv;
    creditCard.InstallmentQuantity = parseInt(parcelas);
    transaction.PaymentObject = creditCard;

    // Adicionar produto
    transaction.Products = [];
    const valorFloat = parseFloat(valor);
    const product = new Product();
    product.Code = "INSCRICAO001";
    product.Description = "Inscrição Face a Face com Deus";
    product.UnitPrice = valorFloat;
    product.Quantity = 1;
    transaction.Products.push(product);

    // Dados do cliente
    const customer = new Customer();
    customer.Name = nome;
    customer.Identity = cpf;
    customer.Phone = telefone || "51999999999";
    customer.Email = email || "inscricao@faceaface.com.br";

    // Criar e adicionar endereço
    const address = new Address();
    address.ZipCode = "78000000";
    address.Street = "Rua Exemplo";
    address.Number = "123";
    address.District = "Centro";
    address.StateInitials = "MT";
    address.CityName = "Cuiabá";
    address.CountryName = "Brasil";
    customer.Address = address;
    transaction.Customer = customer;

    // Chamar API do Safe2Pay para processar o pagamento
    const response = await PaymentRequest.Payment(transaction);

    if (response && response.HasError === false) {
      const statusCode = parseInt(response.ResponseDetail.Status);
      const isPaid = [3, 4, 11, 12].includes(statusCode);
      return res.json({
        success: true,
        idTransaction: String(response.ResponseDetail.IdTransaction),
        status: statusCode,
        statusDescription: getStatusDescription(statusCode),
        paid: isPaid
      });
    } else {
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao processar pagamento: ' + (response.Error || 'Erro desconhecido') 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// Função auxiliar para descrição do status
function getStatusDescription(statusCode) {
  statusCode = parseInt(statusCode);
  const statusMap = {
    1: 'PENDENTE',
    2: 'PROCESSAMENTO',
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
  return statusMap[statusCode] || 'DESCONHECIDO';
}

module.exports = router; 