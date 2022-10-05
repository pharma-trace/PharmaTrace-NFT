import { ethers } from "hardhat";
import * as fs from "fs";

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
  
  let ptTokenAddress: string = ADDRESSES.PTToken;
  let ptMarketAddress: string = ADDRESSES.PTMarket;
  let ptCollectionAddress: string = ADDRESSES.PTCollection;

  if (false) {
    PRINT_LOG && console.log("Deploying PTToken ...");
    const ptTokenFactory = await ethers.getContractFactory("PTToken");
    const ptToken = await ptTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_INITIAL_SUPPLY);
    PRINT_LOG && console.log("\t deployed to", ptToken.address);
    ptTokenAddress = ptToken.address;
  }

  if (false) {
    PRINT_LOG && console.log("Deploying PTMarket ...");
    const ptMarketFactory = await ethers.getContractFactory("PTMarket");
    const ptMarket = await ptMarketFactory.deploy();
    PRINT_LOG && console.log("\t deployed to", ptMarket.address);
    ptMarketAddress = ptMarket.address;
  }

  if (false) {
    PRINT_LOG && console.log("Deploying PTCollection ...");
    const ptCollectionFactory = await ethers.getContractFactory("PTCollection");
    const ptCollection = await ptCollectionFactory.deploy(
      ptMarketAddress,
      COLLECTION_NAME,
      COLLECTION_SYMBOL,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION
    );
    PRINT_LOG && console.log("\t deployed to", ptCollection.address);
    ptCollectionAddress = ptCollection.address;
  }

  const addresses = {
    PTToken: ptTokenAddress,
    PTMarket: ptMarketAddress,
    PTCollection: ptCollectionAddress
  };

  fs.writeFileSync(ADDRESS_PATH, JSON.stringify(addresses, null, 4), "utf8");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

