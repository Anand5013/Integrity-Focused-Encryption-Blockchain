// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ImageRecordChain {
    // Mapping of patient wallet address to list of IPFS hashes
    mapping(address => string[]) public patientRecords;
    // Mapping to track the total number of records per patient
    mapping(address => uint256) public recordCount;

    event IPFSHashStored(address indexed patientAddress, string ipfsHash);

    constructor() {}

    // Store IPFS hash associated with a patient address
    function storeIPFSHash(address _patientAddress, string memory _ipfsHash) public {
        patientRecords[_patientAddress].push(_ipfsHash);
        recordCount[_patientAddress]++;
        emit IPFSHashStored(_patientAddress, _ipfsHash);
    }

    // Get all IPFS hashes for a patient
    function getIPFSHashes(address _patientAddress) public view returns (string[] memory) {
        return patientRecords[_patientAddress];
    }

    // Get the number of records for a patient
    function getRecordCount(address _patientAddress) public view returns (uint256) {
        return recordCount[_patientAddress];
    }
}