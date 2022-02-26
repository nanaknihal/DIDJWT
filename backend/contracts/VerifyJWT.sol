//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "contracts/Base64.sol"; 
contract VerifyJWT {
    struct JWTProof {
      uint256 blockNumber;
      bytes32 hashedJWT;
    }

    // creds are the identifier / index field in the JWT, e.g. ID or email (the rest of the JWT has lots of other information)
    mapping(address => string) public JWTForAddress;
    mapping(string => address) public addressForJWT;

    mapping(address => bytes) public credsForAddress;
    mapping(bytes => address) public addressForCreds;



    mapping(bytes32 => JWTProof) public jwtProofs;

    // web2 server's RS256 public key, split into exponent and modulus
    uint256 public e;
    bytes public n;
     // It would be very difficult to index people based on their base64url-encoded JWTs. Having a plaintext ID, such as an email address is needed. How can we do this? 
    // Allow the user to select a string within t heir JWT to be indexed by
    // how the id fields start and ed. For example, one web2 service may have IDs in the token as '"userID" : "vitalik.eth", "iat" : ...' 
    // if the user is allowed to choose their id as anywhere in the contract, that would be bad. Here, we can enforce that the id must be wrapped by

    // topBread and bottomBread refer to the start and end of the byte sandwhich which desired credential must be between.
    // for example, a JWT can have many fields, but we just want the email, which is in a part that looks like: '"email" : email_here, "next field' : . So then, you can set topBread to ', "next field' : ' and bottomBread to '"email" : '
    // then, when you validate the JWT, the user supplies '"email" : email_here, "next field', and this contract can approve it because the sandwhich starts and ends the right way
    bytes public topBread;
    bytes public bottomBread;
   


    bytes32[] public pendingVerification; //unneeded later, just for testing purposes
    bytes32[] public verifiedUsers;

    event modExpEventForTesting(bytes result_);
    event JWTVerification(bool result_);
    event KeyAuthorization(bool result_);
    
    // exponent and modulus comrpise the RSA public key of the web2 authenticator which signed the JWT. 
    constructor(uint256 exponent_, bytes memory modulus_, bytes memory bottomBread_, bytes memory topBread_){
      e = exponent_;
      n = modulus_;
      topBread = topBread_; 
      bottomBread = bottomBread_;
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

    function sliceBytesMemory(bytes memory m, uint256 start, uint256 end) public view returns (bytes memory r) {
      // console.log("sliceBytesMemory parameters");
      // console.logBytes(m);
      // console.log(start);
      // console.log(end);
      require(start < end, "index start must be less than inded end");
      assembly {
        let offset := add(start, 0x20) //first 0x20 bytes of bytes typpe is length (no. of bytes)
        r := add(m, start)
        mstore(r, sub(end, start))
      }
      // console.log("sliceBytesMemory values calculated");
      // console.log(offset);
      // console.logBytes(r);
    }
    // logging function to support bytes32
    function logBytes32(bytes32 b_) internal view {
      console.logBytes(bytes32ToBytes(b_));
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
    
    // Made public for testing, ideally should be private
    function _verifyJWT(uint256 e_, bytes memory n_, bytes memory signature_, bytes memory message_) public returns (bool) {
      bytes memory decrypted = modExp(signature_, e_, n_);
      bytes32 unpadded = bytesToLast32BytesAsBytes32Type(decrypted);
      bool verified = unpadded == sha256(message_);
      emit JWTVerification(verified);
      return verified;
    }
    
    function verifyJWT(bytes memory signature, string memory jwt) public returns (bool) {
      return _verifyJWT(e, n, signature, stringToBytes(jwt));
    }

    function commitJWTProof(bytes32 jwtXORPubkey, bytes32 jwtHash) public {
      jwtProofs[jwtXORPubkey] = JWTProof({
        blockNumber: block.number, 
        hashedJWT: jwtHash
      });
      pendingVerification.push(jwtXORPubkey);
    }
  // perhaps make private, but need it to be public to test
  function checkJWTProof(address a, string memory jwt) public view returns (bool) {
    bytes32 bytes32Pubkey = bytesToFirst32BytesAsBytes32Type(addressToBytes(a));
    
    // check whether sender has already proved knowledge of the jwt in a previous block by XORing it with their public key and SHA2 of JWT. 
    // CANNOT use same encryption algorithm that jp.hashedJWT is stored with; that would cause an attack vector:
    // hash(JWT) would be known, so then XOR(public key, hash(JWT)) can be replaced with XOR(frontrunner pubkey, hash(JWT)) by a frontrunner
    bytes32 k = bytes32Pubkey ^ sha256(stringToBytes(jwt));

    JWTProof memory jp = jwtProofs[k];

    require(jp.blockNumber < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    require(jp.hashedJWT == keccak256(stringToBytes(jwt)), "JWT does not match JWT in proof");
    return true;
  }

  function _verify(address addr, bytes memory signature, string memory jwt) private returns (bool) { 
    // check whether JWT is valid 
    require(verifyJWT(signature, jwt),"Verification of JWT failed");
    // check whether sender has already proved knowledge of the jwt
    require(checkJWTProof(addr, jwt), "Proof of previous knowlege of JWT unsuccessful");
    emit KeyAuthorization(true);
    return true;
  }

  // This is the endpoint a frontend should call. It takes a signature, JWT, IDSandwich (see comments), and start/end index of where the IDSandwhich can be found. It also takes a payload index start, as it must know the payload to decode the Base64 JWT
  function verifyMe(bytes memory signature, string memory jwt, uint payloadIdxStart, uint idxStart, uint idxEnd, bytes memory proposedIDSandwich) public { //also add  to verify that proposedId exists at jwt[idxStart:idxEnd]. If so, also verify that it starts with &id= and ends with &. So that we know it's a whole field and was actually the ID given
    require(_verify(msg.sender, signature, jwt), "JWT Verification failed");

    // there seems to be no advantage in lying about where the payload starts, but it may be more secure to implemenent a check here that the payload starts after a period
    bytes memory jwtBytes = stringToBytes(jwt);
    bytes memory payload = sliceBytesMemory(jwtBytes, payloadIdxStart, jwtBytes.length);
    console.log('payload is');
    console.logBytes(payload);
    bytes memory b64decoded = Base64.decodeFromBytes(payload);
    // bytes memory proposedIDSandwichBytes = stringToBytes(proposedIDSandwich);
    console.logBytes(b64decoded);
    console.logBytes(sliceBytesMemory(b64decoded, idxStart, idxEnd));
    console.logBytes(proposedIDSandwich);



    // make sure proposed id starts and ends with the required opening and closing strings (as byets):
    console.log("CHECKPOINT");
    console.log(proposedIDSandwich.length, topBread.length, proposedIDSandwich.length-topBread.length);
    console.logBytes(
      sliceBytesMemory(proposedIDSandwich, proposedIDSandwich.length-topBread.length, proposedIDSandwich.length)
    );

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

    // // make sure proposed id is found in the original jwt
    // require(bytesAreEqual(
    //                       sliceBytesMemory(b64decoded, idxStart, idxEnd),
    //                       proposedIDSandwich
    //         ),
    //        "proposedIDSandwich not found in JWT"
    // );
    // bytes memory creds = sliceBytesMemory(proposedIDSandwich, bottomBread.length, proposedIDSandwich.length - topBread.length);
    // console.logBytes(creds);

    // addressForCreds[creds] = msg.sender;
    // credsForAddress[msg.sender] = creds;
    // addressForJWT[jwt] = msg.sender;
    // JWTForAddress[msg.sender] = jwt;
    // // credsForAddress[msg.sender] = jwt;

  }

  // kind of a hack; this view function is just for the frontend to call because it's easier to write code to XOR uint256s in Solidity than JS...idieally, this is done in browser
  // It also allows your node provider to frontrun you, as you are trusting them with the JWT hash, but i don't think that will happen ;) still not decentralized enough, and should be put browser-side
  // I don't think anyone else can frontrun you because I don't think view/pure functions are submitted to the mempool
  function XOR(uint256 x, uint256 y) public pure returns (uint256) {
    return x ^ y;
  }
  
  // Testing function, remove later; this seems to give a different result than ethers.js sha256, perhaps because of byte conversion?
  function testSHA256OnJWT(string memory jwt) public pure returns (bytes32){
    return sha256(stringToBytes(jwt));
  }
  
  
}
