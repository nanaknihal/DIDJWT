//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "contracts/Base64.sol"; 
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract VerifyJWT is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // struct JWTProof {
    //   uint256 blockNumber;
    //   bytes32 hashedJWT;
    // }

    // creds are the identifier / index field in the JWT, e.g. ORCID ID for ORCID JWT or email for gmail JWT(the rest of the JWT has lots of other information)
    mapping(address => string) public JWTForAddress;
    mapping(string => address) public addressForJWT;

    mapping(address => bytes) public credsForAddress;
    mapping(bytes => address) public addressForCreds;

    mapping (address => bytes32) public privateJWTForAddress; //also store hashes of JWT header.payloads for on-chain verified sovereign identity
    mapping(address => mapping(address => bool)) public privateJWTAllowances; //who has access to a user's private credentials

    address[] public registeredAddresses;
    bytes[] public registeredCreds;
    
    mapping(bytes32 => uint256) public proofToBlock; // JWT proof => latest blocknumber when proof was submitted

    // web2 server's RS256 public key, split into exponent and modulus
    uint256 public e;
    bytes public n;
    // kid of JWT (available at JWKS endpoint). It is common for a JWKS endpoint to have multiple keys, so they kid is used to match with the correct key. 
    // the kid field also allays problems due to key rotation, if the frontend checks that the kid matches that of the JWT before submitting, it saves the user gas
    // by never lettign them accidentally submit to a contract with an outdated publickey
    string public kid;

     // It would be very difficult to index people based on their base64url-encoded JWTs. Having a plaintext ID, such as an email address is needed. How can we do this? 
    // Allow the user to select a string within t heir JWT to be indexed by
    // how the id fields start and ed. For example, one web2 service may have IDs in the token as '"userID" : "vitalik.eth", "iat" : ...' 
    // if the user is allowed to choose their id as anywhere in the contract, that would be bad. Here, we can enforce that the id must be wrapped by

    // topBread and bottomBread refer to the start and end of the byte sandwhich which desired credential must be between.
    // for example, a JWT can have many fields, but we just want the email, which is in a part that looks like: '"email" : email_here, "next field' : . So then, you can set topBread to ', "next field' : ' and bottomBread to '"email" : '
    // then, when you validate the JWT, the user supplies '"email" : email_here, "next field', and this contract can approve it because the sandwhich starts and ends the right way
    bytes public topBread;
    bytes public bottomBread;
   


    // bytes32[] public pendingVerification; //unneeded later, just for testing purposes
    bytes32[] public verifiedUsers;

    event modExpEventForTesting(bytes result_);
    event JWTVerification(bool result_);
    event KeyAuthorization(bool result_);
    
    bytes emptyBytes;
    bytes32 emptyBytesHash;

    // Initializer rather than constructor so it can be used for proxy pattern
    // exponent and modulus comrpise the RSA public key of the web2 authenticator which signed the JWT. 
    function initialize(uint256 exponent_, bytes memory modulus_, string memory kid_, bytes memory bottomBread_, bytes memory topBread_) initializer public {
      e = exponent_;
      n = modulus_;
      kid = kid_;
      topBread = topBread_; 
      bottomBread = bottomBread_;

      emptyBytesHash = keccak256(emptyBytes);
      // initialze parent classes (part of upgradeable proxy design pattern) 
      __Ownable_init();
    } 

    // For UUPS upgradeable proxy
    function _authorizeUpgrade(address) internal override onlyOwner {}

    function handleKeyRotation(uint256 newE, bytes calldata newN, string calldata newKid) public onlyOwner {
        e = newE;
        n = newN;
        kid = newKid;
    }

    // Why am i putting test functions here haha
    function testAddressByteConversion(address a) public pure returns (bool) {
      return bytesToAddress(addressToBytes(a)) == a;
    }

    // https://ethereum.stackexchange.com/questions/8346/convert-address-to-string
    function bytesToAddress(bytes memory b_) private pure returns (address addr) {
      assembly {
        addr := mload(add(b_,20))
      } 
    }

    function bytes32ToAddress(bytes32 b_) private pure returns (address addr) {
      assembly {
        addr := mload(add(b_,20)) //shouldn't it be 0x20 or is that equivalent
      } 
    }

    function bytes32ToUInt256(bytes32 b_) public pure returns (uint256 u_) {
      assembly {
        u_ := mload(add(b_,20)) //shouldn't it be 0x20 or is that equivalent
      } 
    }

    function bytesToFirst32BytesAsBytes32Type(bytes memory input_) public pure returns (bytes32 b_) {
      assembly {
        // there is probably an easier way to do this
        let unshifted := mload(add(input_,32))
        b_ := shr(96, unshifted)
      } 
    }

    // We need to take the last 32 bytes to obtain the sha256 hash from the the PKCS1-v1_5 padding
    function bytesToLast32BytesAsBytes32Type(bytes memory input_) public pure returns (bytes32 b_) {
      assembly {
        // there is probably an easier way to do this
        let len := mload(input_)
        let end := add(input_, len)
        b_ := mload(end)
      }
    }
    
    function addressToBytes(address a) public pure returns (bytes memory) {
      return abi.encodePacked(a);
    }
    
    function bytes32ToBytes(bytes32 b_) public pure returns (bytes memory){
      return abi.encodePacked(b_);
    }
    // function addressToBytes32(address a) public pure returns (bytes32) {
    //   return abi.encodePacked(a);
    // }

    function stringToBytes(string memory s) public pure returns (bytes memory) {
      return abi.encodePacked(s);
    }

    function bytesAreEqual(bytes memory  a_, bytes memory b_) public pure returns (bool) {
      return (a_.length == b_.length) && (keccak256(a_) == keccak256(b_));
    }

    // // Can't figure out why this isn't working right now, so using less efficient version instead:
    // function sliceBytesMemory(bytes memory input_, uint256 start_, uint256 end_) public view returns (bytes memory r) {
    //   require(start_ < end_, "index start must be less than inded end");
    //   uint256 sliceLength = end_ - start_;
    //   bytes memory r = new bytes(sliceLength);
    //   console.log('HERE');
    //   console.logBytes(r);
    //   assembly {
    //     let offset := add(start_, 0x20)
    //     if iszero(staticcall(not(0), add(input_, offset), sliceLength, add(r, 0x20), sliceLength)) {
    //         revert(0, 0)
    //     }
    //   }
    //  
    //
    // }

    // This could be more efficient by not copying the whole thing -- just the parts that matter
    function sliceBytesMemory(bytes memory input_, uint256 start_, uint256 end_) public view returns (bytes memory r) {
      uint256 len_ = input_.length;
      bytes memory r = new bytes(len_);
      
      assembly {
          // Use identity to copy data
          if iszero(staticcall(not(0), 0x04, add(input_, 0x20), len_, add(r, 0x20), len_)) {
              revert(0, 0)
          }
      }
      return destructivelySliceBytesMemory(r, start_, end_);
    }
    
    function destructivelySliceBytesMemory(bytes memory m, uint256 start, uint256 end) public pure returns (bytes memory r) {

      require(start < end, "index start must be less than inded end");
      assembly {
        let offset := add(start, 0x20) //first 0x20 bytes of bytes type is length (no. of bytes)
        r := add(m, start)
        mstore(r, sub(end, start))
      }
    }

    // BIG thanks to dankrad for this function: https://github.com/dankrad/rsa-bounty/blob/master/contract/rsa_bounty.sol
    // Expmod for bignum operands (encoded as bytes, only base and modulus)
    function modExp(bytes memory base, uint exponent, bytes memory modulus) public returns (bytes memory o) {
        assembly {
            // Get free memory pointer
            let p := mload(0x40)

            // Get base length in bytes
            let bl := mload(base)
            // Get modulus length in bytes
            let ml := mload(modulus)

            // Store parameters for the Expmod (0x05) precompile
            mstore(p, bl)               // Length of Base
            mstore(add(p, 0x20), 0x20)  // Length of Exponent
            mstore(add(p, 0x40), ml)    // Length of Modulus
            // Use Identity (0x04) precompile to memcpy the base
            if iszero(staticcall(10000, 0x04, add(base, 0x20), bl, add(p, 0x60), bl)) {
                revert(0, 0)
            }
            mstore(add(p, add(0x60, bl)), exponent) // Exponent
            // Use Identity (0x04) precompile to memcpy the modulus
            if iszero(staticcall(10000, 0x04, add(modulus, 0x20), ml, add(add(p, 0x80), bl), ml)) {
                revert(0, 0)
            }
            
            // Call 0x05 (EXPMOD) precompile
            if iszero(staticcall(not(0), 0x05, p, add(add(0x80, bl), ml), add(p, 0x20), ml)) {
                revert(0, 0)
            }

            // Update free memory pointer
            mstore(0x40, add(add(p, ml), 0x20))

            // Store correct bytelength at p. This means that with the output
            // of the Expmod precompile (which is stored as p + 0x20)
            // there is now a bytes array at location p
            mstore(p, ml)

            // Return p
            o := p
        }
        
        emit modExpEventForTesting(o);
    }
    
    // returns whether JWT is signed by public key e_, n_, and emits an event with verification result
    function _verifyJWT(uint256 e_, bytes memory n_, bytes memory signature_, bytes memory message_) private returns (bool) {
      bytes32 hashed = hashFromSignature(e_, n_, signature_);
      bool verified = hashed == sha256(message_);
      emit JWTVerification(verified);
      return verified;
    }

    // Get the hash of the JWT from the signature
    function hashFromSignature(uint256 e_, bytes memory n_, bytes memory signature_) public returns (bytes32) {
      bytes memory encrypted = modExp(signature_, e_, n_);
      bytes32 unpadded = bytesToLast32BytesAsBytes32Type(encrypted);
      return unpadded;
    }
    
    function verifyJWT(bytes memory signature, string memory headerAndPayload) public returns (bool) {
      return _verifyJWT(e, n, signature, stringToBytes(headerAndPayload));
    }


    function commitJWTProof(bytes32 proof) public {
      console.log('proof is');
      console.logBytes32(proof);
      proofToBlock[proof] = block.number;
      // pendingVerification.push(jwtXORPubkey);
    }
  // perhaps make private, but need it to be public to test
  function checkJWTProof(address a, string memory jwt) public view returns (bool) {
    // console.log('checking proof');
    // console.log(jwt);
    // bytes32 bytes32Pubkey = bytesToFirst32BytesAsBytes32Type(addressToBytes(a));
    // bytes memory keyXORJWTHash = bytes32ToBytes(bytes32Pubkey ^ sha256(stringToBytes(jwt)));
    // bytes32 k = sha256(keyXORJWTHash);
    // console.log('keyXORJWTHash is');
    // console.logBytes(keyXORJWTHash);
    // console.log('k is');
    // console.logBytes32(k);
    // require(proofToBlock[k] < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    // require(proofToBlock[k] > 0 , "Proof not found; it needs to have been submitted to commitJWTProof in a previous block");
    // // require(jp.hashedJWT == keccak256(stringToBytes(jwt)), "JWT does not match JWT in proof");
    // return true;
    return checkJWTProof(a, sha256(stringToBytes(jwt)));
  }

  // Same as checkJWTProof but for private (hashed) JWTs.
  function checkJWTProof(address a, bytes32 jwtHash) public view returns (bool) {
    bytes32 bytes32Pubkey = bytesToFirst32BytesAsBytes32Type(addressToBytes(a));
    bytes memory keyXORJWTHash = bytes32ToBytes(bytes32Pubkey ^ jwtHash);
    bytes32 k = sha256(keyXORJWTHash);
    // debugging console.logs
    console.log(proofToBlock[k]);
    console.log(block.number);
    require(proofToBlock[k] < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    console.log('^');
    require(proofToBlock[k] > 0 , "Proof not found; it needs to have been submitted to commitJWTProof in a previous block");
    // require(jp.hashedJWT == keccak256(stringToBytes(jwt)), "JWT does not match JWT in proof");
    return true;
  }

  function _verify(address addr, bytes memory signature, string memory jwt) private returns (bool) { 
    bytes32 jwtHash = sha256(stringToBytes(jwt));
    // check whether JWT is valid 
    require(verifyJWT(signature, jwt),"Verification of JWT failed");
    // check whether sender has already proved knowledge of the jwt
    require(checkJWTProof(addr, jwtHash), "Proof of previous knowlege of JWT unsuccessful");
    emit KeyAuthorization(true);
    return true;
  }

  // This is the endpoint a frontend should call. It takes a signature, JWT, IDSandwich (see comments), and start/end index of where the IDSandwhich can be found. It also takes a payload index start, as it must know the payload to decode the Base64 JWT
  function verifyMe(bytes memory signature, string memory jwt, uint payloadIdxStart, uint idxStart, uint idxEnd, bytes memory proposedIDSandwich) public { //also add  to verify that proposedId exists at jwt[idxStart:idxEnd]. If so, also verify that it starts with &id= and ends with &. So that we know it's a whole field and was actually the ID given
    bytes memory jwtBytes = stringToBytes(jwt);

    require(_verify(msg.sender, signature, jwt), "JWT Verification failed");

    // there seems to be no advantage in lying about where the payload starts, but it may be more secure to implemenent a check here that the payload starts after a period
    
    bytes memory payload = sliceBytesMemory(jwtBytes, payloadIdxStart, jwtBytes.length);
    bytes memory padByte = bytes('=');
    // console.log('PAYLOAD CONC');
    // console.log(payload.length);
    // console.log(bytes.concat(payload, padByte).length);
    while(payload.length % 4 != 0){
      console.log(payload.length);
      payload = bytes.concat(payload, padByte);
    }
    bytes memory b64decoded = Base64.decodeFromBytes(payload);
 
    require(bytesAreEqual(
                          sliceBytesMemory(proposedIDSandwich, 0, bottomBread.length),
                          bottomBread
            ),
            "Failed to find correct bottom bread in sandwich"
    );

    require(bytesAreEqual(
                          sliceBytesMemory(proposedIDSandwich, proposedIDSandwich.length-topBread.length, proposedIDSandwich.length),
                          topBread
            ),
            "Failed to find correct top bread in sandwich"
    );

    // make sure proposed id is found in the original jwt
    require(bytesAreEqual(
                          sliceBytesMemory(b64decoded, idxStart, idxEnd),
                          proposedIDSandwich
            ),
           "proposedIDSandwich not found in JWT"
    );
    bytes memory creds = sliceBytesMemory(proposedIDSandwich, bottomBread.length, proposedIDSandwich.length - topBread.length);

    // make sure there is no previous entry for this JWT - it should only be usable once!
    require(addressForJWT[jwt] == address(0), "JWT can only be used on-chain once");
    
    // update list of registered address and credentials (to keep track of who's registered), iff the address is not already registered
    if(keccak256(credsForAddress[msg.sender]) == emptyBytesHash){
      registeredAddresses.push(msg.sender);
    }
    if(addressForCreds[creds] == address(0)){
      registeredCreds.push(creds);
    }
    

    // update hashmaps of addresses, credentials, and JWTs themselves
    addressForJWT[jwt] = msg.sender;
    addressForCreds[creds] = msg.sender;
    JWTForAddress[msg.sender] = jwt;
    credsForAddress[msg.sender] = creds;

  }

  // User can just submit hash of the header and payload, so they do not reveal any sensitive data! But they still prove their ownership of the JWT
  // Note that this does not check that the headerAndPayloadHash is from a valid JWT -- it just checks that it matches the signature. To my knowledge,
  // there is no way to check thath a hash is of a valid JWT. That would violate the purpose of a cryptographic hash function.
  function linkPrivateJWT(bytes memory signature, bytes32 headerAndPayloadHash) public { 
    require(checkJWTProof(msg.sender, headerAndPayloadHash));
    bytes32 hashed = hashFromSignature(e, n, signature);
    require(hashed == headerAndPayloadHash, 'headerAndPayloadHash does not match the hash you proved knowledge of');
    // update hashmaps of addresses, credentials, and JWTs themselves
    privateJWTForAddress[msg.sender] = hashed;

  }

  // For accessing gating private credentials on the Lit Protocol
  function setAccess(address viewer, bool value) public {
    privateJWTAllowances[msg.sender][viewer] = value;
  }
  // For accessing private credentials on the Lit Protocol
  function hasAccess(address owner, address viewer) public view returns (bool result) {
    return privateJWTAllowances[owner][viewer];
  }


  function getRegisteredCreds() external view returns (bytes[] memory) {
    return registeredCreds;
  }

  function getRegisteredAddresses() external view returns (address[] memory) {
    return registeredAddresses;
  }

  // This function is used for testing purposes and can be deleted later. It's better not to call it from the frontend for security reasons, as the data being XORed is often private. Calling it from the frontend leaks this data to your node provider
  function XOR(uint256 x, uint256 y) public pure returns (uint256) {
    return x ^ y;
  }
  
  // Testing function, remove later; this seems to give a different result than ethers.js sha256, perhaps because of byte conversion?
  function testSHA256OnJWT(string memory jwt) public pure returns (bytes32){
    return sha256(stringToBytes(jwt));
  }
  
  
}
