let { networkConfig, developmentChains } = require("../helper.config.js")
let { verify } = require("../utils/verify")

require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts() // it will tell the who is going to deploy the contract
    const chainId = await getChainId()

    log("---------------- PTNFTMarketPlace ----------------")

    log("Network is detected to be mock")
    const PTNFTMarketPlace = await deploy("PTNFTMarketPlace", {
        from: deployer,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(
        `PTNFT MarketPlace contract is deployed on local network to ${PTNFTMarketPlace.address} ${chainId}`
    )

    if (!developmentChains.includes(network.name) && process.env.ETHERSCANAPIKEY) {
        await verify(PTNFTMarketPlace.address, [])
    }
}
module.exports.tags = ["market", "all"]
