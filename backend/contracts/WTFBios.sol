//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.0;

// import "hardhat/console.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";


contract WTFBios  {

    mapping(address => string) public bioForAddress;

    address[] addressesWithBios;


    event AddUserBio(address userAddress);
    event ModifyUserBio(address userAddress);
    event RemoveUserBio(address userAddress);


    /// @notice Add a bio for sender
    /// @param bio Example: "Human being who does activities that humans do"
    function addBio(string calldata bio) public {
        require(bytes(bioForAddress[msg.sender]).length == 0, "This address already has a bio. Modify bio with modifyBio()");
        bioForAddress[msg.sender] = bio;
        addressesWithBios.push(msg.sender);
        emit AddUserBio(msg.sender);
    }

    /// @notice Modify sender's bio
    /// @param newBio Example: "Human being who does activities that humans do"
    function modifyBio(string calldata newBio) public {
        require(bytes(bioForAddress[msg.sender]).length > 0, "This address does not have a bio to modify. Add bio with addBio()");
        bioForAddress[msg.sender] = newBio;
        emit ModifyUserBio(msg.sender);
    }

    /// @notice Remove sender's bio
    function removeBio() public {
        require(bytes(bioForAddress[msg.sender]).length > 0, "This address does not have a bio to remove");
        for (uint i = 0; i < addressesWithBios.length; i++) {
            if (addressesWithBios[i] == msg.sender) {
                delete addressesWithBios[i];
                bioForAddress[msg.sender] = "";
                break;
            }
        }
        emit RemoveUserBio(msg.sender);
    }

    function getAddressesWithBios() public view returns (address[] memory) {
        return addressesWithBios;
    }

}