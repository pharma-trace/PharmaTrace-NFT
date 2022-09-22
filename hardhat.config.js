/** @type import('hardhat/config').HardhatUserConfig */

require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

var {
    PROVIDER_REN_URL,
    PRIVATE_KEY,
    ETHERSCANAPIKEY,
    PROVIDER_hardhate_URL,
    PRIVATE_KEY_HARDHAT,
    USER2_PRIVATE_KEY,
    COINMARKETCAP_API_KEY,
} = process.env

module.exports = {
    networks: {
        hardhat: {},
        goerli: {
            url: PROVIDER_REN_URL,
            chainId: 5,
            accounts: [`${PRIVATE_KEY}`, `${USER2_PRIVATE_KEY}`],
            blockConfirmations: 6,
        },
        localhost: {
            url: PROVIDER_hardhate_URL,
            chainId: 31337,
            allowUnlimitedContractSize: true,
            blockGasLimit: 10000000042972011111, // whatever you want here

            // accounts: [`${PRIVATE_KEY_HARDHAT}`], // it will import default by hardhat
        },
    },
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    // solidity: {
    //     compilers: [
    //         {
    //             version: "0.8.9",
    //         },
    //     ],
    //     settings: {
    //         optimizer: {
    //             enabled: true,
    //             runs: 200,
    //         },
    //     },
    //     contractSizer: {
    //         alphaSort: true,
    //         runOnCompile: true,
    //         disambiguatePaths: false,
    //     },
    // },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        redeemer: {
            default: 1,
            2: 1, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        // this is used to verify the contract
        apiKey: ETHERSCANAPIKEY,
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
    },
}
