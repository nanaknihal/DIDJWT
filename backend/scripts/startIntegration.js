/* 
This script is intended to help with integration tests.

- Starts Hardhat network on localhost
- Deploys to localhost VerifyJWT smart contracts, each one for a different service
- Deploys to localhost an IdentityAggregator smart contract
- Adds the address of every VerifyJWT to IdentityAggregator
- Adds a user's credentials and address to every VerifyJWT

The addresses of the contracts are printed so they can be used in frontend tests.
*/
const hre = require("hardhat");
const ethers = hre.ethers;
const { getContractAddress } = require('@ethersproject/address');
const { searchForPlainTextInBase64, fixedBufferXOR, sandwichIDWithBreadFromContract } = require('wtfprotocol-helpers');
const search64 = searchForPlainTextInBase64;
const {
  orcidKid, orcidBottomBread, orcidTopBread,
  googleKid, googleBottomBread, googleTopBread,
  sha256FromString,
  jwksKeyToPubkey
} = require('../test/utils/utils');
const vjwtABI = require('../data/abi/VerifyJWT.json');
const idAggABI = require('../data/abi/IdentityAggregator.json');

const [eOrcid, nOrcid] = jwksKeyToPubkey('{"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"}')
const [eGoogle, nGoogle] = jwksKeyToPubkey('{"alg":"RS256","use":"sig","n":"pFcwF2goSItvLhMJR1u0iPu2HO3wy6SSppmzgISWkRItInbuf2lWdQBt3x45mZsS9eXn6t9lUYnnduO5MrVtA1KoeZhHfSJZysIPh9S7vbU7_mV9SaHSyFPOOZr5jpU2LhNJehWqek7MTJ7FfUp1sgxtnUu-ffrFvMpodUW5eiNMcRmdIrd1O1--WlMpQ8sNk-KVTb8M8KPD0SYz-8kJLAwInUKK0EmxXjnYPfvB9RO8_GLAU7jodmTcVMD25PeA1NRvYqwzpJUYfhAUhPtE_rZX-wxn0udWddDQqihU7T_pTxiZe9R0rI0iAg--pV0f1dYnNfrZaB7veQq_XFfvKw","e":"AQAB","kty":"RSA","kid":"729189450d49028570425266f03e737f45af2932"}')
const orcidIdToken = 'eyJraWQiOiJwcm9kdWN0aW9uLW9yY2lkLW9yZy03aGRtZHN3YXJvc2czZ2p1am84YWd3dGF6Z2twMW9qcyIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiX1RCT2VPZ2VZNzBPVnBHRWNDTi0zUSIsImF1ZCI6IkFQUC1NUExJMEZRUlVWRkVLTVlYIiwic3ViIjoiMDAwMC0wMDAyLTIzMDgtOTUxNyIsImF1dGhfdGltZSI6MTY0NDgzMDE5MSwiaXNzIjoiaHR0cHM6XC9cL29yY2lkLm9yZyIsImV4cCI6MTY0NDkxODUzNywiZ2l2ZW5fbmFtZSI6Ik5hbmFrIE5paGFsIiwiaWF0IjoxNjQ0ODMyMTM3LCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImp0aSI6IjcxM2RjMGZiLTMwZTAtNDM0Mi05ODFjLTNlYjJiMTRiODM0OCJ9.VXNSFbSJSdOiX7n-hWB6Vh30L1IkOLiNs2hBTuUDZ4oDB-cL6AJ8QjX7wj9Nj_lGcq1kjIfFLhowo8Jy_mzMGIFU8KTZvinSA-A-tJkXOUEvjUNjd0OfQJnVVJ63wvp9gSEj419HZ13Lc2ci9CRY7efQCYeelvQOQvpdrZsRLiQ_XndeDw2hDLAmI7YrYrLMy1zQY9rD4uAlBa56RVD7me6t47jEOOJJMAs3PC8UZ6pYyNc0zAjQ8Vapqz7gxeCN-iya91YI1AIE8Ut19hGgVRa9N7l-aUielPAlzss0Qbeyvl0KTRuZWnLUSrOz8y9oGxVBCUmStEOrVrAhmkMS8A';
const orcidCorrectID = '0000-0002-2308-9517';
const googleIdToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjcyOTE4OTQ1MGQ0OTAyODU3MDQyNTI2NmYwM2U3MzdmNDVhZjI5MzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMjU0OTg0NTAwNTY2LTNxaXM1NG1vZmVnNWVkb2dhdWpycDhyYjdwYnA5cXRuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTAwNzg3ODQ0NDczMTcyMjk4NTQzIiwiZW1haWwiOiJuYW5ha25paGFsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiMDREZXRTaGNSYUE4OWxlcEQzdWRnUSIsIm5hbWUiOiJOYW5hayBOaWhhbCBLaGFsc2EiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKdzRnMVA3UFZUS2ZWUU1ldFdtUVgxQlNvWjlPWTRVUWtLcjdsTDQ9czk2LWMiLCJnaXZlbl9uYW1lIjoiTmFuYWsgTmloYWwiLCJmYW1pbHlfbmFtZSI6IktoYWxzYSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjQ3NjYzNDk4LCJleHAiOjE2NDc2NjcwOTgsImp0aSI6IjE4ZmRmMGQ2M2VhYjI4YjRlYmY0NmFiMDMzZTM5OTU3NmE5MTJlZGUifQ.YqmOub03zNmloAcFvZE0E-4Gt2Y5fr_9XQLUYqXQ24X_GJaJh0HSQXouJeSXjnk8PT6E1FnPd89QAgwDvE_qxAoOvW7VKDycVapOeDtKdTQ-QpAn-ExE0Pvqgx1iaGRZFDS4DWESX1ZsQIBAB_MHK_ZFdAnOjeFzImuMkB1PZLY99przSaM8AEyvWn8wfEgdmkdoJERBXF7xJI2dfA9mTRjlQvhSC4K060bTJbUYug4sQLrvo53CsDjvXRnodnCB81EVWZUbf5B9dG__kebI3AjedKUcPb2wofpX_B7uAyVlD7Au3APEbZP7Asle0Bi76hDNGPQbLvR_nGWLoySfCQ';
const googleCorrectID = 'nanaknihal@gmail.com';


/**
 * @param params Initialization params for VerifyJWT
 * @return Address of deployed contract. Always the proxy address, not the implementation address.
 */
async function deployVerifyJWT(params) {
  const VerifyJWT = await ethers.getContractFactory('VerifyJWT');
  const vjwt = await upgrades.deployProxy(VerifyJWT, params, { initializer: 'initialize', });
  console.log('VerifyJWT proxy address: ', vjwt.address)
  return vjwt.address;
}

/**
 * @return Address of deployed contract
 */
async function deployIdentityAggregator() {
  // get contract address for IdentityAggregator
  const [owner] = await ethers.getSigners();
  const transactionCount = await owner.getTransactionCount();
  const idAggAddr = getContractAddress({
    from: owner.address,
    nonce: transactionCount
  });
  // deploy contract(s)
  const IdentityAggregator = await ethers.getContractFactory('IdentityAggregator');
  const idAggregator = await IdentityAggregator.deploy();
  await idAggregator.deployed();
  console.log("IdentityAggregator deployed to:", idAggAddr);
  return idAggAddr;
}

/**
 * Add, to the specified IdentityAggregator, support for VerifyJWT contracts
 * @param idAggAddr Address of idAggregator
 * @param params Example: [{'service': 'orcid', 'address': '0xabc...'},]
 */
async function addContractsToIdAgg(idAggAddr, params) {
  const [owner] = await ethers.getSigners();
  const contractWithSigner = new ethers.Contract(idAggAddr, idAggABI, owner);

  for (p of params) {
    try {
      let tx = await contractWithSigner.addVerifyJWTContract(p['service'], p['address']);
      tx.wait();
      console.log('IdentityAggregator: Successfully added support for ' + p['service']);
      console.log('    tx hash: ' + tx.hash);
    }
    catch (err) {
      console.log(err);
      console.log('IdentityAggregator: Failed to add support for ' + p['service']);
    }
  }
}

function getOrcidSandwich(id) {
  let sandwich = (orcidBottomBread + Buffer.from(id).toString('hex') + orcidTopBread);
  return sandwich.replaceAll('0x', '');
}

function getGoogleSandwich(id) {
  let sandwich = (googleBottomBread + Buffer.from(id).toString('hex') + googleTopBread);
  return sandwich.replaceAll('0x', '');
}

/**
 * Submit a user's JWT proof, and verify the user
 * @param vjwtAddr Address of VerifyJWT contract to add user creds to
 * @param service Example: 'orcid'
 * @param jwt Raw JWT
 * @param id User credentials (e.g., for orcid, '1234-1234-1234-1234')
 */
async function addUserToVerifyJWT(vjwtAddr, service, jwt, id) {
  const [owner] = await ethers.getSigners();
  const contractWithSigner = new ethers.Contract(vjwtAddr, vjwtABI, owner);

  const [headerRaw, payloadRaw, signatureRaw] = jwt.split('.');
  const signature = Buffer.from(signatureRaw, 'base64url');
  const message = headerRaw + '.' + payloadRaw;
  const payloadIdx = Buffer.from(headerRaw).length + 1; //Buffer.from('.').length == 1
  const sandwich = service == 'orcid' ? getOrcidSandwich(id) : getGoogleSandwich(id);// TODO: Find more abstract way to do this
  const [startIdx, endIdx] = search64(Buffer.from(sandwich, 'hex').toString(), payloadRaw);
  const hashedMessage = sha256FromString(message);
  const proofPt1 = fixedBufferXOR(Buffer.from(hashedMessage.replace('0x',''), 'hex'), Buffer.from(owner.address.replace('0x',''), 'hex'));
  const proof = ethers.utils.sha256(proofPt1);

  try {
    let tx = await contractWithSigner.commitJWTProof(proof);
    await tx.wait();
    console.log('VerifyJWT: Successfully committed ' + service + ' JWT proof')
  }
  catch (err) {
    console.log('VerifyJWT: Failed to commit ' + service + ' JWT proof');
  }

  try {
    let tx = await contractWithSigner.verifyMe(ethers.BigNumber.from(signature), 
                                              message, payloadIdx, startIdx, endIdx, '0x'+sandwich);
    await tx.wait();
    console.log('VerifyJWT: Successfully verified ' + service + ' JWT proof');
  }
  catch (err) {
    console.log('VerifyJWT: Failed to verify ' + service + ' JWT proof');
  }
}

async function printAddresses(idAggAddr, vjwtOrcidAddr, vjwtGoogleAddr) {
  setTimeout(() => { // wait a little for Hardhat node to finish printing
    console.log('IdentityAggregator address: ', idAggAddr);
    console.log('VerifyJWT address (orcid):  ', vjwtOrcidAddr);
    console.log('VerifyJWT address (google): ', vjwtGoogleAddr);
  }, 500);
}

async function main() {
  // setup
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const [owner] = await ethers.getSigners();

  // deploy contracts
  const vjwtOrcidAddr = await deployVerifyJWT([eOrcid, nOrcid, orcidKid, orcidBottomBread, orcidTopBread]);
  const vjwtGoogleAddr = await deployVerifyJWT([eGoogle, nGoogle, googleKid, googleBottomBread, googleTopBread]);
  const idAggAddr = await deployIdentityAggregator();

  // add vjwts to idAggregator
  let params = [{ service: 'orcid', address: vjwtOrcidAddr }, 
                { service: 'google', address: vjwtGoogleAddr }];
  await addContractsToIdAgg(idAggAddr, params);

  // add credentials
  await addUserToVerifyJWT(vjwtOrcidAddr, 'orcid', orcidIdToken, orcidCorrectID);
  await addUserToVerifyJWT(vjwtGoogleAddr, 'google', googleIdToken, googleCorrectID);

  await printAddresses(idAggAddr, vjwtOrcidAddr, vjwtGoogleAddr);  
}


// Start Hardhat node. Run main() in parallel with node. 
// Keep node running when main() finishes. Exit when node process is killed.
Promise.all([hre.run('node'), setTimeout(() => {
              main()
                // .then(() => process.exit(0))
                .catch((error) => {
                  console.error(error);
                  process.exit(1);
                })
            }, 1000)]
);
