//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";


contract WTFBios  {

    mapping(address => string) public bioForAddress;
    mapping(address => string) public nameForAddress;

    address[] registeredAddresses;


    event AddUserNameAndBio(address userAddress);
    event ModifyUserNameAndBio(address userAddress);
    event RemoveUserNameAndBio(address userAddress);


    /// @notice Add a name and bio for sender
    /// @param name Example: "Sonny Sonnison"
    /// @param bio Example: "Human being who does activities that humans do"
    function addNameAndBio(string calldata name, string calldata bio) public {
        require(bytes(bioForAddress[msg.sender]).length == 0, "This address is already registered. Modify name and bio with modifyNameAndBio()");
        nameForAddress[msg.sender] = name;
        bioForAddress[msg.sender] = bio;
        registeredAddresses.push(msg.sender);
        emit AddUserNameAndBio(msg.sender);
    }

    /// @notice Modify sender's name and bio
    /// @param newBio Example: "Human being who does activities that humans do"
    function modifyNameAndBio(string calldata name, string calldata newBio) public {
        require(bytes(bioForAddress[msg.sender]).length > 0, "This address does not have a name and bio to modify. Add name and bio with addNameAndBio()");
        nameForAddress[msg.sender] = name;
        bioForAddress[msg.sender] = newBio;
        emit ModifyUserNameAndBio(msg.sender);
    }

    /// @notice Remove sender's name and bio
    function removeNameAndBio() public {
        require(bytes(bioForAddress[msg.sender]).length > 0, "This address does not have a name and bio to remove");
        for (uint i = 0; i < registeredAddresses.length; i++) {
            if (registeredAddresses[i] == msg.sender) {
                delete registeredAddresses[i];
                nameForAddress[msg.sender] = "";
                bioForAddress[msg.sender] = "";
                break;
            }
        }
        emit RemoveUserNameAndBio(msg.sender);
    }

    function getRegisteredAddresses() public view returns (address[] memory) {
        return registeredAddresses;
    }

}