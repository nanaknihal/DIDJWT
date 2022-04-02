//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./VerifyJWT.sol";


contract IdentityAggregator is Ownable  {

    mapping(string => address) public contractAddrForKeyword; // e.g., "orcid" => VerifyJWT(orcidContractAddress)

    // Allows easier lookup for keywords // NOTE: Don't need this if our only accessor func is getAllAccounts()
    mapping(string => string) private keywordForKeyword;

    string[] private keywords; // e.g., "orcid" // TODO: Better name than 'keywords'??


    event AddSupportForContract(string contractKeyword);
    event RemoveSupportForContract(string contractKeyword);


    constructor() {
        
    }


    /// @notice Add support for a new VerifyJWT contract.
    /// @param keyword The string used to denote the source of the JWT (e.g., "twitter").
    /// @param contractAddress The address of the JWT contract to be supported.
    function addPlatformContract(string memory keyword, address contractAddress) public onlyOwner { // TODO: there must be a better way than onlyOwner

        // Require that neither this keyword nor this contract has been added
        require(bytes(keywordForKeyword[keyword]).length == 0);
        require(contractAddrForKeyword[keyword] == address(0));

        keywords.push(keyword);
        keywordForKeyword[keyword] = keyword;
        contractAddrForKeyword[keyword] = contractAddress;

        emit AddSupportForContract(keyword);
    }

    // TODO: Is there a way to store keywords that allows iteration but allows removal without iteration?
    /// @notice Remove support for a VerifyJWT contract.
    /// @param keyword The string used to lookup the contract.
    function removeSupportFor(string memory keyword) public onlyOwner { // TODO: there must be a better way than onlyOwner
        require(contractAddrForKeyword[keyword] != address(0), "There is no corresponding contract for this keyword.");
        
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
    function getAllAccounts(address user) public returns (bytes[] memory creds) {
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
        return allCreds;
    }

    // TODO: Either delete this function, or find a better implementation.
    // e.g., keyword1 == "orcid", creds1 == "12345...", keyword2 == "twitter" ---> returns "@somehandle"
    function getCredsFromCreds(
        string memory keyword1, 
        bytes calldata creds1, // TODO: Make these parameters fixed-length
        string memory keyword2
        ) 
        public returns (bytes memory creds2) {

        // Require that we have stored the contracts for the specified keywords
        require(bytes(keywordForKeyword[keyword1]).length != 0);
        require(bytes(keywordForKeyword[keyword2]).length != 0);

        // Get user address
        address creds1ContractAddr = contractAddrForKeyword[keyword1];
        VerifyJWT creds1Contract = VerifyJWT(creds1ContractAddr);
        address userAddr = creds1Contract.addressForCreds(creds1);

        string memory errorMessage = string(abi.encodePacked("This user has no creds for ", keyword1));
        require(userAddr != address(0), errorMessage);

        address creds2ContractAddr = contractAddrForKeyword[keyword2];
        VerifyJWT creds2Contract = VerifyJWT(creds2ContractAddr);
        bytes memory creds2 = creds2Contract.credsForAddress(userAddr);

        errorMessage = string(abi.encodePacked("This user has no creds for ", keyword2));
        require(creds2.length != 0);

        return creds2;
    }

    function getKeywords() public view returns (string[] memory) {
        return keywords;
    }

}