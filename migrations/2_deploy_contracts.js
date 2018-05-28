var Badges = artifacts.require('./Badges.sol')
var Metadata = artifacts.require('./Metadata.sol')
var Controller = artifacts.require('./Controller.sol')

module.exports = (deployer, helper, accounts) => {
  let billy = '0x284bAAE3a186f6272309f7cc955AA76f21cF5375'
  deployer.then(async () => {
    try {
      // Deploy Badges.sol (NFT)
      console.log('deploy Badges')
      await deployer.deploy(Badges, 'Badges', 'BDG')
      let badges = await Badges.deployed()

      // Deploy Metadata.sol
      // -w Badges address
      console.log('deploy Metadata')
      await deployer.deploy(Metadata)
      let metadata = await Metadata.deployed()

      // Update Badges.sol
      // -w Metadata address
      console.log('updateMetadataAddress')
      await badges.updateMetadataAddress(metadata.address)

      // Deploy Controller.sol
      // -w Badges address
      console.log('deploy Controller')
      await deployer.deploy(Controller, badges.address)
      let controller = await Controller.deployed()

      // Update Badges.sol
      // -w Wallet address
      // -w Billy address
      // -w Controller address
      // -w Metadata address
      console.log('updateWalletAddress', accounts[0])
      await badges.updateWalletAddress(accounts[0])
      console.log('updateBillyAddress', billy)
      await badges.updateBillyAddress(billy)
      console.log('updateControllerAddress', controller.address)
      await badges.updateControllerAddress(controller.address)
      console.log('updateMetadataAddress', metadata.address)
      await badges.updateMetadataAddress(metadata.address)
    } catch (error) {
      console.log(error)
    }
  })
}
