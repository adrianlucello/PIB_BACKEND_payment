import safe2pay from '../../safe2pay.js';
import { SAFE2PAY_IS_SANDBOX } from '../../config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, numero, validade, cvv, parcelas, valor, inscricaoId, cpf, email, telefone } = req.body;

    if (!nome || !numero || !validade || !cvv || !parcelas || !valor || !cpf) {
      return res.status(400).json({ success: false, error: 'Dados incompletos para pagamento com cartão' });
    }

    const Transaction = safe2pay.model.transaction.Transaction;
    const Customer = safe2pay.model.general.Customer;
    const Product = safe2pay.model.general.Product;
    const Address = safe2pay.model.general.Address;
    const CreditCard = safe2pay.model.payment.CreditCard;
    const PaymentRequest = safe2pay.api.PaymentRequest;

    const referencia = inscricaoId ? `INSCRICAO_${inscricaoId}_${Date.now()}` : `INSCRICAO_${Date.now()}`;

    const transaction = new Transaction();
    transaction.IsSandbox = SAFE2PAY_IS_SANDBOX;
    transaction.Application = "Inscrição Face a Face com Deus";
    transaction.Vendor = nome;
    transaction.CallbackUrl = "";
    transaction.PaymentMethod = "2";
    transaction.Reference = referencia;

    const creditCard = new CreditCard();
    creditCard.Holder = nome;
    creditCard.CardNumber = numero.replace(/\s/g, '');
    creditCard.ExpirationDate = validade;
    creditCard.SecurityCode = cvv;
    creditCard.InstallmentQuantity = parseInt(parcelas);
    transaction.PaymentObject = creditCard;

    transaction.Products = [];
    const valorFloat = parseFloat(valor);
    const product = new Product();
    product.Code = "INSCRICAO001";
    product.Description = "Inscrição Face a Face com Deus";
    product.UnitPrice = valorFloat;
    product.Quantity = 1;
    transaction.Products.push(product);

    const customer = new Customer();
    customer.Name = nome;
    customer.Identity = cpf;
    customer.Phone = telefone || "51999999999";
    customer.Email = email || "inscricao@faceaface.com.br";

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

    const response = await PaymentRequest.Payment(transaction);

    if (response && response.HasError === false) {
      const statusCode = parseInt(response.ResponseDetail.Status);
      const isPaid = [3, 4, 11, 12].includes(statusCode);
      return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    });
  }
}

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