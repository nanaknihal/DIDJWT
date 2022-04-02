const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getContractAddress } = require('@ethersproject/address')
const { solidity } = require("ethereum-waffle");
const search64 = require('../../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');
// import { fixedBufferXOR as xor, sandwichIDWithBreadFromContract, padBase64, hexToString, searchForPlainTextInBase64 } from 'wtfprotocol-helpers';
const { hexToString } = require('wtfprotocol-helpers');


// chai.use(solidity);


//-------------------- Constants & Helpers --------------------

const orcidKid = '7hdmdswarosg3gjujo8agwtazgkp1ojs'
const orcidBotomBread = '0x222c22737562223a22'
const orcidTopBread = '0x222c22617574685f74696d65223a'

const deployVerifyJWTContract = async (...args) => {
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  return await upgrades.deployProxy(VJWT, args, {
    initializer: 'initialize',
  });
}

const sha256FromString = x => ethers.utils.sha256(ethers.utils.toUtf8Bytes(x))

// Make sure it does bottomBread + id + topBread and does not allow any other text in between. If Google changes their JWT format so that the sandwich now contains other fields between bottomBread and topBread, this should fail until the contract is updated. 
const sandwichIDWithBreadFromContract = async (id, contract) => {
  let sandwich = (await contract.bottomBread()) + Buffer.from(id).toString('hex') + (await contract.topBread());
  sandwich = sandwich.replaceAll('0x', '');
  return sandwich
}

// Converts JWKS RSAkey to e and n:
const jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url'))
  ]
}

//-------------------------------------------------



describe.only("IdentityAggregator", function () {

  // TODO: What's the best way to initialize contract variables before all tests, instead of initializing within every test?

  before(async function () {
    const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
    this.idAggregator = await IdentityAggregator.deploy();
    await this.idAggregator.deployed();
  });

  describe("keywords", function () {

    it("Should be empty when contract is deployed", async function () {
      // const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
      // const idAggregator = await IdentityAggregator.deploy();
      // await idAggregator.deployed();
  
      expect(await this.idAggregator.getKeywords()).to.be.an('array').that.is.empty;
    });
    
    it("Should be updated when support for a new contract is added", async function () {

      //--------------------------- Set up context ---------------------------

      // const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
      // const idAggregator = await IdentityAggregator.deploy();
      // await idAggregator.deployed();

      // get mock vjwt contract address
      const [owner] = await ethers.getSigners()
      const transactionCount = await owner.getTransactionCount()
      const verifyJWTAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      })

      const keyword = 'orcid';
      await this.idAggregator.addPlatformContract(keyword, verifyJWTAddress);

      //--------------------------- Run test ---------------------------

      expect(await this.idAggregator.getKeywords()).to.have.members([keyword]);
    });
  });

  describe("contractAddrForKeyword", function () {
    it("Should be updated when support for a new contract is added", async function () {

      //--------------------------- Set up context ---------------------------

      const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
      const idAggregator = await IdentityAggregator.deploy();
      await idAggregator.deployed();

      // get contract address for VerifyJWT
      const [owner] = await ethers.getSigners()
      const transactionCount = await owner.getTransactionCount()
      const futureAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      })

      vjwt = await deployVerifyJWTContract(11, 59, orcidKid, orcidBotomBread, orcidTopBread);

      const keyword = "orcid";
      await idAggregator.addPlatformContract(keyword, futureAddress);

      //--------------------------- Run test ---------------------------

      const verifyJWTAddress = await idAggregator.callStatic.contractAddrForKeyword(keyword);
      expect(verifyJWTAddress).to.equal(futureAddress);
    });
  });

  describe("getAllAccounts", function () {
    it("Should return array of supported creds", async function() {

      //--------------------------- Set up context ---------------------------

      const IdentityAggregator = await ethers.getContractFactory("IdentityAggregator");
      const idAggregator = await IdentityAggregator.deploy();
      await idAggregator.deployed();

      // get contract address for VerifyJWT
      const [owner] = await ethers.getSigners()
      const transactionCount = await owner.getTransactionCount()
      const vjwtAddress = getContractAddress({
        from: owner.address,
        nonce: transactionCount
      })

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
      await idAggregator.addPlatformContract(keyword, vjwtAddress);

      const allAccounts = await idAggregator.callStatic.getAllAccounts(owner.address);
      const creds = hexToString(allAccounts[0]);
      console.log(creds)

      //--------------------------- Run test ---------------------------

      expect(creds).to.equal(correctID);
    });
  });

});

