import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { deployPTToken } from "../instructions";
import { PTToken } from "../typechain-types";

const PRINT_LOG = false;

describe("PTToken", async function () {
  let admin: Signer;
  let ptToken: PTToken;

  const TOKEN_DECIMALS = 18;
  const TOKEN_INITIAL_SUPPLY = ethers.utils.parseEther("1000000000");

  before(async () => {
    [admin] = await ethers.getSigners(); // could also do with getNamedAccounts
    ptToken = await deployPTToken("Pharma Trace", "PHT", TOKEN_DECIMALS, TOKEN_INITIAL_SUPPLY);
  });

  it("Check Decimals", async function () {
    assert((await ptToken.decimals()) === TOKEN_DECIMALS);
  });

  it("Check Admin Balance", async function () {
    assert((await ptToken.balanceOf(await admin.getAddress())).eq(TOKEN_INITIAL_SUPPLY));
  });
});
