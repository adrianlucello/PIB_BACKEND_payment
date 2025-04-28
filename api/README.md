# Documentação da API - Pagamento PIX

## Endpoints Disponíveis

### Gerar QR Code PIX

**Endpoint:** `/pix/gerar`  
**Método:** POST  
**Descrição:** Gera um QR Code PIX para pagamento

**Requisição esperada:**
```json
{
  "nome": "string", // Nome completo do pagador (obrigatório)
  "cpf": "string", // CPF sem pontuação (obrigatório)
  "email": "string", // Email válido (obrigatório)
  "telefone": "string", // Telefone sem formatação (obrigatório)
  "valor": "string", // Valor do pagamento (obrigatório)
  "descricao": "string", // Descrição do pagamento (opcional)
  "referencia": "string" // Código de referência (opcional)
}
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "qrCode": "string", // Imagem do QR code em base64
  "pixCopiaECola": "string", // Texto PIX copia e cola
  "idTransaction": "string" // ID da transação para consultas futuras
}
```

**Possíveis erros:**
- 400: Dados incompletos para geração do PIX
- 500: Erro interno do servidor

### Verificar Status de Pagamento

**Endpoint:** `/pix/verificar/{idTransaction}`  
**Método:** GET  
**Descrição:** Verifica o status atual de uma transação PIX

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "status": 1, // Código do status (número)
  "statusDescription": "PENDENTE", // Descrição do status
  "isPaid": false, // true se o pagamento foi confirmado
  "transactionData": { /* dados completos da transação */ }
}
```

**Códigos de status:**
- 1: PENDENTE
- 2: PROCESSAMENTO
- 3: AUTORIZADO
- 4: DISPONÍVEL
- 8: RECUSADO

### Rota de Teste (para desenvolvimento)

**Endpoint:** `/pix/teste`  
**Método:** POST  
**Descrição:** Simula a geração de PIX sem usar a API real do Safe2Pay

**Requisição esperada:** Mesma estrutura do endpoint `/pix/gerar`

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "qrCode": "string", // URL de imagem de QR code simulado
  "pixCopiaECola": "string", // Texto PIX copia e cola simulado
  "idTransaction": "string" // ID da transação para consultas futuras
}
```

## Observações Técnicas

- Todos os endpoints esperam e retornam dados no formato JSON
- O header `Content-Type: application/json` deve ser incluído em todas as requisições
- O CORS está habilitado para todos os origins
- O campo de valor deve ser enviado como string (ex: "100.00")
- Os timeouts das requisições são de 30 segundos
- A API está rodando na porta 3001

## Exemplo de configuração de proxy para Frontend React

Para evitar problemas de CORS, adicione esta configuração no seu `package.json` frontend:

```json
"proxy": "http://localhost:3001"
```

Com esta configuração, ao invés de chamar `http://localhost:3001/pix/gerar`, você pode chamar simplesmente `/pix/gerar` no seu código frontend.

## Tratamento de erros no frontend

Para melhor experiência do usuário, implemente try/catch adequado:

```javascript
try {
  const response = await fetch('/pix/gerar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erro desconhecido');
  }
  
  const data = await response.json();
  // processar dados do QR code aqui
} catch (error) {
  console.error('Erro:', error);
  // mostrar mensagem de erro para o usuário
}
```

## Salvamento de Inscrição

**Endpoint:** `/api/salvar-inscricao`  
**Método:** POST  
**Descrição:** Salva os dados de uma inscrição

**Requisição esperada:**
```json
{
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "cpf": "string",
  "idTransaction": "string",
  "status": "string"
}
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "message": "Inscrição salva com sucesso"
}
```
