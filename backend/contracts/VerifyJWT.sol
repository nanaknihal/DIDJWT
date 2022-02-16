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

    // web2 server's RS256 public key, split into base, exponent, and modulus
    uint256 b;
    uint256 e;
    uint256 m;

    // function verify(uint256 base_length, uint256 exponent_length, uint256 modulus_length, bytes memory base, bytes memory exponent, bytes memory modulus){
    //   assembly {
    //   // call ecmul precompile
    //   if iszero(call(not(0), 0x05, base_length, exponent_length, modulus_length, base, exponent, modulus)) {
    //     revert(0, 0)
    //   }
    // }
    // }

    // Why am i putting test functions here haha
    function testAddressByteConversion(address a) public view returns (bool) {
      return bytesToAddress(addressToBytes(a)) == a;
    }

    // https://ethereum.stackexchange.com/questions/8346/convert-address-to-string
    function bytesToAddress(bytes memory b) private pure returns (address addr) {
      assembly {
        addr := mload(add(b,20))
      } 
    }

    function bytes32ToAddress(bytes32 b) private pure returns (address addr) {
      assembly {
        addr := mload(add(b,20)) //shouldn't it be 0x20 or is that equivalent
      } 
    }

    function bytesToFirst32BytesAsBytes32Type(bytes memory b) private pure returns (bytes32 b32) {
      assembly {
        b32 := mload(add(b,20)) //shouldn't it be 0x20 or is that equivalent
      } 
    }
    
    function addressToBytes(address a) public pure returns (bytes memory) {
      return abi.encodePacked(a);
    }
    
    function bytes32ToBytes(bytes32 b) private pure returns (bytes memory){
      return abi.encodePacked(b);
    }
    // function addressToBytes32(address a) public pure returns (bytes32) {
    //   return abi.encodePacked(a);
    // }

    function stringToBytes(string memory s) public pure returns (bytes memory) {
      return abi.encodePacked(s);
    }
    
    // https://ethereum.stackexchange.com/questions/71565/verifying-modular-exponentiation-operation-in-etherum
    function modExp(uint256 _b, uint256 _e, uint256 _m) public returns (uint256 result) {
        assembly {
            // Free memory pointer
            let pointer := mload(0x40)

            // Define length of base, exponent and modulus. 0x20 == 32 bytes
            mstore(pointer, 0x20)
            mstore(add(pointer, 0x20), 0x20)
            mstore(add(pointer, 0x40), 0x20)

            // Define variables base, exponent and modulus
            mstore(add(pointer, 0x60), _b)
            mstore(add(pointer, 0x80), _e)
            mstore(add(pointer, 0xa0), _m)

            // Store the result
            let value := mload(0xc0)

            // Call the precompiled contract 0x05 = bigModExp
            if iszero(call(not(0), 0x05, 0, pointer, 0xc0, value, 0x20)) {
                revert(0, 0)
            }

            result := mload(value)
            // return(result, 32)
        }
        return result;
    }

    function _verifyJWT(uint256 _b, uint256 _e, uint256 _m, uint256 _message) private returns (bool) {
      uint256 decrypted = modExp(_b, _e, _m);
      console.log('result is ', decrypted);
      bool verified = decrypted == _message;
      // if(verified){
      //   credsForAddress[msg.sender] = message;
      //   addressForCreds[message] = msg.sender;
      // }
      return verified;
    }
    
    function verifyJWT(string memory jwt) public returns (bool) {
      return _verifyJWT(b, e, m, uint(keccak256(stringToBytes(jwt))));
    }

    function commitJWTProof(bytes32 jwtXORPubkey, bytes32 jwtHash) public {
    jwtProofs[jwtXORPubkey] = JWTProof({
      blockNumber: block.number, 
      hashedJWT: jwtHash
    });

  }
  function _checkJWTProof(address a, string memory jwt) private view returns (bool) {
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

  function verifyMe(string memory jwt) public returns (bool) {
    // check whether JWT is valid 
    require(verifyJWT(jwt),"Verification of JWT failed");
    // check whether sender has already proved knowledge of the jwt
    require(_checkJWTProof(msg.sender, jwt), "Proof of previous knowlege of JWT unsuccessful");
  }
  
}
