# WTFBRO ID
Web Token Forwarded Blockchain Read-Only ID

*Goal*:
Link a public key to an online account with OpenID

*Solution*: 
Verify a JWT on-chain without compromising user security

### Insecure, simple way:

1. Request an `id_token` (NOT an `acces_token` which would grant priviliges and should not be shared)
2. Invalidate `id_token` by requesting a new one (if possible)
3. Send the `id_token` to a smart contract
4. Smart contract then writes checks that the `id_token` is signed by the authority (e.g., using EIP-198 for RSA, or OpenZeppelin ECDSA for ECDSA). If it is, it writes it to a `mapping (address => string)`, verifying  that the address who submitted the transaction owns the `id_token`

This is prone to front-running; the access token is in the mempool and can be submitted from another address, authenticating the other address as the original user

### Secure way:
Two-block transaction so it cannot be front-run

**Before transaction**

1. Request an `id_token` (as before)


**Block 1**

2. Send the `keccak256(my_eth_pubkey + id_token)` to a smart contract (+ meaning append)
3. Smart contract stores this in a `mapping(address => string) private hidden_jwts;` of Ethereum public keys to hashed `pubkey + id_token`s

This is used to prove that the user knew the JWT at the time of this block, without revealing the JWT


Once block 1 is finalized,

**Block 2**

1. Invalidate the `id_token` by requesting a new token (if supported)
2. Send `id_token` to smart contract
3. Smart contract appends sender's pubkey to `id_token`, then computes `keccak256(my_eth_pubkey + id_token)`, then compares that looks that value up in the `hidden_jwts`. If it exist, you know the user owned `id_token`. If so,
4. Like in the insecure version, verify `id_token`'s signature comes from the centralized server's public key. Then, if so
5. Link the username or other relevant metadata in the `id_token` to users public key in a final hashmap for verified metadata






### ORCID Implementation:
Get authorization code @ 
https://orcid.org/oauth/authorize?client_id=APP-MPLI0FQRUVFEKMYX&response_type=code&scope=/authenticate&redirect_uri=https://developers.google.com/oauthplayground
redict_uri can be changed to ur website and the auth code will be in the URL: https://yourwebsite.com?code=auth_code_here
auth codes can be used only once to generate a token
Then,
get auth token via:
```curl -i -L -k -H 'Accept: application/json' --data 'client_id=APP-MPLI0FQRUVFEKMYX&client_secret=0c2470a1-ab05-457a-930c-487188e658e2&grant_type=authorization_code&redirect_uri=https://developers.google.com/oauthplayground&code=[YOUR AUTH CODE HERE]' https://orcid.org/oauth/token```
Returns:
{"access_token":"629abc31-17dd-4202-8e1d-6259fbeea759","token_type":"bearer","refresh_token":"5582cddd-79a6-4406-a1e6-f971bba0ee7d","expires_in":631138518,"scope":"/authenticate","name":"Nanak Nihal Khalsa","orcid":"0000-0002-2308-9517"}

BEFORE YOU SUBMIT TO THE BLOCKCHAIN, MAKE SURE TO INVALIDATE THE ACCESS AND REFRESH TOKEN. This can be done by refresh token rotation, if supported (e.g. OAuth and Okta support it). Google sign in requires going to settings and disabling the app's access (perhaps it be easier soon or already has and I didn't research it enough) 
