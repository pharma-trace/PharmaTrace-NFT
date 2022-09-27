let { networkConfig, developmentChains } = require("../helper.config.js")
let { verify } = require("../utils/verify")

require("dotenv").config()
const FUND_AMOUNT = "1000000000000000000000"

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts() // it will tell the who is going to deploy the contract
    const chainId = await getChainId()

    log("------------- PH LAZZ NFT Contract -------------------")

    var ptNFTMarketPlaceAddress
    const SIGNING_DOMAIN_NAME = "PT-Voucher"
    const SIGNING_DOMAIN_VERSION = "1"

    const PTNFTMarketPlace = await ethers.getContract("PTNFTMarketPlace")
    ptNFTMarketPlaceAddress = PTNFTMarketPlace.address

    console.log("ptNFTAddress", ptNFTMarketPlaceAddress)

    const ptNFT = await deploy("PTNFT", {
        from: deployer,
        args: [
            ptNFTMarketPlaceAddress,
            "PhramaTrace",
            "PTNFT",
            SIGNING_DOMAIN_NAME,
            SIGNING_DOMAIN_VERSION,
        ],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`PharmaTrace NFT contract is deployed on local network to ${ptNFT.address} ${chainId}`)

    log(`ptNFTMarketPlaceAddress  in marketplace  ${ptNFTMarketPlaceAddress} `)

    var transationResponse = await PTNFTMarketPlace.setNftContractAddress(ptNFT.address)
    var reseipt = await transationResponse.wait(1)
    transationResponse = await PTNFTMarketPlace.getNftContractAddress()

    log("Logging storage...")
    for (let i = 0; i < 11; i++) {
        log(`Location ${i}: ${await ethers.provider.getStorageAt(PTNFTMarketPlace.address, i)}`)
    }
    log(`You've made an NFT `, JSON.stringify(transationResponse))
    if (!developmentChains.includes(network.name) && process.env.ETHERSCANAPIKEY) {
        await verify(ptNFT.address, [
            ptNFTMarketPlaceAddress,
            "PhramaTrace",
            "PTNFT",
            SIGNING_DOMAIN_NAME,
            SIGNING_DOMAIN_VERSION,
        ])
    }
}
module.exports.tags = ["nft", "all"]
