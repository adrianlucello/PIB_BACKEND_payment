import safe2pay from '../safe2pay.js';
import { SAFE2PAY_IS_SANDBOX } from '../config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, cpf, email, telefone, valor, referencia } = req.body;

    if (!nome || !cpf || !email || !telefone || !valor) {
      return res.status(400).json({ error: 'Dados incompletos para geração do PIX' });
    }

    const Transaction = safe2pay.model.transaction.Transaction;
    const Customer = safe2pay.model.general.Customer;
    const Product = safe2pay.model.general.Product;
    const Address = safe2pay.model.general.Address;
    const Pix = safe2pay.model.payment.Pix;
    const PaymentRequest = safe2pay.api.PaymentRequest;

    const referenciaFinal = referencia ? `${referencia}_${Date.now()}` : `PAGAMENTO_${Date.now()}`;

    const transaction = new Transaction();
    transaction.IsSandbox = SAFE2PAY_IS_SANDBOX;
    transaction.Application = "Inscrição Face a Face com Deus";
    transaction.Vendor = nome;
    transaction.CallbackUrl = "";
    transaction.PaymentMethod = "6";
    transaction.Reference = referenciaFinal;

    const pix = new Pix();
    pix.Expiration = 3600;
    transaction.PaymentObject = pix;

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
    customer.Phone = telefone;
    customer.Email = email;

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
      return res.status(200).json({
        success: true,
        qrCode: response.ResponseDetail.QrCode,
        pixCopiaECola: response.ResponseDetail.Key,
        idTransaction: String(response.ResponseDetail.IdTransaction)
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar PIX: ' + (response.Error || 'Erro desconhecido')
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor: ' + error.message
    });
  }
} 