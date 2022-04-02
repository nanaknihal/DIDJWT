const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getContractAddress } = require('@ethersproject/address')
const { solidity } = require("ethereum-waffle");
const search64 = require('../../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');
// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';
const { hexToString } = require('wtfprotocol-helpers');
const {
  vmExceptionStr,
  orcidKid, orcidBotomBread, orcidTopBread,
  deployVerifyJWTContract,
  deployIdAggregator,
  sha256FromString,
  sandwichIDWithBreadFromContract,
  jwksKeyToPubkey,
} = require('./utils/utils');

// chai.use(solidity);


describe.only("IdentityAggregator", function () {

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

      vjwt = await deployVerifyJWTContract(11, 59, orcidKid, orcidBotomBread, orcidTopBread);

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
    it("Should return array of supported creds", async function() {
      //--------------------------- Set up context ---------------------------

      const idAggregator = await deployIdAggregator();
      const [owner] = await ethers.getSigners();

      // get contract address for VerifyJWT
      const transactionCount = await owner.getTransactionCount();
      const vjwtAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      });

      const [eOrcid, nOrcid] = jwksKeyToPubkey('{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}');
      const vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, orcidKid, orcidBotomBread, orcidTopBread);

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
      await idAggregator.addVerifyJWTContract(keyword, vjwtAddress);

      const allAccounts = await idAggregator.callStatic.getAllAccounts(owner.address);
      const creds = hexToString(allAccounts[0]);
      console.log(creds)

      //--------------------------- Run test ---------------------------

      expect(creds).to.equal(correctID);
    });

    // TODO: Test adding google creds and ensuring both orcid and google creds are returned

    // TODO: Test that orcid creds aren't returned after removing support for orcid contract
  });

});

