//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract VerifyJWT {
    struct JWTProof {
      uint256 blockNumber;
      bytes32 hashedJWT;
    }
    mapping(address => string) public credsForAddress;
    mapping(string => address) public addressForCreds;
    mapping(bytes32 => JWTProof) public jwtProofs;

    // web2 server's RS256 public key, split into exponent and modulus
    uint256 public e;
    bytes public n;

    bytes32[] public pendingVerification; //unneeded later, just for testing purposes
    bytes32[] public verifiedUsers;

    event modExpEventForTesting(bytes result_);
    event Verification(bool result_);
    // function verify(uint256 base_length, uint256 exponent_length, uint256 modulus_length, bytes memory base, bytes memory exponent, bytes memory modulus){
    //   assembly {
    //   // call ecmul precompile
    //   if iszero(call(not(0), 0x05, base_length, exponent_length, modulus_length, base, exponent, modulus)) {
    //     revert(0, 0)
    //   }
    // }
    // }
    constructor(uint256 exponent, bytes memory modulus){
      e = exponent;
      n = modulus;
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
    
    function addressToBytes(address a) public pure returns (bytes memory) {
      return abi.encodePacked(a);
    }
    
    function bytes32ToBytes(bytes32 b_) private pure returns (bytes memory){
      return abi.encodePacked(b_);
    }
    // function addressToBytes32(address a) public pure returns (bytes32) {
    //   return abi.encodePacked(a);
    // }

    function stringToBytes(string memory s) public pure returns (bytes memory) {
      return abi.encodePacked(s);
    }
    // logging function to support bytes32, which hardhat doesn't support
    function logBytes32(bytes32 b_) internal view {
      console.logBytes(bytes32ToBytes(b_));
    }


    // BIG thanks to dankrad for this function: https://github.com/dankrad/rsa-bounty/blob/master/contract/rsa_bounty.sol
    // Expmod for bignum operands (encoded as bytes, only base and modulus)
    function modExp(bytes memory base, uint e, bytes memory m) public returns (bytes memory o) {
        assembly {
            // Get free memory pointer
            let p := mload(0x40)

            // Get base length in bytes
            let bl := mload(base)
            // Get modulus length in bytes
            let ml := mload(m)

            // Store parameters for the Expmod (0x05) precompile
            mstore(p, bl)               // Length of Base
            mstore(add(p, 0x20), 0x20)  // Length of Exponent
            mstore(add(p, 0x40), ml)    // Length of Modulus
            // Use Identity (0x04) precompile to memcpy the base
            if iszero(staticcall(10000, 0x04, add(base, 0x20), bl, add(p, 0x60), bl)) {
                revert(0, 0)
            }
            mstore(add(p, add(0x60, bl)), e) // Exponent
            // Use Identity (0x04) precompile to memcpy the modulus
            if iszero(staticcall(10000, 0x04, add(m, 0x20), ml, add(add(p, 0x80), bl), ml)) {
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
        console.log("o is");
        console.logBytes(o);
        emit modExpEventForTesting(o);
    }

    // // https://ethereum.stackexchange.com/questions/71565/verifying-modular-exponentiation-operation-in-etherum
    // function modExp(bytes memory base, uint256 exponent, bytes memory modulus) public returns (bytes32 result) {
    //     assembly {
    //         let pointer := mload(0x40)
    //         // Define length of base, exponent and modulus. 0x20 == 32 bytes
    //         mstore(pointer, 0x20)
    //         mstore(add(pointer, 0x20), 0x20)
    //         mstore(add(pointer, 0x40), 0x100)

    //         // Define variables base, exponent and modulus
    //         // The first byte of an array stores the length of the array, so have to put number of bytes beforev ariables of type bytes (i.e. 0x20 before to base and 0x100 before modulus)
    //         // When accessing base and modulus in the first place, make sure to access one byte later, since their first byte just stores their length!
    //         mstore(add(pointer, 0x60), 0x20)
    //         mstore(add(pointer, 0x80), mload(add(base, 0x20)))
    //         mstore(add(pointer, 0xa0), exponent)
    //         mstore(add(pointer, 0xc0), 0x100)
    //         mstore(add(pointer, 0xe0), mload(add(modulus, 0x20)))

    //         // // Store the result
    //         // let value := mload(0xc0)

    //         // Call the precompiled contract 0x05 = bigModExp
    //         // if iszero(call(not(0), 0x05, 0, pointer, 0x1a0, add(pointer, 0x11a0), 0x20)) {
    //         //     revert(0, 0)
    //         // }
    //         result := mload(add(base, 0x20))
    //         // Store the result
    //         // let value := mload(0x1a0)

    //         // result := mload(value)
    //         // return(result, 32)
    //     }
    //     console.log("result is byetss");
    //     console.logBytes32(result);
    //     emit modExpEventForTesting(uint(result));
    //     return result;
    // }

    // function testFunction(bytes memory base, uint256 exponent, bytes memory modulus) public returns (bytes memory result) {
    //     assembly {
    //         let pointer := mload(0x40)
    //         mstore(pointer, 0x1e0)
    //         // Define length of base, exponent and modulus. 0x20 == 32 bytes
    //         mstore(add(pointer, 0x20), 0x20)
    //         mstore(add(pointer, 0x40), 0x20)
    //         mstore(add(pointer, 0x60), 0x100)
    //         // Define variables base, exponent and modulus
    //         // The first byte of an array stores the length of the array, so have to put number of bytes beforev ariables of type bytes (i.e. 0x20 before to base and 0x100 before modulus)
    //         // When accessing base and modulus in the first place, make sure to access one byte later, since their first byte just stores their length!
    //         mstore(add(pointer, 0x80), 0x20)
    //         mstore(add(pointer, 0xa0), mload(add(base, 0x20)))
    //         mstore(add(pointer, 0xc0), exponent)
    //         mstore(add(pointer, 0xe0), 0x100)
    //         mstore(add(pointer, 0x100), mload(add(modulus, 0x20)))

    //         // // Store the result
    //         // let value := mload(0xc0)

    //         // Call the precompiled contract 0x05 = bigModExp
    //         // if iszero(call(not(0), 0x05, 0, pointer, 0x1a0, add(pointer, 0x11a0), 0x20)) {
    //         //     revert(0, 0)
    //         // }
    //         result := add(0x20, 0x20)//mload(add(pointer, 0x60))
    //         // Store the result
    //         // let value := mload(0x1a0)

    //         // result := mload(value)
    //         // return(result, 32)
    //     }
    //     console.log("all data now is:");
    //     console.logBytes(pointer);
    //     return result;
    // }
    // // function modExp(bytes memory base, uint256 exponent, bytes memory modulus) public returns (bytes32 result) {
    // //   return _modExp(0x20, 0x20, 0x100, base, exponent, modulus);
    // // }

    
    // Made public for testing, ideally should be private
    function _verifyJWT(uint256 e_, bytes memory n_, bytes memory signature_, bytes memory message_) public returns (bool) {
      bytes32 decrypted = (modExp(signature_, e_, n_));
      console.logBytes(modExp(signature_, e_, n_));
      console.log("decrypted");
      console.logBytes32(decrypted);
      console.log("keccak256(message_)");
      console.logBytes32(keccak256(message_));
      // console.log('result is ', decrypted);
      bool verified = decrypted == keccak256(message_);
      // if(verified){
      //   credsForAddress[msg.sender] = message;
      //   addressForCreds[message] = msg.sender;
      // }
      emit Verification(verified);
      return verified;
    }
    
    function verifyJWT(bytes memory signature, bytes memory jwt) public returns (bool) {
      return _verifyJWT(e, n, signature, stringToBytes(jwt));
    }

    function commitJWTProof(bytes32 jwtXORPubkey, bytes32 jwtHash) public {
      // console.logBytes32(jwtXORPubkey);
      // console.log("that was key");
      jwtProofs[jwtXORPubkey] = JWTProof({
        blockNumber: block.number, 
        hashedJWT: jwtHash
      });
      pendingVerification.push(jwtXORPubkey);
    }
  // perhaps make private, but need it to be public to test
  function checkJWTProof(address a, string memory jwt) public view returns (bool) {
    bytes32 bytes32Pubkey = bytesToFirst32BytesAsBytes32Type(addressToBytes(a));
    // console.log("address version:");
    // console.log(a);
    // console.logBytes(addressToBytes(a));
    // console.logBytes32(bytes32Pubkey);
    // console.log("^bytes32 version");
    
    // check whether sender has already proved knowledge of the jwt in a previous block by XORing it with their public key and SHA2 of JWT. 
    // CANNOT use same encryption algorithm that jp.hashedJWT is stored with; that would cause an attack vector:
    // hash(JWT) would be known, so then XOR(public key, hash(JWT)) can be replaced with XOR(frontrunner pubkey, hash(JWT)) by a frontrunner
    bytes32 k = bytes32Pubkey ^ sha256(stringToBytes(jwt));
    // console.logBytes32(pendingVerification[pendingVerification.length - 1]);
    // console.log("looking up key");
    // console.log("key is pendingVerification[pendingVerification.length - 1]?", k == pendingVerification[pendingVerification.length - 1]);
    // console.logBytes32(k);
    // console.logBytes32(pendingVerification[pendingVerification.length - 1]);
    // console.logBytes32(k ^ pendingVerification[pendingVerification.length - 1]);
    JWTProof memory jp = jwtProofs[k];
    // console.logBytes32(jp.hashedJWT);
    // console.logBytes32(k);
    console.logBytes32(keccak256(stringToBytes(jwt)));
    // console.log("JWT argument", jwt);
    // console.log("Block number", jp.blockNumber);
    // console.log("hashedJWT is: "); console.logBytes32(jp.hashedJWT);
    require(jp.blockNumber < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    require(jp.hashedJWT == keccak256(stringToBytes(jwt)), "JWT does not match JWT in proof");
    return true;
  }

  function verifyMe(bytes memory signature, string memory jwt) public returns (bool) {
    // check whether JWT is valid 
    require(verifyJWT(signature, jwt),"Verification of JWT failed");
    // check whether sender has already proved knowledge of the jwt
    require(checkJWTProof(msg.sender, jwt), "Proof of previous knowlege of JWT unsuccessful");
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
