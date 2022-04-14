// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const hre = require("hardhat");

// These constants should be shared dependancy with tests so the same code isn't duplicated across them without a shared module
const orcidKid = '7hdmdswarosg3gjujo8agwtazgkp1ojs'
const orcidBottomBread = '0x222c22737562223a22'
const orcidTopBread = '0x222c22617574685f74696d65223a'

const googleKid = '729189450d49028570425266f03e737f45af2932'
const googleBottomBread = '0x222c22656d61696c223a22'
const googleTopBread = '0x222c22656d61696c5f7665726966696564223a'

// Converts JWKS RSAkey to e and n:
const jwksKeyToPubkey = (jwks) => {
  let parsed = JSON.parse(jwks)
  return [
    ethers.BigNumber.from(Buffer.from(parsed['e'], 'base64url')), 
    ethers.BigNumber.from(Buffer.from(parsed['n'], 'base64url'))
  ]
}

const [eOrcid, nOrcid] = jwksKeyToPubkey('{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}')
const [eGoogle, nGoogle] = jwksKeyToPubkey('{"alg":"RS256","use":"sig","n":"pFcwF2goSItvLhMJR1u0iPu2HO3wy6SSppmzgISWkRItInbuf2lWdQBt3x45mZsS9eXn6t9lUYnnduO5MrVtA1KoeZhHfSJZysIPh9S7vbU7_mV9SaHSyFPOOZr5jpU2LhNJehWqek7MTJ7FfUp1sgxtnUu-ffrFvMpodUW5eiNMcRmdIrd1O1--WlMpQ8sNk-KVTb8M8KPD0SYz-8kJLAwInUKK0EmxXjnYPfvB9RO8_GLAU7jodmTcVMD25PeA1NRvYqwzpJUYfhAUhPtE_rZX-wxn0udWddDQqihU7T_pTxiZe9R0rI0iAg--pV0f1dYnNfrZaB7veQq_XFfvKw","e":"AQAB","kty":"RSA","kid":"729189450d49028570425266f03e737f45af2932"}')


async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  // await deployIdAggregator();
  await deployWTFBios();
  // await deployORCID();
  // await deployGoogle();
  // await deployFacebook();
}

async function deployWTFBios() {
  const WTFBios = await ethers.getContractFactory('WTFBios')
  const wtfBios = await WTFBios.deploy();
  await wtfBios.deployed();
  console.log('WTFBios: ', wtfBios.address);
}

async function deployIdAggregator() {
  const IdentityAggregator = await ethers.getContractFactory('IdentityAggregator')
  const idAggregator = await IdentityAggregator.deploy('0x2779550E47349711d3CD895aFd8aE315ee9BC597', 'orcid');
  await idAggregator.deployed();
  console.log('IdentityAggregator: ', idAggregator.address);
}

async function deployGoogle() {
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  await upgrades.deployProxy(VJWT, [eGoogle, nGoogle, googleKid, googleBottomBread, googleTopBread], {
    initializer: 'initialize',
  });
  console.log('GOOGLE: ' + VJWT.address);
}

async function deployORCID(){
  let VJWT = await ethers.getContractFactory('VerifyJWT')
  await upgrades.deployProxy(VJWT, [eOrcid, nOrcid, orcidKid, orcidBotomBread, orcidTopBread], {
    initializer: 'initialize',
  });
  console.log('ORCID: ' + VJWT.address);
}

// async function deployGoogle(){
//   let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(eGoogle, nGoogle, googleKid, googleBottomBread, googleTopBread);
//   await vjwt.deployed();
//   console.log('GOOGLE: ' + vjwt.address);
// }
// async function deployFacebook(){
//   let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);
//   await vjwt.deployed();
//   console.log('ORCID: ' + vjwt.address);
// }

// async function deployORCID(){
//     let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread);
//     await vjwt.deployed();
//     console.log('ORCID: ' + vjwt.address);
// }

// async function deployFacebook(){
  // const pubkey = JSON.parse('{"keys":[{"kid":"55f0c4f24f66f836956f781c4498e1d2f62fb9ce","kty":"RSA","alg":"RS256","use":"sig","n":"5ZpR3YBWZdJrW1pvwsao0zYxFRlnOg2xbOoygsoILQ95GsvAVgysxGImWFUncdvdmP8Zg0YPdnNb0ink_SbkUcDynAiQM588sP1Fys2iLFbo62-UVNFlhiXd_YqxWvff-AdezCXhQ-FIe41WEg9d6p_TUo9Pbzm_hAkolrkM7P03RyVOKRCm7_xulo9eTAu7RaiCC6feiLMOgBjtoSmGIwU-q62miql3jGYjZzJpR4xwvz3WFNLci0IAuoNhMua7EzK6fTsN9Zl5LqRCTIqQFUENgYk14M4FMOeoS959KMqDTQf3JQ6lNDDYAOBNH5GH0I8UOE6rqBZQ56EUuWOsIQ","e":"AQAB"},{"kid":"e59ff3c4dcb52b72dc2e18391371ab7907509c54","kty":"RSA","alg":"RS256","use":"sig","n":"sJgg0V8YxUNIv25JH6o_rbL6L95xhuSmBxguLi_iXBObdN54ewsNuqUjaHBZMvlK0P727eFAIQ_6FJ8j0qKlbyysHgnEbvvbfq2dltrhASf2l_K7bRmAoKHGOmKL4YAEssd4GBND2iCUKRN-hfNNvRtX5zY7ujqd1xtgpjOT6p442K0JtO-L1Q-W7VjrIFF9okAFa9bjGm9TgwIxWIXhtn6IZeDX367UnsPFq09U29wuMG-lBIE9sbkm5IuVRl26BXjGKSu1xj8AqT75loj3MIwfB_9i20Ov2qxLLG_bOseAlzUtGwhWryEh6LI_xAowJHk-Di9BBkzBqMZ0vOyiFw","e":"AQAB"}]}')
  //   for (const i of [0,1]){
  //     const [e, n] = [
  //     ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
  //     Buffer.from(pubkey.keys[0]['n'], 'base64url')
  //   ]
  //   let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(e,n);
  //   await vjwt.deployed();
  //   console.log('FB' + i + ': ' + vjwt.address);
  // }
    
// }
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
