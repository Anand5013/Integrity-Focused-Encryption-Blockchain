// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserCredentialChain {
    // Struct to hold user record details
    struct UserRecord {
        string username;
        string role;
        bytes permissions;  // Using bytes for flexibility (could encode JSON)
        bytes32 recordHash; // Hash of the full record
    }

    // Mapping of wallet address to user record
    mapping(address => UserRecord) private userRecords;

    event CredentialStored(address indexed user, bytes32 recordHash);

    // Modified to accept user address as parameter
    function storeCredential(
        address _userAddress,  // Added user address parameter
        string memory _username,
        string memory _role,
        bytes memory _permissions
    ) public {
        bytes32 recordHash = keccak256(
            abi.encodePacked(_username, _role, _permissions)
        );
        
        userRecords[_userAddress] = UserRecord({
            username: _username,
            role: _role,
            permissions: _permissions,
            recordHash: recordHash
        });
        
        emit CredentialStored(_userAddress, recordHash);
    }

    // Verify credentials for any address (not just msg.sender)
    function verifyCredential(
        address _userAddress,  // Added user address parameter
        string memory _username,
        string memory _role,
        bytes memory _permissions
    ) public view returns (bool) {
        bytes32 providedHash = keccak256(
            abi.encodePacked(_username, _role, _permissions)
        );
        return userRecords[_userAddress].recordHash == providedHash;
    }

    // Get user record (unchanged)
    function getUserRecord(address _user) public view returns (
        string memory username,
        string memory role,
        bytes memory permissions,
        bytes32 recordHash
    ) {
        UserRecord memory record = userRecords[_user];
        return (record.username, record.role, record.permissions, record.recordHash);
    }
}