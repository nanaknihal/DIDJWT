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
    bytes32 public e;
    bytes public n;

    bytes32[] public pendingVerification; //unneeded later, just for testing purposes
    bytes32[] public verifiedUsers;

    // event SignatureVerificationStatus(address from_, string jwt_ , bool status_);
    event modExpEventForTesting(bytes32 result_);
    // function verify(uint256 base_length, uint256 exponent_length, uint256 modulus_length, bytes memory base, bytes memory exponent, bytes memory modulus){
    //   assembly {
    //   // call ecmul precompile
    //   if iszero(call(not(0), 0x05, base_length, exponent_length, modulus_length, base, exponent, modulus)) {
    //     revert(0, 0)
    //   }
    // }
    // }
    constructor(bytes32 exponent, bytes memory modulus){
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

    function bytesToFirst32BytesAsBytes32Type(bytes memory input_) private view returns (bytes32 b_) {
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
    // https://ethereum.stackexchange.com/questions/71565/verifying-modular-exponentiation-operation-in-etherum
    function modExp(bytes32 _b, bytes32 _e, bytes memory _m) public returns (bytes32 result) {
        assembly {
            let pointer := mload(0x40)
            // Define length of base, exponent and modulus. 0x20 == 32 bytes
            mstore(pointer, 0x20)
            mstore(add(pointer, 0x20), 0x20)
            mstore(add(pointer, 0x40), 0x100)

            // Define variables base, exponent and modulus
            mstore(add(pointer, 0x120), _b)
            mstore(add(pointer, 0x140), _e)
            mstore(add(pointer, 0x160), _m)

            // Store the result
            let value := mload(0xc0)

            // Call the precompiled contract 0x05 = bigModExp
            if iszero(call(not(0), 0x05, 0, pointer, 0xc0, value, 0x20)) {
                revert(0, 0)
            }

            result := mload(value)
            // return(result, 32)
        }
        emit modExpEventForTesting(result);
        return result;
    }

    // Made public for testing, ideally should be private
    function _verifyJWT(bytes32 e_, bytes memory n_, bytes32 signature_, bytes32 message_) public returns (bool) {
      bytes32 decrypted = modExp(signature_, e_, n_);
      // console.log('result is ', decrypted);
      bool verified = decrypted == message_;
      // if(verified){
      //   credsForAddress[msg.sender] = message;
      //   addressForCreds[message] = msg.sender;
      // }
      return verified;
    }
    
    function verifyJWT(bytes32 signature, string memory jwt) public returns (bool) {
      return _verifyJWT(e, n, signature, keccak256(stringToBytes(jwt)));
    }

    function commitJWTProof(bytes32 jwtXORPubkey, bytes32 jwtHash) public {
      console.logBytes32(jwtXORPubkey);
      console.log("that was key");
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
    console.log("JWT argument", jwt);
    console.log("Block number", jp.blockNumber);
    console.log("hashedJWT is: "); console.logBytes32(jp.hashedJWT);
    require(jp.blockNumber < block.number, "You need to prove knowledge of JWT in a previous block, otherwise you can be frontrun");
    require(jp.hashedJWT == keccak256(stringToBytes(jwt)), "JWT does not match JWT in proof");
    return true;
  }

  function verifyMe(bytes32 signature, string memory jwt) public returns (bool) {
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
