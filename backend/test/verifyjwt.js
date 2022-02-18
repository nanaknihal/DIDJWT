const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('type conversion and cryptography', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,59)
    this.message = 'Hey'
  })

  it('sha256 hashing gives the same result on chain and frontend', async function () {
    const publicHashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.message))
    const secretHashedMessage = ethers.utils.sha256(ethers.utils.toUtf8Bytes(this.message))  
    expect(await this.vjwt.testSHA256OnJWT(this.message)).to.equal(secretHashedMessage)
})

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    let vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(58,230)
    await expect(vjwt.modExp(75,1,8001)).to.emit(vjwt, 'modExpEventForTesting').withArgs(75);
    await expect(vjwt.modExp(5,5,5)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(0,1,6)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(5,2,23)).to.emit(vjwt, 'modExpEventForTesting').withArgs(2);
  });
});

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    let vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230)
    await expect(vjwt.modExp(75,1,8001)).to.emit(vjwt, 'modExpEventForTesting').withArgs(75);
    await expect(vjwt.modExp(5,5,5)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(0,1,6)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(5,2,23)).to.emit(vjwt, 'modExpEventForTesting').withArgs(2);
  });
});

describe('Verify test RSA signatures', function () {
  it('Verify with some plaintext', async function () {
    
  });
  it('Verify with a real JWT', async function () {
    const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
    let parsedToJSON = {}
    orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
    let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
    // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
    let signature = [Buffer.from(signatureRaw, 'base64url')]
    console.log(headerRaw + '.' + payloadRaw);
    const pubkey = JSON.parse('{"keys":[{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}]}')
    const [e, n] = [
      ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
      Buffer.from(pubkey.keys[0]['n'])
      // ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['n'], 'base64url'))
    ]
    let asfasfasdfasd = await (await ethers.getContractFactory('VerifyJWT')).deploy(10,10);
    console.log('uint version', await asfasfasdfasd.bytes32ToUInt256(n))
    console.log('length', (Buffer.from(pubkey.keys[0]['n'], 'base64url')).length)
    console.log(ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['n'], 'base64url')))

    console.log(e, n)
    // const vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(e,n)
    // console.log(await vjwt.verifyJWT(signature, headerRaw + '.' + payloadRaw), 'payload etc.')
  });
})

// it('XOR of pubkey and sha256(message) works as expected (integration test)', async function () {
//   const publicHashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.message))
//   const XORedKey = await this.vjwt.XOR(
//     (await this.vjwt.testSHA256OnJWT(this.message)), 
//     (this.owner.address)
//   )
//   expect(XORedKey).to.equal(ethers.BigNumber.from('0x581d43745726e0ee6291116c4c2c5e99254f1d246a251ea78c3280d175c9b21c'))
// })
})
         
describe('proof of prior knowledge', function () {
  beforeEach(async function(){
    [this.owner, this.addr1] = await ethers.getSigners();
    this.vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230)
    this.message1 = 'Hey'
    this.message2 = 'Hey2'
    // Must use two unique hashing algorithms
    //  If not, hash(JWT) would be known, so then XOR(public key, hash(JWT)) can be replaced with XOR(frontrunner pubkey, hash(JWT)) by a frontrunner
    this.publicHashedMessage1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.message1))
    this.secretHashedMessage1 = ethers.utils.sha256(ethers.utils.toUtf8Bytes(this.message1))
    
    this.publicHashedMessage2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.message2))
    this.secretHashedMessage2 = ethers.utils.sha256(ethers.utils.toUtf8Bytes(this.message2))

    this.proof1 = await this.vjwt.XOR(this.secretHashedMessage1, this.owner.address)
    this.proof2 = await this.vjwt.XOR(this.secretHashedMessage2, this.owner.address)
    
  })
  it('Can prove prior knowledge of message (not JWT but can be)', async function () {
    await this.vjwt.commitJWTProof(this.proof1, this.publicHashedMessage1)
    await ethers.provider.send('evm_mine')
    expect(await this.vjwt.checkJWTProof(this.owner.address, this.message1)).to.equal(true)
  });

  it('Cannot prove prior knowledge of message (not JWT but can be) in one block', async function () {
    await this.vjwt.commitJWTProof(this.proof1, this.publicHashedMessage1)
    await expect(this.vjwt.checkJWTProof(this.owner.address, this.message1)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun'");
  });

  it('Cannot prove prior knowledge of different message (not JWT but can be)', async function () {
    await this.vjwt.commitJWTProof(this.proof1, this.publicHashedMessage1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt.checkJWTProof(this.owner.address, this.message2)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'JWT does not match JWT in proof");
  });

  // This is not a great attack vector but good to check that it's impossible 
  it('Cannot prove prior knowledge of using different public key', async function () {
    await this.vjwt.commitJWTProof(this.proof1, this.publicHashedMessage1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt.checkJWTProof(this.addr1.address, this.message1)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'JWT does not match JWT in proof");
  });
});
