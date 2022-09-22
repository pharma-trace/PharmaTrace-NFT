let { networkConfig, developmentChains } = require("../helper.config.js")
let { verify } = require("../utils/verify")

require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts() // it will tell the who is going to deploy the contract
    const chainId = await getChainId()

    log("---------------- PTToken ----------------")

    log("Network is detected to be mock")
    const PTToken = await deploy("PTToken", {
        from: deployer,
        log: true,
        args: [100000, "PT Token", "PTT"],
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`PTNFT MarketPlace contract is deployed on local network to ${PTToken.address} ${chainId}`)

    if (!developmentChains.includes(network.name) && process.env.ETHERSCANAPIKEY) {
        await verify(PTToken.address, [100000, "PT Token", "PTT"])
    }
}
module.exports.tags = ["token", "all"]
