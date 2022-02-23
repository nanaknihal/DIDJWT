// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  await deployORCID();
  // await deployFacebook();
}

async function deployORCID(){
  const pubkey = JSON.parse('{"keys":[{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}]}')
    const [e, n] = [
      ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
      Buffer.from(pubkey.keys[0]['n'], 'base64url')
    ]
    let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(e,n);
    await vjwt.deployed();
    console.log('ORCID: ' + vjwt.address);
}

async function deployFacebook(){
  const pubkey = JSON.parse('{"keys":[{"kid":"55f0c4f24f66f836956f781c4498e1d2f62fb9ce","kty":"RSA","alg":"RS256","use":"sig","n":"5ZpR3YBWZdJrW1pvwsao0zYxFRlnOg2xbOoygsoILQ95GsvAVgysxGImWFUncdvdmP8Zg0YPdnNb0ink_SbkUcDynAiQM588sP1Fys2iLFbo62-UVNFlhiXd_YqxWvff-AdezCXhQ-FIe41WEg9d6p_TUo9Pbzm_hAkolrkM7P03RyVOKRCm7_xulo9eTAu7RaiCC6feiLMOgBjtoSmGIwU-q62miql3jGYjZzJpR4xwvz3WFNLci0IAuoNhMua7EzK6fTsN9Zl5LqRCTIqQFUENgYk14M4FMOeoS959KMqDTQf3JQ6lNDDYAOBNH5GH0I8UOE6rqBZQ56EUuWOsIQ","e":"AQAB"},{"kid":"e59ff3c4dcb52b72dc2e18391371ab7907509c54","kty":"RSA","alg":"RS256","use":"sig","n":"sJgg0V8YxUNIv25JH6o_rbL6L95xhuSmBxguLi_iXBObdN54ewsNuqUjaHBZMvlK0P727eFAIQ_6FJ8j0qKlbyysHgnEbvvbfq2dltrhASf2l_K7bRmAoKHGOmKL4YAEssd4GBND2iCUKRN-hfNNvRtX5zY7ujqd1xtgpjOT6p442K0JtO-L1Q-W7VjrIFF9okAFa9bjGm9TgwIxWIXhtn6IZeDX367UnsPFq09U29wuMG-lBIE9sbkm5IuVRl26BXjGKSu1xj8AqT75loj3MIwfB_9i20Ov2qxLLG_bOseAlzUtGwhWryEh6LI_xAowJHk-Di9BBkzBqMZ0vOyiFw","e":"AQAB"}]}')
    for (const i of [0,1]){
      const [e, n] = [
      ethers.BigNumber.from(Buffer.from(pubkey.keys[0]['e'], 'base64url')), 
      Buffer.from(pubkey.keys[0]['n'], 'base64url')
    ]
    let vjwt = await (await hre.ethers.getContractFactory('VerifyJWT')).deploy(e,n);
    await vjwt.deployed();
    console.log('FB' + i + ': ' + vjwt.address);
  }
    
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
