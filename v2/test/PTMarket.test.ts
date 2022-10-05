import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { PTCollection, PTMarket } from "../typechain-types";
import { deployPTCollection, deployPTMarket } from "../instructions";

const PRINT_LOG = false;

describe("PTMarket", async function () {
  let admin: Signer, userA: Signer, userB: Signer, userC: Signer;
  let ptMarket: PTMarket;
  let ptCollection: PTCollection;

  before(async () => {
    [admin, userA, userB, userC] = await ethers.getSigners(); // could also do with getNamedAccounts
    ptMarket = await deployPTMarket();
    ptCollection = await deployPTCollection(ptMarket.address, "Pharma Trace", "PTNFT", "PT-Voucher", "1");
  });

  describe("  ", async function () {
    // it("  ", async function () {
    // });
  });
});
