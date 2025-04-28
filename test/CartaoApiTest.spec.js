const request = require('supertest');
const app = require('../api/index');

describe('API de Cartão - /cartao/pagar', () => {
  it('deve processar um pagamento de teste com cartão de crédito válido', async () => {
    const payload = {
      nome: 'adrian lucelo',
      numero: '5105105105105100',
      validade: '08/2026', // formato completo aceito pela Safe2Pay
      cvv: '123',
      parcelas: 1,
      valor: 150.00,
      inscricaoId: 'TESTE123',
      cpf: '08185740119', // CPF fictício válido
      email: 'adrian.teste@example.com',
      telefone: '11999999999'
    };

    const response = await request(app)
      .post('/cartao/pagar')
      .send(payload)
      .set('Accept', 'application/json');

    console.log('Resposta da API:', response.body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('idTransaction');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('statusDescription');
    expect(response.body).toHaveProperty('paid');
    expect(typeof response.body.success).toBe('boolean');
    expect(typeof response.body.idTransaction).toBe('string');
    expect(typeof response.body.status).toBe('number');
    expect(typeof response.body.statusDescription).toBe('string');
    expect(typeof response.body.paid).toBe('boolean');
  });
}); 