//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./VerifyJWT.sol";
import "./WTFBios.sol";


contract IdentityAggregator is Ownable  {

    mapping(string => address) public contractAddrForKeyword; // e.g., "orcid" => VerifyJWT(orcidContractAddress)

    mapping(string => string) private keywordForKeyword; // Allows easier lookup for keywords

    string[] private keywords; // e.g., "orcid"

    address private biosContract;


    event AddSupportForContract(string contractKeyword);
    event RemoveSupportForContract(string contractKeyword);


    /// @notice Add support for a new VerifyJWT contract.
    /// @param keyword The string used to denote the source of the JWT (e.g., "twitter").
    /// @param contractAddress The address of the JWT contract to be supported.
    function addVerifyJWTContract(string calldata keyword, address contractAddress) public onlyOwner {
        // Require that neither this keyword nor this contract has been added
        require(bytes(keywordForKeyword[keyword]).length == 0, "This keyword is already being used");

        keywords.push(keyword);
        keywordForKeyword[keyword] = keyword;
        contractAddrForKeyword[keyword] = contractAddress;

        emit AddSupportForContract(keyword);
    }

    /// @notice Remove support for a VerifyJWT contract.
    /// @param keyword The string used to lookup the contract.
    function removeSupportFor(string calldata keyword) public onlyOwner {
        require(contractAddrForKeyword[keyword] != address(0), "There is no corresponding contract for this keyword");
        
        for (uint i = 0; i < keywords.length; i++) {
            if (keccak256(bytes(keywords[i])) == keccak256(bytes(keyword))) {
                contractAddrForKeyword[keyword] = address(0);
                keywordForKeyword[keyword] = "";
                keywords[i] = "";

                emit RemoveSupportForContract(keyword);
                break;
            }
        }
    }

    /// @notice For user, get creds for every platform designated in keywords.
    /// @param user The address whose creds will be returned.
    /// @return creds A list of creds corresponding to user.
    function getAllAccounts(address user) public view returns (bytes[] memory creds, string memory name, string memory bio) {
        bytes[] memory allCreds = new bytes[](keywords.length);
        for (uint i = 0; i < keywords.length; i++) {
            if (bytes(keywords[i]).length != 0) {
                address contractAddr = contractAddrForKeyword[keywords[i]];
                VerifyJWT contract_ = VerifyJWT(contractAddr);
                bytes memory credsTemp = contract_.credsForAddress(user);
                if (credsTemp.length != 0) {
                    allCreds[i] = credsTemp;
                }
            }
        }
        if (biosContract != address(0)) {
            WTFBios wtfBios = WTFBios(biosContract);
            string memory name = wtfBios.nameForAddress(user);
            string memory bio = wtfBios.bioForAddress(user);
            return (allCreds, name, bio);
        }
        return (allCreds, "", "");
    }

    function getKeywords() public view returns (string[] memory) {
        return keywords;
    }

    function setBiosContractAddress(address biosContract_) public onlyOwner {
        biosContract = biosContract_;
    }
    
    function getBiosContractAddress() public view returns (address) {
        return biosContract;
    }

}
