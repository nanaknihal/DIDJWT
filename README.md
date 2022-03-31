# WTF Protocol
Web Token Forwarding Protocol

*Goal*:
Link a public key to an online account with OpenID

*Solution*: 
Verify a JWT on-chain without compromising user security

Youtube video about the protocol https://youtu.be/MmR9bhULpxE
### Insecure, simple way:

1. Request an `id_token` or a `access_token`. It is good to understand the differences between the two; ID tokens are for authentication and access tokens are for authorization. ID tokens identify you and access tokens let you actually do actions specified in the scope. If using access token, make sure to expire it before submitting on-chain. And ideally, make the scope extremely limited as a safety measure in case a still-valid access token is somehow shared.
2. Invalidate `id_token` by requesting a new one (if possible)
3. Send the `id_token` to a smart contract
4. Smart contract then writes checks that the `id_token` is signed by the authority (e.g., using EIP-198 for RSA). If it is, it writes it to a `mapping (address => string)`, verifying  that the address who submitted the transaction owns the `id_token`

This is prone to front-running; the access token is in the mempool and can be submitted from another address, authenticating the other address as the original user

### Secure way:
Two-block transaction so it cannot be front-run

**Before transaction**

1. Request an `id_token` (as before)


**Block 1**

2. Send the proof, `sha256(my_eth_pubkey ^ sha256(jwt))`, to a smart contract's `commitJWTProof` (here, + means XOR, i.e. bitwise addition modulo 2)
3. Smart contract stores this in a `mapping(bytes32 => uint) private proofToBlock` matching the proof to the current blocknumber

This is used to prove that the user knew the JWT at the time of this block, without revealing the JWT


Once block 1 is finalized,

**Block 2**
1. Send JWT to smart contract
2. Smart contract can now reconstruct the proof `sha256(msg.sender ^ sha256(jwt))` to check whether it was known at a previous block number. It does this by looking up the blocknumber of `proofToBlock`. If the proof was given in a previous block, 
3. Like in the insecure version, it verifies that the signature is from the centralized server's public key. Then, if so
4. Link the username in the JWT to users public key in a final hashmap for verified username.


## testnet addresses of JWT verifiers
### Polygon
ORCID: 0x2779550E47349711d3CD895aFd8aE315ee9BC597
GOOGLE: 0x1362fe03c3c338f2e7dfaA44205f2B047f2C430D (no longer functional due to key rotation)
### Ropsten
ORCID: 0xdF10310d2C72F5358b19bF6A7C817Ec4570b270f

