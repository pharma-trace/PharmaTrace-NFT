import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { MockToken, PTCollection, PTMarket } from "../typechain-types";
import { deployPTCollection, deployPTMarket, createVoucher, deployMockToken, selfTrade } from "../instructions";
import { NFTVoucherStruct } from "../typechain-types/contracts/core/PTCollection";
import { ZERO_ADDRESS } from "./constants";

const PRINT_LOG = false;

describe("PTMarket", async function () {
  let admin: Signer, userA: Signer, userB: Signer, userC: Signer;
  let ptMarket: PTMarket;
  let ptCollection: PTCollection;
  let voucher0: NFTVoucherStruct, voucher1: NFTVoucherStruct, unsupportedVoucher: NFTVoucherStruct;
  let mockToken: MockToken, unsupportedToken: MockToken;
  let tokenIdNonce = BigNumber.from(0);

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
      tokenIdNonce,
      NFT_URI,
      ZERO_ADDRESS,
      MIN_PRICE,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    tokenIdNonce = tokenIdNonce.add(1);
    voucher1 = await createVoucher(
      ptCollection,
      userA,
      tokenIdNonce,
      NFT_URI,
      mockToken.address,
      MIN_PRICE,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    tokenIdNonce = tokenIdNonce.add(1);
    unsupportedVoucher = await createVoucher(
      ptCollection,
      userA,
      tokenIdNonce,
      NFT_URI,
      unsupportedToken.address,
      MIN_PRICE,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    tokenIdNonce = tokenIdNonce.add(1);

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
    it("whitelistCurrency with non-owner", async function () {
      await expect(ptMarket.connect(userA).whitelistCurrency(mockToken.address, true)).to.rejectedWith(
        "Ownable: caller is not the owner",
      );
    });
    it("whitelistCurrency", async function () {
      await expect(ptMarket.whitelistCurrency(mockToken.address, true)).to.emit(ptMarket, "CurrencyWhitelisted");
      assert(await ptMarket.currencyList(mockToken.address));
    });
    it("unwhitelistCurrency", async function () {
      await expect(ptMarket.whitelistCurrency(mockToken.address, false)).to.emit(ptMarket, `CurrencyWhitelisted`);
      assert(!(await ptMarket.currencyList(mockToken.address)));

      await ptMarket.whitelistCurrency(mockToken.address, true);
    });
  });

  describe("createLazzOffer", async function () {
    it("createLazzOffer with unsupported token", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, unsupportedVoucher, OFFER_PRICE),
      ).to.revertedWith("Unsupported token");
    });
    it("createLazzOffer without eth", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE),
      ).to.revertedWith("Insufficient eth value");
    });
    it("createLazzOffer without token approve", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher1, OFFER_PRICE),
      ).to.revertedWith("ERC20: insufficient allowance");
    });
    it("createLazzOffer overwrite with zero price", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher0, 0),
      ).to.revertedWithCustomError(ptMarket, "PTMarket__LowerPriceThanPrevious");
    });
    it("createLazzOffer overwrite with lower price than previous", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE, {
          value: OFFER_PRICE,
        }),
      )
        .to.emit(ptMarket, "OfferCreated")
        .to.emit(ptMarket, "VoucherWritten");

      await expect(
        ptMarket.connect(userC).createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE, {
          value: OFFER_PRICE,
        }),
      ).to.revertedWithCustomError(ptMarket, "PTMarket__LowerPriceThanPrevious");
    });
    it("createLazzOffer overwrite", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher0, OFFER_PRICE, {
          value: OFFER_PRICE,
        }),
      )
        .to.emit(ptMarket, "OfferCreated")
        .to.emit(ptMarket, "VoucherWritten");
      const priceOverwrite = OFFER_PRICE.add(1);
      await expect(
        ptMarket.connect(userC).createLazzOffer(ptCollection.address, voucher0, priceOverwrite, {
          value: priceOverwrite,
        }),
      ).to.emit(ptMarket, "OfferCreated");
    });
    afterEach(async () => {
      try {
        await ptMarket.connect(userB).withdrawOffer(ptCollection.address, voucher0.tokenId);
      } catch {}
    });
  });
  describe("acceptOffer", async function () {
    it("acceptOffer with unoffered item", async function () {
      await expect(
        ptMarket.connect(userB).acceptOffer(ptCollection.address, tokenIdNonce.add(1), true),
      ).to.rejectedWith("Such offer doesn't exist");
    });
    describe("accept LazzOffer", async function () {
      let voucher: NFTVoucherStruct;
      beforeEach(async () => {
        voucher = await createVoucher(
          ptCollection,
          userA,
          tokenIdNonce,
          NFT_URI,
          ZERO_ADDRESS,
          MIN_PRICE,
          COLLECTION_SIGNING_DOMAIN,
          COLLECTION_SIGNATURE_VERSION,
        );
        tokenIdNonce = tokenIdNonce.add(1);
        await ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher, OFFER_PRICE, {
          value: OFFER_PRICE,
        });
      });
      it("accept LazzOffer with non-seller item", async function () {
        await expect(
          ptMarket.connect(userC).acceptOffer(ptCollection.address, voucher.tokenId, true),
        ).to.revertedWithCustomError(ptMarket, "PTMarket__NotSeller");
      });
      // TODO:
      // it("accept LazzOffer with unapproved NFT", async function () {
      //   await ptCollection.connect(userA).approve(await userC.getAddress(), voucher.tokenId);
      //   await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, voucher.tokenId, true)).to.rejectedWith(
      //     "Collection is not approved to the market",
      //   );
      // });
      it("accept LazzOffer success", async function () {
        await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, voucher.tokenId, true))
          .to.emit(ptMarket, "TradeExecuted")
          .to.emit(ptMarket, "OfferAccepted");
      });
      it("reject LazzOffer success", async function () {
        await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, voucher.tokenId, false)).to.emit(
          ptMarket,
          "OfferRejected",
        );
      });
      afterEach(async () => {
        try {
          await ptMarket.connect(userB).withdrawOffer(ptCollection.address, voucher.tokenId);
        } catch {}
      });
    });
    describe("accept normal Offer", async function () {});
  });

  describe("listItem", async function () {
    before(async () => {
      await selfTrade(ptMarket, userA, voucher0);
      await selfTrade(ptMarket, userA, voucher1);
    });
    it("listItem with unsupported token", async function () {
      await expect(
        ptMarket.listItem(ptCollection.address, 1, unsupportedToken.address, MIN_PRICE, 1, false),
      ).to.revertedWith("Unsupported token");
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
