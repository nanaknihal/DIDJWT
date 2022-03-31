# WTFBRO ID
Web Token Forwarded Blockchain Read-Only ID

*Goal*:
Link a public key to an online account with OpenID

*Solution*: 
Verify a JWT on-chain without compromising user security

Youtube video about the protocol https://youtu.be/MmR9bhULpxE
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


## testnet addresses of JWT verifiers
### Polygon
ORCID: 0x2779550E47349711d3CD895aFd8aE315ee9BC597
GOOGLE: 0x1362fe03c3c338f2e7dfaA44205f2B047f2C430D (no longer functional due to key rotation)
### Ropsten
ORCID: 0xdF10310d2C72F5358b19bF6A7C817Ec4570b270f

