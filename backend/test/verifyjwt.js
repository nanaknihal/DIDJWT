const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("modExp works", function () {
  it("Test modExp on some simple numbers", async function () {
    const [owner] = await ethers.getSigners();
    const vjwt = await (await ethers.getContractFactory('VerifyJWT')).deploy()
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
