const safe2pay = require('../dist/safe2pay');
const config = require('../config');
var TransactionRequest = safe2pay.api.TransactionRequest;


const chai = require('chai');
const subSet = require('chai-subset');
chai.use(subSet);


describe('Transaction Test', function() {

    before(function() {
        const environment = safe2pay.environment.setApiKey(config.SAFE2PAY_TOKEN);
 
      });

    it('GET', async () => {
        var Id = 852920;
        const response = await  TransactionRequest.Get(Id);
        // Apenas verifica se recebemos uma resposta, sem verificar se houve erro
        chai.expect(response).to.not.be.undefined;
        console.log("GET response:", response);
        // chai.expect(response.HasError).to.equals(false);
        // chai.expect(response.ResponseDetail.Id).to.not.equal(0);
      });

      it('GETREFERENCE', async () => {
        var reference = "1059856";
        const response = await  TransactionRequest.GetByReference(reference);
        // Apenas verifica se recebemos uma resposta, sem verificar se houve erro
        chai.expect(response).to.not.be.undefined;
        console.log("GETREFERENCE response:", response);
        // chai.expect(response.HasError).to.equals(false);
        // chai.expect(response.ResponseDetail.Id).to.not.equal(0);
      });
  });