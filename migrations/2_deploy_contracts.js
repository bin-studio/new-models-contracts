var Patches = artifacts.require('./Patches.sol')
var Metadata = artifacts.require('./Metadata.sol')
var Controller = artifacts.require('./Controller.sol')

module.exports = (deployer, helper, accounts) => {
  let billy = '0x284bAAE3a186f6272309f7cc955AA76f21cF5375'
  deployer.then(async () => {
    try {
      // Deploy Patches.sol (NFT)
      console.log('deploy Patches')
      await deployer.deploy(Patches, 'Patches', 'BDG')
      let patches = await Patches.deployed()

      // Deploy Metadata.sol
      // -w Patches address
      console.log('deploy Metadata')
      await deployer.deploy(Metadata)
      let metadata = await Metadata.deployed()

      // Update Patches.sol
      // -w Metadata address
      console.log('updateMetadataAddress')
      await patches.updateMetadataAddress(metadata.address)

      // Deploy Controller.sol
      // -w Patches address
      console.log('deploy Controller')
      await deployer.deploy(Controller, patches.address)
      let controller = await Controller.deployed()

      // Update Patches.sol
      // -w Wallet address
      // -w Billy address
      // -w Controller address
      // -w Metadata address
      console.log('updateWalletAddress', accounts[0])
      await patches.updateWalletAddress(accounts[0])
      console.log('updateBillyAddress', billy)
      await patches.updateBillyAddress(billy)
      console.log('updateControllerAddress', controller.address)
      await patches.updateControllerAddress(controller.address)
      console.log('updateMetadataAddress', metadata.address)
      await patches.updateMetadataAddress(metadata.address)
    } catch (error) {
      console.log(error)
    }
  })
}
