//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";


contract WTFBios  {

    mapping(address => string) public bioForAddress;
    mapping(address => string) public nameForAddress;

    address[] registeredAddresses;

    // For easy access of registered addresses
    mapping(address => address) addressForAddress; 

    event AddUserNameAndBio(address userAddress);
    event RemoveUserNameAndBio(address userAddress);


    /// @notice Add a name and bio for sender. If name and bio already exist, replace them.
    /// @param name Example: "Sonny Sonnison"
    /// @param bio Example: "Human being who does activities that humans do"
    function addNameAndBio(string calldata name, string calldata bio) public {
        nameForAddress[msg.sender] = name;
        bioForAddress[msg.sender] = bio;
        if (addressForAddress[msg.sender] == address(0)) {
            registeredAddresses.push(msg.sender);
        }
        emit AddUserNameAndBio(msg.sender);
    }

    /// @notice Remove sender's name and bio
    function removeNameAndBio() public {
        require(bytes(bioForAddress[msg.sender]).length > 0, "This address does not have a name and bio to remove");
        for (uint i = 0; i < registeredAddresses.length; i++) {
            if (registeredAddresses[i] == msg.sender) {
                delete registeredAddresses[i];
                nameForAddress[msg.sender] = "";
                bioForAddress[msg.sender] = "";
                addressForAddress[msg.sender] = address(0);
                break;
            }
        }
        emit RemoveUserNameAndBio(msg.sender);
    }

    function getRegisteredAddresses() public view returns (address[] memory) {
        return registeredAddresses;
    }

}