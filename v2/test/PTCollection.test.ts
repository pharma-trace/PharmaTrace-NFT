import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { PTCollection } from "../typechain-types";
import { deployPTCollection, createVoucher } from "../instructions";
import { NFTVoucherStruct } from "../typechain-types/contracts/core/PTCollection";
import { ZERO_ADDRESS } from "./constants";

const PRINT_LOG = false;

describe("PTCollection", async function () {
  let admin: Signer, virtualMarket: Signer, userA: Signer;
  let ptCollection: PTCollection;
  let voucher: NFTVoucherStruct;
  let signature: string;

  const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
  const COLLECTION_SIGNATURE_VERSION = "1";
  const NFT_URI = "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC";

  before(async () => {
    [admin, virtualMarket, userA] = await ethers.getSigners(); // could also do with getNamedAccounts
    ptCollection = await deployPTCollection(
      await virtualMarket.getAddress(),
      "Pharma Trace",
      "PTNFT",
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION
    );
    voucher = await createVoucher(ptCollection, userA, 1, NFT_URI, ZERO_ADDRESS,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION
    );
  });

  describe("PTCollection.redeem", async function () {
    it("Unallowed user", async function () {
      // await expect(ptCollection.connect(userA).redeem()).to.be.revertedWithCustomError(
      //   ptCollection,
      //   "PTCollection__OnlyMarketPlace",
      // );
    });
  });
});
