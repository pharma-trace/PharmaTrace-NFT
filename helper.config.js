const networkConfig = {
    3: {
        name: "ropsten",
    },
    4: {
        name: "goerli",
        etherUSDPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
}

const developmentChains = ["hardhat", "localhost"]

// 0x812F89E73e6C4ce1c68337D9FEB482200D0fC268
// 0x717925D5c09D9f58768c997AB1a829891bBd5039
module.exports = { networkConfig, developmentChains }
