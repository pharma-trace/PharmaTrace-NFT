import { artifacts, ethers } from "hardhat";
import * as fs from "fs";

import { deployPTToken, deployPTMarket, deployPTCollection } from "../instructions";
import { ADDRESS_PATH } from "./utils";

const ADDRESSES = require("../" + ADDRESS_PATH);
const PRINT_LOG = true;

// Token deploy param
const TOKEN_NAME = "Pharma Trace";
const TOKEN_SYMBOL = "PHT";
const TOKEN_DECIMALS = 18;
const TOKEN_INITIAL_SUPPLY = ethers.utils.parseEther("1000000000");

// Collection deploy param
const COLLECTION_NAME = "Pharma Trace";
const COLLECTION_SYMBOL = "PTNFT";
const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
const COLLECTION_SIGNATURE_VERSION = "1";

async function main() {
  const accounts = await ethers.getSigners(); // could also do with getNamedAccounts

  if (false) {
    PRINT_LOG && console.log("Deploying PTToken ...");
    const ptToken = await deployPTToken(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_INITIAL_SUPPLY);
    PRINT_LOG && console.log("\t deployed to", ptToken.address);
    ADDRESSES.PTToken = ptToken.address;
  }

  if (true) {
    PRINT_LOG && console.log("Deploying PTMarket ...");
    const ptMarket = await deployPTMarket();
    PRINT_LOG && console.log("\t deployed to", ptMarket.address);
    ADDRESSES.PTMarket = ptMarket.address;
  }

  if (true) {
    PRINT_LOG && console.log("Deploying PTCollection ...");
    const ptCollection = await deployPTCollection(
      ADDRESSES.PTMarket,
      COLLECTION_NAME,
      COLLECTION_SYMBOL,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    const ptMarket = await ethers.getContractAt("PTMarket", ADDRESSES.PTMarket);
    ptMarket.whitelistCollection(ptCollection.address);

    PRINT_LOG && console.log("\t deployed to", ptCollection.address);
    ADDRESSES.PTCollection = ptCollection.address;
  }

  fs.writeFileSync(ADDRESS_PATH, JSON.stringify(ADDRESSES, null, 4), "utf8");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
