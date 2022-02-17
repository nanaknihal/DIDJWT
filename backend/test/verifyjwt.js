const { expect } = require('chai');
const { ethers } = require('hardhat');

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

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    let vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
    await expect(vjwt.modExp(75,1,8001)).to.emit(vjwt, 'modExpEventForTesting').withArgs(75);
    await expect(vjwt.modExp(5,5,5)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(0,1,6)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(5,2,23)).to.emit(vjwt, 'modExpEventForTesting').withArgs(2);
  });
});

describe('modExp works', function () {
  it('Test modExp on some simple numbers', async function () {
    const [owner] = await ethers.getSigners();
    let vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
    await expect(vjwt.modExp(75,1,8001)).to.emit(vjwt, 'modExpEventForTesting').withArgs(75);
    await expect(vjwt.modExp(5,5,5)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(0,1,6)).to.emit(vjwt, 'modExpEventForTesting').withArgs(0);
    await expect(vjwt.modExp(5,2,23)).to.emit(vjwt, 'modExpEventForTesting').withArgs(2);
  });
});

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
    this.vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy(11,230,56)
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
