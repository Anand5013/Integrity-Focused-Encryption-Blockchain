const ImageRecordChain = artifacts.require("ImageRecordChain");
const UserCredentialChain = artifacts.require("UserCredentialChain");

module.exports = function (deployer) {
  deployer.deploy(ImageRecordChain);
  deployer.deploy(UserCredentialChain);
};
