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
  let voucher0: NFTVoucherStruct, voucher1: NFTVoucherStruct, unsupportedVoucher: NFTVoucherStruct;
  let mockToken: MockToken, unsupportedToken: MockToken;

  const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
  const COLLECTION_SIGNATURE_VERSION = "1";
  const NFT_URI = "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC";
  const MINT_AMOUNT = ethers.utils.parseEther("100");
  const DECIMALS = 18;
  const MIN_PRICE = ethers.utils.parseEther("10");
  const OFFER_PRICE = ethers.utils.parseEther("11");

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
    unsupportedToken = await deployMockToken("Unsupported Token", "INVALID", DECIMALS);
    voucher0 = await createVoucher(
      ptCollection,
      userA,
      BigNumber.from(1),
      NFT_URI,
      ZERO_ADDRESS,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    voucher1 = await createVoucher(
      ptCollection,
      userA,
      BigNumber.from(1),
      NFT_URI,
      mockToken.address,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    unsupportedVoucher = await createVoucher(
      ptCollection,
      userA,
      BigNumber.from(1),
      NFT_URI,
      unsupportedToken.address,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );

    await mockToken.mintTo(await userA.getAddress(), MINT_AMOUNT);
    await mockToken.mintTo(await userB.getAddress(), MINT_AMOUNT);
    await mockToken.mintTo(await userC.getAddress(), MINT_AMOUNT);
    
    await ptMarket.whitelistCurrency(mockToken.address, true);
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
    
      await ptMarket.whitelistCurrency(mockToken.address, true);
    });
  });

  describe("listItem", async function () {
    it("listItem with unsupported token", async function () {
      await expect(ptMarket.listItem(ptCollection.address, 1, unsupportedToken.address, MIN_PRICE, 1, false)).to.revertedWith(
        "Unsupported token",
      );
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

  describe("createLazzOffer", async function () {
    it("createLazzOffer with unsupported token", async function () {
      await expect(ptMarket.createLazzOffer(ptCollection.address, unsupportedVoucher, OFFER_PRICE)).to.revertedWith(
        "Unsupported token",
      );
    });
    it("createLazzOffer without eth", async function () {
      await expect(ptMarket.createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE)).to.revertedWith(
        "Insufficient eth value",
      );
    });
    it("createLazzOffer without token approve", async function () {
      await expect(ptMarket.createLazzOffer(ptCollection.address, voucher1, OFFER_PRICE)).to.revertedWith(
        "ERC20: insufficient allowance",
      );
    });

    it("createLazzOffer overriding with zero price", async function () {
      await expect(ptMarket.connect(userA).createLazzOffer(ptCollection.address, voucher0, 0)).to.emit(
        ptMarket,
        "OfferCreated"
      ).to.revertedWithCustomError(
        ptMarket,
        "PTMarket__LowerPriceThanPrevious"
      );
    });

    it("createLazzOffer overriding with lower price than previous", async function () {
      await expect(ptMarket.connect(userA).createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE, {
        value: OFFER_PRICE
      })).to.emit(
        ptMarket,
        "OfferCreated"
      ).to.emit(
        ptMarket,
        "VoucherWritten"
      );
      
      await expect(ptMarket.connect(userA).createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE, {
        value: OFFER_PRICE
      })).to.revertedWithCustomError(
        ptMarket,
        "PTMarket__LowerPriceThanPrevious"
      );
    });
  });
});
