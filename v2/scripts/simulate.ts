import { ethers } from "hardhat";
import * as fs from "fs";

import { ADDRESS_PATH } from "./utils";
const ADDRESSES = require("../" + ADDRESS_PATH);

const PRINT_LOG = true;

async function main() {
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

