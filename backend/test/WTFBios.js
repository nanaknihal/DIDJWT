const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getContractAddress } = require('@ethersproject/address')
const { solidity } = require("ethereum-waffle");
const {
  deployWTFBios,
} = require('./utils/utils');


describe("WTFBios", function () {

  describe("bioForAddress", function () {
    before(async function () {
      this.wtfBios = await deployWTFBios();
    });
    
    it("Should return correct bio after user adds bio", async function () {
      const [owner] = await ethers.getSigners();
      const bio = 'Business person';
      await this.wtfBios.setNameAndBio('name', bio);
      expect(await this.wtfBios.callStatic.bioForAddress(owner.address)).to.equal(bio);
    });

    it("Should return empty string after user removes bio", async function () {
      const [owner] = await ethers.getSigners();
      await this.wtfBios.removeNameAndBio();
      expect(await this.wtfBios.callStatic.bioForAddress(owner.address)).to.equal('');
    });
  });

  describe("registeredAddresses", function () {
    before(async function () {
      this.wtfBios = await deployWTFBios();
    });
    
    it("Should return correct array of addresses after users add bios", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const [bio0, bio1, bio2] = ['Business person', 'Regular person', 'Dog'];
      await this.wtfBios.connect(owner).setNameAndBio('name', bio0);
      await this.wtfBios.connect(addr1).setNameAndBio('name', bio1);
      await this.wtfBios.connect(addr2).setNameAndBio('name', bio2);
      expect(await this.wtfBios.callStatic.getRegisteredAddresses()).to.be.an('array')
      .that.includes.members([owner.address, addr1.address, addr2.address]);
    });

    it("Should return correct array of addresses after a user removes their bio", async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await this.wtfBios.connect(owner).removeNameAndBio();
      const registeredAddresses = await this.wtfBios.callStatic.getRegisteredAddresses();
      expect(registeredAddresses).to.be.an('array').that.does.not.include(owner.address);
      expect(registeredAddresses).to.be.an('array').that.includes.members([addr1.address, addr2.address]);
    });
  });

});
