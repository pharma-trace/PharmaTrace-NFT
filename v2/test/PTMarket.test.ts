import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { MockToken, PTCollection, PTMarket } from "../typechain-types";
import { deployPTCollection, deployPTMarket, createVoucher, deployMockToken } from "../instructions";
import { NFTVoucherStruct } from "../typechain-types/contracts/core/PTCollection";
import { ZERO_ADDRESS } from "./constants";

const PRINT_LOG = false;

describe("PTMarket", async function () {
  let admin: Signer, userA: Signer, userB: Signer, userC: Signer;
  let ptMarket: PTMarket;
  let ptCollection: PTCollection;
  let voucher: NFTVoucherStruct;
  let mockToken: MockToken;

  const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
  const COLLECTION_SIGNATURE_VERSION = "1";
  const NFT_URI = "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC";
  const MINT_AMOUNT = ethers.utils.parseEther("100");
  const DECIMALS = 18;
  const MIN_PRICE = ethers.utils.parseEther("10");

  before(async () => {
    [admin, userA, userB, userC] = await ethers.getSigners(); // could also do with getNamedAccounts
    ptMarket = await deployPTMarket();
    ptCollection = await deployPTCollection(
      ptMarket.address,
      "Pharma Trace",
      "PTNFT",
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    mockToken = await deployMockToken("Mock Token", "MOCK", DECIMALS);
    voucher = await createVoucher(
      ptCollection,
      userA,
      BigNumber.from(1),
      NFT_URI,
      ZERO_ADDRESS,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    await mockToken.mintTo(await userA.getAddress(), MINT_AMOUNT);
    await mockToken.mintTo(await userB.getAddress(), MINT_AMOUNT);
    await mockToken.mintTo(await userC.getAddress(), MINT_AMOUNT);
  });

  describe("MockToken", async function () {
    it("Check decimals", async function () {
      const decimals = await mockToken.decimals();
      assert(decimals === DECIMALS);
    });
    it("Non-onwer's mintTo failing", async function () {
      await expect(mockToken.connect(userA).mintTo(await userA.getAddress(), MINT_AMOUNT)).to.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });

  describe("whitelistCurrency", async function () {
    it("whitelist Currency", async function () {
      await expect(ptMarket.whitelistCurrency(mockToken.address, true)).to.emit(ptMarket, "CurrencyWhitelisted");
      assert(await ptMarket.currencyList(mockToken.address));
    });
    it("unwhitelist Currency", async function () {
      await expect(ptMarket.whitelistCurrency(mockToken.address, false)).to.emit(ptMarket, `CurrencyWhitelisted`);
      assert(!(await ptMarket.currencyList(mockToken.address)));
    });
  });

  describe("listItem", async function () {
    it("listItem with unsupported token", async function () {
      await expect(ptMarket.listItem(ptCollection.address, 1, mockToken.address, MIN_PRICE, 1, false)).to.revertedWith(
        "Unsupported token",
      );
    });
    describe("listItem with supported token", async function () {
      before(async () => {
        await ptMarket.whitelistCurrency(mockToken.address, true);
      });
      it("listItem with zero price", async function () {
        await expect(ptMarket.listItem(ptCollection.address, 1, mockToken.address, 0, 1, false)).to.revertedWith(
          "Listed price should be greater then zero",
        );
      });
      it("listItem with zero expiry in auction mode", async function () {
        await expect(ptMarket.listItem(ptCollection.address, 1, mockToken.address, 1, 0, false)).to.revertedWith(
          "expiresAt should not be zero in auction mode",
        );
      });
    });
  });
});
