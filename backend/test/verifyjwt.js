const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    const vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
    let tx = await vjwt.verifyJWT(75,1,8001, 4)
    // 75^55 mod 8001 == 5984
    console.log('transaction', tx)
    let receipt = await tx.wait()
    console.log('receipt', receipt)
    // expect(await vjwt.verifyJWT(5,5,5)).to.equal(true)
    // expect(await vjwt.modExp(5,5,4)).to.equal(1)
    // expect(await vjwt.modExp(25,55,8001)).to.equal(32)
    console.log(await vjwt.testAddressByteConversion(owner.address));
    // console.log(await vjwt.testAddressStringConversion(owner.address));
    console.log(await vjwt.addressToBytes(owner.address));
    
  });
});

describe('type conversion and cryptography', function (){
  before(async function(){
    [this.owner] = await ethers.getSigners();
    this.vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
    this.message = 'Hey'
  })

  it('sha256 hashing gives the same result on chain and frontend', async function () {
    const publicHashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.message))
    const secretHashedMessage = ethers.utils.sha256(ethers.utils.toUtf8Bytes(this.message))  
    expect(await this.vjwt.testSHA256OnJWT(this.message)).to.equal(secretHashedMessage)
})
it('XOR of pubkey and sha256(message) works as expected (integration test)', async function () {
  const publicHashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.message))
  const XORedKey = await this.vjwt.XOR(
    (await this.vjwt.testSHA256OnJWT(this.message)), 
    (this.owner.address)
  )
  expect(XORedKey).to.equal(ethers.BigNumber.from('0x581d43745726e0ee6291116c4c2c5e99254f1d246a251ea78c3280d175c9b21c'))
})
})

// 39855234793743226798606417 537894605540194011154359119936879820814189461090844, 
// 39855234793743226798606417 537894605540194011154359119936879820814189461090844     
// 39855234793743226798606417 555432625188164846172803337929475217050060651606556           
describe('proof of prior knowledge', function () {
  it('test with sample message (not JWT but can be)', async function () {
    const [owner] = await ethers.getSigners();
    const vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
    const message = 'Hey'
    // Must use two unique hashing algorithms
    //  If not, hash(JWT) would be known, so then XOR(public key, hash(JWT)) can be replaced with XOR(frontrunner pubkey, hash(JWT)) by a frontrunner
    const publicHashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message))
    const secretHashedMessage = ethers.utils.sha256(ethers.utils.toUtf8Bytes(message))
    
    const proof = await vjwt.XOR(secretHashedMessage, owner.address)
    await vjwt.commitJWTProof(proof, publicHashedMessage)
    await ethers.provider.send('evm_mine')
    expect(await vjwt.checkJWTProof(owner.address, message)).to.equal(true)
    
    
    
      // console.log(Buffer.from(secretHashedMessage, 'hex'), Buffer.from(owner.address, 'hex'))
      // console.log(parseInt(secretHashedMessage, 16), parseInt(owner.address, 16))
      // console.log(await vjwt.jwtProofs(proof));
      
  });
});


describe('ajfaksjnfalskjfd', function () {
  it('asd;llf', async function () {
    const [owner] = await ethers.getSigners();
    const vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
    await vjwt.testFunction(78)
    await ethers.provider.send('evm_mine')
    expect(await vjwt.e()).to.equal(78)
    await vjwt.testFunction(70)
    await ethers.provider.send('evm_mine')
    expect(await vjwt.e()).to.equal(70)
    
    
    
      // console.log(Buffer.from(secretHashedMessage, 'hex'), Buffer.from(owner.address, 'hex'))
      // console.log(parseInt(secretHashedMessage, 16), parseInt(owner.address, 16))
      // console.log(await vjwt.jwtProofs(proof));
      
  });
});

