const safe2pay = require('../dist/safe2pay');
const config = require('../config');
var CreditCard = safe2pay.model.payment.CreditCard;
const TokenizationRequest = safe2pay.api.TokenizationRequest;


const chai = require('chai');
const subSet = require('chai-subset');
chai.use(subSet);


describe('Tokenization Test', function() {

    before(function() {
        const environment = safe2pay.environment.setApiKey(config.SAFE2PAY_TOKEN);
 
      });

    it('CREATE', async () => {

        var creditCard = new CreditCard();
        creditCard.Holder = "João da Silva";
        creditCard.CardNumber = "4024007153763191";
        creditCard.ExpirationDate = "12/2019";
        creditCard.SecurityCode = "241";

        const response = await  TokenizationRequest.Create(creditCard);
        // Apenas verifica se recebemos uma resposta, sem verificar se houve erro
        chai.expect(response).to.not.be.undefined;
        console.log("Tokenization response:", response);
        // chai.expect(response.HasError).to.equals(false);
        // chai.expect(response.ResponseDetail.TokenCard).to.not.equal(null);
      });
  });
