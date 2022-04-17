const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getContractAddress } = require('@ethersproject/address')
const { solidity } = require("ethereum-waffle");
const search64 = require('../../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');
// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';
const { hexToString } = require('wtfprotocol-helpers');
const {
  vmExceptionStr,
  orcidKid, orcidBottomBread, orcidTopBread,
  googleKid, googleBottomBread, googleTopBread,
  deployVerifyJWTContract,
  deployIdAggregator,
  deployWTFBios,
  sha256FromString,
  sandwichIDWithBreadFromContract,
  jwksKeyToPubkey,
} = require('./utils/utils');


describe("IdentityAggregator", function () {

  describe("keywords", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();
    });

    it("Should be empty when contract is deployed", async function () {
      expect(await this.idAggregator.getKeywords()).to.be.an('array').that.is.empty;
    });
    
    it("Should include 'orcid' after support for orcid contract is added", async function () {
      const keyword = 'orcid';
      await this.idAggregator.addVerifyJWTContract(keyword, "0x100DEF1234567890ABCDEF1234567890ABCDE001");
      expect(await this.idAggregator.getKeywords()).to.include(keyword);
    });
    
    it("Should include 'google' after support for google contract is added", async function () {
      const keyword = 'google';
      await this.idAggregator.addVerifyJWTContract(keyword, "0x200DEF1234567890ABCDEF1234567890ABCDE002");
      expect(await this.idAggregator.getKeywords()).to.include(keyword);
    });

    it("Should include both 'orcid' and 'google'", async function () {
      const keywords = ['orcid', 'google'];
      expect(await this.idAggregator.getKeywords()).to.have.members(keywords);
    });

    // Test deletion
    it("Should not include 'orcid' after support for orcid contract is removed", async function () {
      const keyword = 'orcid';
      await this.idAggregator.removeSupportFor(keyword);
      expect(await this.idAggregator.getKeywords()).to.not.include(keyword);
    });

    it("Should not include 'google' after support for google contract is removed", async function () {
      const keyword = 'google';
      await this.idAggregator.removeSupportFor(keyword);
      expect(await this.idAggregator.getKeywords()).to.not.include(keyword);
    });

    // Test addition after deletion
    it("Should include 'twitter' after support for twitter contract is added", async function () {
      const keyword = 'twitter';
      await this.idAggregator.addVerifyJWTContract(keyword, "0x300DEF1234567890ABCDEF1234567890ABCDE003");
      expect(await this.idAggregator.getKeywords()).to.include(keyword);
    });

  });

  describe("biosContract", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();
    });

    it("Should be all zeros when contract is deployed", async function () {
      expect(await this.idAggregator.getBiosContractAddress()).to.equal('0x0000000000000000000000000000000000000000');
    });
    
    it("Should be updated when setBiosContractAddress is called", async function () {
      await this.idAggregator.setBiosContractAddress("0x100def1234567890AbCdEf1234567890abCde001");
      expect(await this.idAggregator.getBiosContractAddress()).to.equal('0x100def1234567890AbCdEf1234567890abCde001');
    });
  });

  describe("contractAddrForKeyword", function () {
    it("Should be updated when support for a new contract is added", async function () {
      const idAggregator = await deployIdAggregator();
      const [owner] = await ethers.getSigners();

      // get contract address for VerifyJWT
      const transactionCount = await owner.getTransactionCount();
      const vjwtAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      });

      vjwt = await deployVerifyJWTContract(11, 59, orcidKid, orcidBottomBread, orcidTopBread);

      const keyword = "orcid";
      await idAggregator.addVerifyJWTContract(keyword, vjwtAddress);

      const verifyJWTAddress = await idAggregator.callStatic.contractAddrForKeyword(keyword);
      expect(verifyJWTAddress).to.equal(vjwtAddress);
    });
  });

  describe("addVerifyJWTContract", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();
    });

    it("Should revert when attempting to use the keyword of an already supported contract", async function () {
      const keyword = 'twitter';
      addr = '0x100DEF1234567890ABCDEF1234567890ABCDE001';
      await this.idAggregator.addVerifyJWTContract(keyword, addr);
      addr = '0x200DEF1234567890ABCDEF1234567890ABCDE002';
      const funcStr = 'addVerifyJWTContract(string,address)';
      await expect(this.idAggregator[funcStr](keyword, addr)).to.be.revertedWith(vmExceptionStr + "'This keyword is already being used'");
    });
  });

  describe("removeSupportFor", async function () {
    // Try to remove an unsupported contract
    it("Should revert ", async function () {
      const idAggregator = await deployIdAggregator()
      keyword = 'twitter';
      await idAggregator.addVerifyJWTContract(keyword, "0x100DEF1234567890ABCDEF1234567890ABCDE001");
      expect(await idAggregator.getKeywords()).to.include(keyword);

      keyword = "definitelynotthekeyword";
      const funcStr = 'removeSupportFor(string)';
      await expect(idAggregator[funcStr](keyword)).to.be.revertedWith(vmExceptionStr + "'There is no corresponding contract for this keyword'");
    });
  });

  describe("getAllAccounts", function () {
    before(async function () {
      this.idAggregator = await deployIdAggregator();

      const [owner] = await ethers.getSigners();
      [this.name, this.bio] = ['name', 'Business person']
      this.wtfBios = await deployWTFBios();
      await this.wtfBios.connect(owner).setNameAndBio(this.name, this.bio);
      await this.idAggregator.setBiosContractAddress(this.wtfBios.address);
    });

    it("Should return array of supported creds, the first of which is the correct orcid", async function() {
      //--------------------------- Set up context ---------------------------
      const [owner] = await ethers.getSigners();

      // get contract address for VerifyJWT
      const transactionCount = await owner.getTransactionCount();
      const vjwtAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      });

      const [eOrcid, nOrcid] = jwksKeyToPubkey('{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}');
      const vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);

      // Set up context to call commitJWTProof() and verifyMe()
      const idToken = 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A';
      const correctID = '0000-0002-2308-9517';
      const [headerRaw, payloadRaw, signatureRaw] = idToken.split('.');
      const signature = Buffer.from(signatureRaw, 'base64url');
      const message = headerRaw + '.' + payloadRaw;
      const payloadIdx = Buffer.from(headerRaw).length + 1; //Buffer.from('.').length == 1
      const sandwich = await sandwichIDWithBreadFromContract(correctID, vjwt);
      const [startIdx, endIdx] = search64.searchForPlainTextInBase64(Buffer.from(sandwich, 'hex').toString(), payloadRaw);
      const hashedMessage = sha256FromString(message);
      const proof = ethers.utils.sha256(await vjwt.XOR(hashedMessage, owner.address));

      await vjwt.commitJWTProof(proof);
      await ethers.provider.send('evm_mine');
      await vjwt.verifyMe(ethers.BigNumber.from(signature), message, payloadIdx, startIdx, endIdx, '0x'+sandwich);
      
      const keyword = "orcid";
      await this.idAggregator.addVerifyJWTContract(keyword, vjwtAddress);

      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const creds = hexToString(allAccounts['creds'][0]);

      //--------------------------- Run test ---------------------------

      expect(creds).to.equal(correctID);
    });

    it("Should return array of supported creds, the second of which is the correct gmail", async function() {
      //--------------------------- Set up context ---------------------------
      const [owner] = await ethers.getSigners();

      // get contract address for VerifyJWT
      const transactionCount = await owner.getTransactionCount();
      const vjwtAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      });

      const [eGoogle, nGoogle] = jwksKeyToPubkey('{"alg":"RS256","use":"sig","n":"pFcwF2goSItvLhMJR1u0iPu2HO3wy6SSppmzgISWkRItInbuf2lWdQBt3x45mZsS9eXn6t9lUYnnduO5MrVtA1KoeZhHfSJZysIPh9S7vbU7_mV9SaHSyFPOOZr5jpU2LhNJehWqek7MTJ7FfUp1sgxtnUu-ffrFvMpodUW5eiNMcRmdIrd1O1--WlMpQ8sNk-KVTb8M8KPD0SYz-8kJLAwInUKK0EmxXjnYPfvB9RO8_GLAU7jodmTcVMD25PeA1NRvYqwzpJUYfhAUhPtE_rZX-wxn0udWddDQqihU7T_pTxiZe9R0rI0iAg--pV0f1dYnNfrZaB7veQq_XFfvKw","e":"AQAB","kty":"RSA","kid":"729189450d49028570425266f03e737f45af2932"}')
      const vjwt = await deployVerifyJWTContract(eGoogle, nGoogle, googleKid, googleBottomBread, googleTopBread);

      // Set up context to call commitJWTProof() and verifyMe()
      const idToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcyOTE4OTQ1MGQ0OTAyODU3MDQyNTI2NmYwM2U3MzdmNDVhZjI5MzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiMDREZXRTaGNSYUE4OWxlcEQzdWRnUSIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjQ3NjYzNDk4LCJleHAiOjE2NDc2NjcwOTgsImp0aSI6IjE4ZmRmMGQ2M2VhYjI4YjRlYmY0NmFiMDMzZTM5OTU3NmE5MTJlZGUifQ.YqmOub03zNmloAcFvZE0E-4Gt2Y5fr_9XQLUYqXQ24X_GJaJh0HSQXouJeSXjnk8PT6E1FnPd89QAgwDvE_qxAoOvW7VKDycVapOeDtKdTQ-QpAn-ExE0Pvqgx1iaGRZFDS4DWESX1ZsQIBAB_MHK_ZFdAnOjeFzImuMkB1PZLY99przSaM8AEyvWn8wfEgdmkdoJERBXF7xJI2dfA9mTRjlQvhSC4K060bTJbUYug4sQLrvo53CsDjvXRnodnCB81EVWZUbf5B9dG__kebI3AjedKUcPb2wofpX_B7uAyVlD7Au3APEbZP7Asle0Bi76hDNGPQbLvR_nGWLoySfCQ';
      const correctID = 'nanaknihal@gmail.com';
      const [headerRaw, payloadRaw, signatureRaw] = idToken.split('.');
      const signature = Buffer.from(signatureRaw, 'base64url');
      const message = headerRaw + '.' + payloadRaw;
      const payloadIdx = Buffer.from(headerRaw).length + 1; //Buffer.from('.').length == 1
      const sandwich = await sandwichIDWithBreadFromContract(correctID, vjwt);
      const [startIdx, endIdx] = search64.searchForPlainTextInBase64(Buffer.from(sandwich, 'hex').toString(), payloadRaw);
      const hashedMessage = sha256FromString(message);
      const proof = ethers.utils.sha256(await vjwt.XOR(hashedMessage, owner.address));

      await vjwt.commitJWTProof(proof);
      await ethers.provider.send('evm_mine');
      await vjwt.verifyMe(ethers.BigNumber.from(signature), message, payloadIdx, startIdx, endIdx, '0x'+sandwich);
      
      const keyword = "google";
      await this.idAggregator.addVerifyJWTContract(keyword, vjwtAddress);

      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const creds = hexToString(allAccounts['creds'][1]);

      //--------------------------- Run test ---------------------------

      expect(creds).to.equal(correctID);
    });

    it("Should return the correct array of supported creds", async function() {
      const [owner] = await ethers.getSigners();
      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const credsArray = allAccounts['creds'].map(creds => hexToString(creds));

      expect(credsArray).to.include.members(['nanaknihal@gmail.com', '0000-0002-2308-9517']);
    });

    it("Should return an array that includes gmail but not orcid", async function() {
      await this.idAggregator.removeSupportFor('orcid');
      const [owner] = await ethers.getSigners();
      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const credsArray = allAccounts['creds'].map(creds => hexToString(creds));

      expect(credsArray).to.not.include.members(['0000-0002-2308-9517']);
    });

    it("Should return an array that includes neither orcid nor gmail", async function() {
      await this.idAggregator.removeSupportFor('google');
      const [owner] = await ethers.getSigners();
      const allAccounts = await this.idAggregator.callStatic.getAllAccounts(owner.address);
      const credsArray = allAccounts['creds'].map(creds => hexToString(creds));

      expect(credsArray).to.not.include.members(['nanaknihal@gmail.com', '0000-0002-2308-9517']);
    });
  });

});
