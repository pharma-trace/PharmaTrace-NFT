let { networkConfig, developmentChains } = require("../helper.config.js")
let { verify } = require("../utils/verify")

require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts() // it will tell the who is going to deploy the contract
    const chainId = await getChainId()

    log("--------------------------------")
    const SIGNING_DOMAIN_NAME = "PT-Voucher"
    const SIGNING_DOMAIN_VERSION = "1"

    log("Network is detected to be mock")
    const ptNFT = await deploy("PTNFT", {
        from: deployer,
        args: [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "PhramaTrace",
            "PTNFT",
            SIGNING_DOMAIN_NAME,
            SIGNING_DOMAIN_VERSION,
        ],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`ptNFT contract is deployed on local network to ${ptNFT.address} ${chainId}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCANAPIKEY) {
        await verify(ptNFT.address, [ethUsdPriceFeedAddress])
    }
}
module.exports.tags = ["nft", "all"]
