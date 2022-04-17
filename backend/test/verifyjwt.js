const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const search64 = require('../../../whoisthis.wtf-frontend/src/searchForPlaintextInBase64.js');

const {
  orcidKid, orcidBottomBread, orcidTopBread,
  googleKid, googleBottomBread, googleTopBread,
  deployVerifyJWTContract,
  sha256FromString,
  keccak256FromString,
  sandwichIDWithBreadFromContract,
  jwksKeyToPubkey,
} = require('./utils/utils');


const [eOrcid, nOrcid] = jwksKeyToPubkey('{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}')
const [eGoogle, nGoogle] = jwksKeyToPubkey('{"alg":"RS256","use":"sig","n":"pFcwF2goSItvLhMJR1u0iPu2HO3wy6SSppmzgISWkRItInbuf2lWdQBt3x45mZsS9eXn6t9lUYnnduO5MrVtA1KoeZhHfSJZysIPh9S7vbU7_mV9SaHSyFPOOZr5jpU2LhNJehWqek7MTJ7FfUp1sgxtnUu-ffrFvMpodUW5eiNMcRmdIrd1O1--WlMpQ8sNk-KVTb8M8KPD0SYz-8kJLAwInUKK0EmxXjnYPfvB9RO8_GLAU7jodmTcVMD25PeA1NRvYqwzpJUYfhAUhPtE_rZX-wxn0udWddDQqihU7T_pTxiZe9R0rI0iAg--pV0f1dYnNfrZaB7veQq_XFfvKw","e":"AQAB","kty":"RSA","kid":"729189450d49028570425266f03e737f45af2932"}')


// describe('Integration test 2', function () {
//   it('Go through full process and make sure it success with a correct JWT', async function () {
//     const [owner, addr1] = await ethers.getSigners()

//     const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
//     let parsedToJSON = {}
//     orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
//     let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
//     // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
//     let [signature] = [Buffer.from(signatureRaw, 'base64url')]
//     const pubkey = JSON.parse('{"keys":[{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}]}')
//     const [e, n] = [
//       ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
//       Buffer.from(pubkey.keys[0]['n'], 'base64url')
//     ]


//     let vjwt = await deployVerifyJWTContract(eOrcid, nOrcid);
//     let message = headerRaw + '.' + payloadRaw
//     let publicHashedMessage = keccak256FromString(message)
//     let secretHashedMessage = sha256FromString(message)
//     let proof = await vjwt.XOR(secretHashedMessage, owner.address)

//     await vjwt.commitJWTProof(proof, publicHashedMessage)
//     await ethers.provider.send('evm_mine')  
//     await expect(vjwt.verifyMeWithReadableID(ethers.BigNumber.from(signature), message, 288/2, 364/2, '0000-0002-2308-9517')).to.emit(vjwt, 'JWTVerification').withArgs(true);
//     // await expect(vjwt.verifyMeWithReadableID(ethers.BigNumber.from(signature), message)).to.emit(vjwt, 'KeyAuthorization').withArgs(true); 
//     // await expect(vjwt.verifyMeWithReadableID(ethers.BigNumber.from(signature), message.replace('a', 'b'))).to.be.revertedWith('Verification of JWT failed');
    
//   });
// });

describe('slicing of byte array', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,59, orcidKid, orcidBottomBread, orcidTopBread)
  });

  it('slicing raw bytes gives correct result', async function () {
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 1,2)).to.equal('0x06');
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 0,3)).to.equal('0x050601'); 
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 1,4)).to.equal('0x060103'); 
    expect(await this.vjwt.sliceBytesMemory([5, 6, 1, 3], 0,4)).to.equal('0x05060103'); 
  });

  it('slicing hex string gives correct result', async function () {
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 1,2)).to.equal('0x06');
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 0,3)).to.equal('0x050601'); 
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 1,4)).to.equal('0x060103'); 
    expect(await this.vjwt.sliceBytesMemory('0x05060103', 0,4)).to.equal('0x05060103'); 
  });

  it('slicing actual JWT gives correct result', async function () {
    expect(await this.vjwt.sliceBytesMemory('0x7b226b6964223a2270726f64756374696f6e2d6f726369642d6f72672d3768646d64737761726f736733676a756a6f3861677774617a676b70316f6a73222c22616c67223a225253323536227d007b2261745f68617368223a225f54424f654f67655937304f5670474563434e2d3351222c22617564223a224150502d4d504c4930465152555646454b4d5958222c22737562223a22303030302d303030322d323330382d39353137222c22617574685f74696d65223a313634343833303139312c22697373223a2268747470733a5c2f5c2f6f726369642e6f7267222c22657870223a313634343931383533372c22676976656e5f6e616d65223a224e616e616b204e6968616c222c22696174223a313634343833323133372c2266616d696c795f6e616d65223a224b68616c7361222c226a7469223a2237313364633066622d333065302d343334322d393831632d336562326231346238333438227d', 143, 171)).to.equal('0x22737562223a22303030302d303030322d323330382d39353137222c');
  });
});

describe('handleKeyRotation', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.initialExponent = 9
    this.initialModulus = 37
    this.initialKid = 'someKeyId'
    this.vjwt = await deployVerifyJWTContract(this.initialExponent, this.initialModulus, this.initialKid, orcidBottomBread, orcidTopBread)
  });

  it('Should update kid, e, and n', async function () {
    expect(await this.vjwt.callStatic.kid()).to.equal(this.initialKid)
    expect(await this.vjwt.callStatic.e()).to.equal(this.initialExponent)
    expect(parseInt(await this.vjwt.callStatic.n(), 16)).to.equal(this.initialModulus)

    const newE = 11;
    const newM = 59;
    await this.vjwt.handleKeyRotation(newE, newM, orcidKid)
    expect(await this.vjwt.callStatic.kid()).to.equal(orcidKid)
    expect(await this.vjwt.callStatic.e()).to.equal(newE)
    expect(parseInt(await this.vjwt.callStatic.n(), 16)).to.equal(newM)
  });
});

describe('type conversion and cryptography', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,59, orcidKid, orcidBottomBread, orcidTopBread)
    this.message = 'Hey'
  });

  it('sha256 hashing gives the same result on chain and frontend', async function () {
    const publicHashedMessage = keccak256FromString(this.message)
    const secretHashedMessage = sha256FromString(this.message)  
    expect(await this.vjwt.testSHA256OnJWT(this.message)).to.equal(secretHashedMessage)
  });
});

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    let vjwt = await deployVerifyJWTContract(58,230, orcidKid, orcidBottomBread, orcidTopBread)
    await expect(vjwt.modExp(0x004b,1,8001)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x004b');
    await expect(vjwt.modExp(5,5,5)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x00');
    await expect(vjwt.modExp(0,1,6)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x00');
    await expect(vjwt.modExp(5,2,23)).to.emit(vjwt, 'modExpEventForTesting').withArgs('0x02');
  });
});

describe('Verify test RSA signatures', function () {
  it('Verify with a real JWT', async function () {
    const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
    let parsedToJSON = {}
    orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
    let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
    let [signature, badSignature] = [Buffer.from(signatureRaw, 'base64url'), Buffer.from(signatureRaw.replace('a','b'), 'base64url')]

    let vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);

    await expect(vjwt['verifyJWT(bytes,string)'](ethers.BigNumber.from(signature), headerRaw + '.' + payloadRaw)).to.emit(vjwt, 'JWTVerification').withArgs(true);
    // make sure it doesn't work with wrong JWT or signature:
    await expect(vjwt['verifyJWT(bytes,string)'](ethers.BigNumber.from(signature), headerRaw + ' : )' + payloadRaw)).to.emit(vjwt, 'JWTVerification').withArgs(false);
    await expect(vjwt['verifyJWT(bytes,string)'](ethers.BigNumber.from(badSignature), headerRaw + '.' + payloadRaw)).to.emit(vjwt, 'JWTVerification').withArgs(false);

  });
})

describe('proof of prior knowledge', function () {
  beforeEach(async function(){
    [this.owner, this.addr1] = await ethers.getSigners();
    this.vjwt = await deployVerifyJWTContract(11,230, orcidKid, orcidBottomBread, orcidTopBread)
    this.message1 = 'Hey'
    this.message2 = 'Hey2'
    // Must use two unique hashing algorithms
    //  If not, hash(JWT) would be known, so then XOR(public key, hash(JWT)) can be replaced with XOR(frontrunner pubkey, hash(JWT)) by a frontrunner
    // this.publicHashedMessage1 = keccak256FromString(this.message1)
    // this.secretHashedMessage1 = sha256FromString(this.message1)
    
    // this.publicHashedMessage2 = keccak256FromString(this.message2)
    // this.secretHashedMessage2 = sha256FromString(this.message2)

    let hashedMessage1 = sha256FromString(this.message1)
    let hashedMessage2 = sha256FromString(this.message1)
    
    this.proof1 = ethers.utils.sha256(await this.vjwt.XOR(hashedMessage1, this.owner.address))
    this.proof2 = ethers.utils.sha256(await this.vjwt.XOR(hashedMessage2, this.owner.address))
    
  })
  it('Can prove prior knowledge of message (not JWT but can be)', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await ethers.provider.send('evm_mine')
    expect(await this.vjwt['checkJWTProof(address,string)'](this.owner.address, this.message1)).to.equal(true)
  });

  it('Cannot prove prior knowledge of message (not JWT but can be) in one block', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await expect(this.vjwt['checkJWTProof(address,string)'](this.owner.address, this.message1)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun'");
  });

  it('Cannot prove prior knowledge of different message (not JWT but can be)', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt['checkJWTProof(address,string)'](this.owner.address, this.message2)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Proof not found; it needs to have been submitted to commitJWTProof in a previous block'");
  });

  // This is not a great attack vector but good to check that it's impossible 
  it('Cannot prove prior knowledge of using different public key', async function () {
    await this.vjwt.commitJWTProof(this.proof1)
    await ethers.provider.send('evm_mine')
    await expect(this.vjwt['checkJWTProof(address,string)'](this.addr1.address, this.message1)).to.be.revertedWith("VM Exception while processing transaction: reverted with reason string 'Proof not found; it needs to have been submitted to commitJWTProof in a previous block'");
  });
});

describe('Frontend sandwiching', function(){
  it('Test that correct sandwich is given for a specific ID', async function(){
    let vjwt = await deployVerifyJWTContract(50,100, orcidKid, orcidBottomBread, orcidTopBread);
    expect(await sandwichIDWithBreadFromContract('0000-0002-2308-9517', vjwt)).to.equal('222c22737562223a22303030302d303030322d323330382d39353137222c22617574685f74696d65223a');
  });
});


for (const params of [
  {
    name : 'orcid',
    idToken: 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A',
    correctID : '0000-0002-2308-9517',
    constructorArgs : [eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread],
  },
  {
    name : 'google',
    idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcyOTE4OTQ1MGQ0OTAyODU3MDQyNTI2NmYwM2U3MzdmNDVhZjI5MzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiMDREZXRTaGNSYUE4OWxlcEQzdWRnUSIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjQ3NjYzNDk4LCJleHAiOjE2NDc2NjcwOTgsImp0aSI6IjE4ZmRmMGQ2M2VhYjI4YjRlYmY0NmFiMDMzZTM5OTU3NmE5MTJlZGUifQ.YqmOub03zNmloAcFvZE0E-4Gt2Y5fr_9XQLUYqXQ24X_GJaJh0HSQXouJeSXjnk8PT6E1FnPd89QAgwDvE_qxAoOvW7VKDycVapOeDtKdTQ-QpAn-ExE0Pvqgx1iaGRZFDS4DWESX1ZsQIBAB_MHK_ZFdAnOjeFzImuMkB1PZLY99przSaM8AEyvWn8wfEgdmkdoJERBXF7xJI2dfA9mTRjlQvhSC4K060bTJbUYug4sQLrvo53CsDjvXRnodnCB81EVWZUbf5B9dG__kebI3AjedKUcPb2wofpX_B7uAyVlD7Au3APEbZP7Asle0Bi76hDNGPQbLvR_nGWLoySfCQ',
    correctID : 'nanaknihal@gmail.com',
    constructorArgs : [eGoogle, nGoogle, googleKid, googleBottomBread, googleTopBread],
  }
]){

  describe('Integration tests for after successful proof commit with params ' + params, function () {
    beforeEach(async function(){
      [this.owner, this.addr1] = await ethers.getSigners()
  
      let [headerRaw, payloadRaw, signatureRaw] = params.idToken.split('.');
      // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
      // let payload = atob(payloadRaw);
      this.signature = Buffer.from(signatureRaw, 'base64url')
  
      this.vjwt = await deployVerifyJWTContract(...params.constructorArgs);
      this.message = headerRaw + '.' + payloadRaw
      this.payloadIdx = Buffer.from(headerRaw).length + 1 //Buffer.from('.').length == 1
      this.sandwich = await sandwichIDWithBreadFromContract(params.correctID, this.vjwt);
      this.wrongSandwich = await sandwichIDWithBreadFromContract('0200-0002-2308-9517', this.vjwt);
      // find indices of sandwich in raw payload:
      let [startIdx, endIdx] = search64.searchForPlainTextInBase64(Buffer.from(this.sandwich, 'hex').toString(), payloadRaw)
      this.startIdx = startIdx; this.endIdx = endIdx
      // let publicHashedMessage = keccak256FromString(this.message)
      // let secretHashedMessage = sha256FromString(this.message)
      let hashedMessage = sha256FromString(this.message)
      let proof = ethers.utils.sha256(await this.vjwt.XOR(hashedMessage, this.owner.address))
      console.log('XOR of hashed message and address is', await this.vjwt.XOR(hashedMessage, this.owner.address))
      console.log('proof is ', proof)
      
      await this.vjwt.commitJWTProof(proof)
      await ethers.provider.send('evm_mine')
    });
    it('JWT works once but cannot be used twice (and emits JWTVerification event, which does NOT mean everything was successful -- it is just a testing event)', async function () {
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.emit(this.vjwt, 'JWTVerification').withArgs(true);
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('JWT can only be used on-chain once')
    });
  
    it('JWT emits KeyAuthorization event, another testing event which does NOT mean everything was successsful -- just that some intermediary stages were successful', async function () {
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.emit(this.vjwt, 'KeyAuthorization').withArgs(true); 
      });
  
    it('Wrong message fails', async function () {
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message.replace('a', 'b'), this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('Verification of JWT failed');
    });
  
    it('Wrong indices fail (this could be more comprehensive and more unit-like)', async function () {
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx - 1, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx + 1, this.startIdx, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx + 1, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx - 1, this.endIdx, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx + 1, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx - 1, '0x'+this.sandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    });
  
    it('Wrong sandwich fails', async function () {
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich+'e6')).to.be.revertedWith('Failed to find correct top bread in sandwich');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0xb5'+this.sandwich)).to.be.revertedWith('Failed to find correct bottom bread in sandwich');
      await expect(this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.wrongSandwich)).to.be.revertedWith('proposedIDSandwich not found in JWT');
    });
  
    it('Creds lookup works', async function () {
      let registeredAddresses, registeredCreds;
  
      [registeredAddresses, registeredCreds] = [await this.vjwt.getRegisteredAddresses(), await this.vjwt.getRegisteredCreds()];
      expect(registeredAddresses.length).to.equal(0);
      expect(registeredCreds.length).to.equal(0);
      expect(await this.vjwt.addressForCreds(Buffer.from('0000-0002-2308-9517'))).to.equal(ethers.constants.AddressZero);
  
      await this.vjwt.verifyMe(ethers.BigNumber.from(this.signature), this.message, this.payloadIdx, this.startIdx, this.endIdx, '0x'+this.sandwich);
      
      [registeredAddresses, registeredCreds] = [await this.vjwt.getRegisteredAddresses(), await this.vjwt.getRegisteredCreds()];
      expect(registeredAddresses.length).to.equal(1);
      expect(registeredCreds.length).to.equal(1);
      expect(await this.vjwt.addressForCreds(Buffer.from(params.correctID))).to.equal(this.owner.address);
      
      expect(registeredAddresses[0] === this.owner.address).to.equal(true);
    });
  
    
      // TODO: add tests for address => creds,  address => JWT,  JWT => address
  
  
  });
}


// describe('Anonymous proof commit', function () {
//   before(async function(){
//     [this.owner, this.addr1] = await ethers.getSigners()

//     const orig = 'access_token=117a16aa-f766-4079-ba50-faaf0a09c864&token_type=bearer&expires_in=599&tokenVersion=1&persistent=true&id_token=eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A&tokenId=254337461'
//     let parsedToJSON = {}
//     orig.split('&').map(x=>{let [key, value] = x.split('='); parsedToJSON[key] = value});
//     let [headerRaw, payloadRaw, signatureRaw] = parsedToJSON['id_token'].split('.');
//     // let [header, payload] = [headerRaw, payloadRaw].map(x => JSON.parse(atob(x)));
//     // let payload = atob(payloadRaw);
//     this.signature = Buffer.from(signatureRaw, 'base64url')
//     this.vjwt = await deployVerifyJWTContract(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);
//     this.message = sha256FromString(headerRaw + '.' + payloadRaw)
//     this.payloadIdx = Buffer.from(headerRaw).length + 1 //Buffer.from('.').length == 1
//     this.sandwich = await sandwichIDWithBreadFromContract('0000-0002-2308-9517', this.vjwt);
//     this.wrongSandwich = await sandwichIDWithBreadFromContract('0200-0002-2308-9517', this.vjwt);
//     // find indices of sandwich in raw payload:
//     let [startIdx, endIdx] = search64.searchForPlainTextInBase64(Buffer.from(this.sandwich, 'hex').toString(), payloadRaw)
//     this.startIdx = startIdx; this.endIdx = endIdx
//     // let publicHashedMessage = keccak256FromString(this.message)
//     // let secretHashedMessage = sha256FromString(this.message)
//     let hashedMessage = sha256FromString(this.message)
//     let proof = ethers.utils.sha256(await this.vjwt.XOR(hashedMessage, this.owner.address))
//     console.log('proof is ', await this.vjwt.XOR(hashedMessage, this.owner.address), proof)
//     await this.vjwt.commitJWTProof(proof)
//     await ethers.provider.send('evm_mine')
//   });
//   it('jfakjfak', async function (){
//     console.log('still need to implement this')
//   })
// });
