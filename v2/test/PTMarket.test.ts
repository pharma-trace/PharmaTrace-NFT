import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { MockToken, PTCollection, PTMarket } from "../typechain-types";
import {
  deployPTCollection,
  deployPTMarket,
  createVoucher,
  deployMockToken,
  selfTrade,
  DENOMINATOR,
} from "../instructions";
import { NFTVoucherStruct } from "../typechain-types/contracts/core/PTCollection";
import { ZERO_ADDRESS } from "./constants";

const PRINT_LOG = false;

describe("PTMarket", async function () {
  let admin: Signer, userA: Signer, userB: Signer, userC: Signer;
  let ptMarket: PTMarket;
  let ptCollection: PTCollection;
  let mockToken: MockToken, unsupportedToken: MockToken;
  let tokenIdNonce = BigNumber.from(1);

  const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
  const COLLECTION_SIGNATURE_VERSION = "1";
  const NFT_URI = "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC";
  const MINT_AMOUNT = ethers.utils.parseEther("100");
  const DECIMALS = 18;
  const MIN_PRICE = ethers.utils.parseEther("10");
  const OFFER_PRICE = ethers.utils.parseEther("11");

  const createNewVoucher = async (user: Signer, currency: string, minPrice: BigNumber, isFixedPrice: Boolean) => {
    tokenIdNonce = tokenIdNonce.add(1);
    return (await createVoucher(
      ptCollection,
      user,
      tokenIdNonce,
      NFT_URI,
      currency,
      minPrice,
      isFixedPrice,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    )) as NFTVoucherStruct;
  };

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
    let voucher0: NFTVoucherStruct,
      voucher1: NFTVoucherStruct,
      voucher2: NFTVoucherStruct,
      unsupportedVoucher: NFTVoucherStruct;
    before(async () => {
      voucher0 = await createNewVoucher(userA, ZERO_ADDRESS, MIN_PRICE, false);
      voucher1 = await createNewVoucher(userA, mockToken.address, MIN_PRICE, false);
      voucher2 = await createNewVoucher(userA, mockToken.address, MIN_PRICE, true);
      unsupportedVoucher = await createNewVoucher(userA, unsupportedToken.address, MIN_PRICE, false);
    });
    it("createLazzOffer with unsupported token", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, unsupportedVoucher, OFFER_PRICE),
      ).to.revertedWith("Unsupported token");
    });
    it("createLazzOffer in fixed price mode", async function () {
      await expect(
        ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher2, OFFER_PRICE),
      ).to.revertedWith("This voucher is in fixed price mode");
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

  describe("createOffer", async function () {
    let tokenId: BigNumber;
    before(async () => {
      const voucher: NFTVoucherStruct = await createNewVoucher(userA, ZERO_ADDRESS, BigNumber.from(1), true);
      tokenId = voucher.tokenId as BigNumber;
      await selfTrade(ptMarket, ptCollection, userA, voucher);
    });

    it("createOffer with unlisted item", async function () {
      await expect(ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE)).to.rejectedWith(
        "Such market item doesn't exist",
      );
    });
    // // TODO:
    // it("createOffer after expiry", async function () {
    //
    // });
    it("createOffer if fixed price mode", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, true);
      await expect(ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE)).to.rejectedWith(
        "The item is fixed price mode",
      );
    });
    it("createOffer unapproved NFT", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, false);
      await ptCollection.connect(userA).approve(await userC.getAddress(), tokenId);
      await expect(ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE)).to.rejectedWith(
        "Collection is not approved to the market",
      );
    });
    it("createOffer with lower price than minPrice", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, false);
      await expect(
        ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, MIN_PRICE.sub(1)),
      ).to.revertedWithCustomError(ptMarket, "PTMarket__LowerPriceThanPrevious");
    });
    it("createOffer with same or lower price than previous one", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, false);
      await expect(
        ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE, {
          value: OFFER_PRICE,
        }),
      ).to.emit(ptMarket, "OfferCreated");
      await expect(
        ptMarket.connect(userC).createOffer(ptCollection.address, tokenId, OFFER_PRICE),
      ).to.revertedWithCustomError(ptMarket, "PTMarket__LowerPriceThanPrevious");
    });
    it("createOffer with token", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false);
      await mockToken.mintTo(await userB.getAddress(), MINT_AMOUNT);

      await mockToken.connect(userB).approve(ptMarket.address, OFFER_PRICE);
      const balanceMarketBefore = await mockToken.balanceOf(ptMarket.address);
      await expect(ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE)).to.emit(
        ptMarket,
        "OfferCreated",
      );
      const balanceMarketAfter = await mockToken.balanceOf(ptMarket.address);
      assert(balanceMarketAfter.sub(balanceMarketBefore).eq(OFFER_PRICE));
    });
    it("createOffer with eth", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, false);
      const balanceMarketBefore = await ethers.provider.getBalance(ptMarket.address);
      await expect(
        ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE, {
          value: OFFER_PRICE,
        }),
      ).to.emit(ptMarket, "OfferCreated");
      const balanceMarketAfter = await ethers.provider.getBalance(ptMarket.address);
      assert(balanceMarketAfter.sub(balanceMarketBefore).eq(OFFER_PRICE));
    });
    it("createOffer overwrite with token", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false);
      await mockToken.mintTo(await userB.getAddress(), MINT_AMOUNT);
      await mockToken.mintTo(await userC.getAddress(), MINT_AMOUNT);

      await mockToken.connect(userB).approve(ptMarket.address, OFFER_PRICE);
      await expect(ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE)).to.emit(
        ptMarket,
        "OfferCreated",
      );

      const overwritePrice = OFFER_PRICE.add(1);
      await mockToken.connect(userC).approve(ptMarket.address, overwritePrice);
      await expect(ptMarket.connect(userC).createOffer(ptCollection.address, tokenId, overwritePrice)).to.emit(
        ptMarket,
        "OfferCreated",
      );
    });
    it("createOffer overwrite with eth", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, false);
      await expect(
        ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE, {
          value: OFFER_PRICE,
        }),
      ).to.emit(ptMarket, "OfferCreated");
      const overwritePrice = OFFER_PRICE.add(1);
      await expect(
        ptMarket.connect(userC).createOffer(ptCollection.address, tokenId, overwritePrice, {
          value: overwritePrice,
        }),
      ).to.emit(ptMarket, "OfferCreated");
    });

    afterEach(async () => {
      try {
        await ptMarket.connect(userA).unlistItem(ptCollection.address, tokenId);
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
        voucher = await createNewVoucher(userA, ZERO_ADDRESS, MIN_PRICE, false);
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
    describe("accept normal Offer", async function () {
      let tokenId: BigNumber;
      before(async () => {
        const voucher: NFTVoucherStruct = await createNewVoucher(userA, ZERO_ADDRESS, BigNumber.from(1), true);
        tokenId = voucher.tokenId as BigNumber;
        await selfTrade(ptMarket, ptCollection, userA, voucher);
      });
      beforeEach(async () => {
        await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
        await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, false);
        await ptMarket.connect(userB).createOffer(ptCollection.address, tokenId, OFFER_PRICE, {
          value: OFFER_PRICE,
        });
      });
      it("acceptOffer with unapproved NFT", async function () {
        await ptCollection.connect(userA).approve(await userC.getAddress(), tokenId);
        await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, tokenId, true)).to.rejectedWith(
          "Collection is not approved to the market",
        );
      });
      it("rejectOffer", async function () {
        await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, tokenId, false)).to.emit(
          ptMarket,
          "OfferRejected",
        );
      });
      it("acceptOffer", async function () {
        await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, tokenId, true))
          .to.emit(ptMarket, "TradeExecuted")
          .to.emit(ptMarket, "OfferAccepted");

        await ptCollection.connect(userB).approve(await userA.getAddress(), tokenId);
        await ptCollection.connect(userA).transferFrom(await userB.getAddress(), await userA.getAddress(), tokenId);
      });

      afterEach(async () => {
        try {
          await ptMarket.connect(userA).unlistItem(ptCollection.address, tokenId);
        } catch {}
      });
    });
  });

  describe("listItem", async function () {
    let tokenId: BigNumber;
    before(async () => {
      const voucher: NFTVoucherStruct = await createNewVoucher(userA, ZERO_ADDRESS, BigNumber.from(1), true);
      tokenId = voucher.tokenId as BigNumber;
      await selfTrade(ptMarket, ptCollection, userA, voucher);
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
    it("listItem without approve NFT", async function () {
      await expect(
        ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false),
      ).to.revertedWith("It should be allowed to markeplace");
    });
    it("listItem with non-owner of NFT", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await expect(
        ptMarket.connect(userB).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false),
      ).to.revertedWith("Only owner of NFT will list into market");
    });
    it("listItem in auction mode", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await expect(
        ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false),
      ).to.emit(ptMarket, "ItemListed");
    });
    it("listItem with already listed NFT", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await expect(
        ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false),
      ).to.emit(ptMarket, "ItemListed");
      await expect(
        ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false),
      ).to.rejectedWith("Already listed");
    });
    it("listItem in fixed price mode", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await expect(
        ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 0, true),
      ).to.emit(ptMarket, "ItemListed");
    });

    afterEach(async () => {
      try {
        await ptMarket.connect(userA).unlistItem(ptCollection.address, tokenId);
      } catch {}
    });
  });

  describe("buyItem", async function () {
    let tokenId: BigNumber;
    before(async () => {
      const voucher: NFTVoucherStruct = await createNewVoucher(userA, ZERO_ADDRESS, BigNumber.from(1), true);
      tokenId = voucher.tokenId as BigNumber;
      await selfTrade(ptMarket, ptCollection, userA, voucher);
    });

    it("buyItem with unlisted item", async function () {
      await expect(ptMarket.connect(userB).buyItem(ptCollection.address, tokenId)).to.rejectedWith(
        "Such market item doesn't exist",
      );
    });
    // // TODO:
    // it("buyItem after expiry", async function () {
    //
    // });
    it("buyItem if not fixed price", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, false);
      await expect(ptMarket.connect(userB).buyItem(ptCollection.address, tokenId)).to.rejectedWith(
        "The item is not fixed price mode",
      );
    });
    it("buyItem unapproved NFT", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, true);
      await ptCollection.connect(userA).approve(await userC.getAddress(), tokenId);
      await expect(ptMarket.connect(userB).buyItem(ptCollection.address, tokenId)).to.rejectedWith(
        "Collection is not approved to the market",
      );
    });
    it("buyItem without approve token", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, true);
      await expect(ptMarket.connect(userB).buyItem(ptCollection.address, tokenId)).to.rejectedWith(
        "ERC20: insufficient allowance",
      );
    });
    it("buyItem without put eth", async function () {
      await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
      await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, true);
      await expect(ptMarket.connect(userB).buyItem(ptCollection.address, tokenId)).to.rejectedWith(
        "Insufficient eth value",
      );
    });
    describe("successful buyings", async () => {
      it("buyItem with token", async function () {
        await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
        await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, mockToken.address, MIN_PRICE, 1, true);
        await mockToken.mintTo(await userB.getAddress(), MINT_AMOUNT);

        const balanceBuyerBefore = await mockToken.balanceOf(await userB.getAddress());
        const balanceAdminBefore = await mockToken.balanceOf(await admin.getAddress());
        const balanceSellerBefore = await mockToken.balanceOf(await userA.getAddress());

        await mockToken.connect(userB).approve(ptMarket.address, MIN_PRICE);
        await expect(ptMarket.connect(userB).buyItem(ptCollection.address, tokenId))
          .to.emit(ptMarket, "TradeExecuted")
          .to.emit(ptMarket, "ItemBought");

        const balanceBuyerAfter = await mockToken.balanceOf(await userB.getAddress());
        const balanceAdminAfter = await mockToken.balanceOf(await admin.getAddress());
        const balanceSellerAfter = await mockToken.balanceOf(await userA.getAddress());
        const feePercent = await ptMarket.feePercent();
        const expectedFee = MIN_PRICE.mul(feePercent).div(DENOMINATOR);

        assert(balanceBuyerBefore.sub(balanceBuyerAfter).eq(MIN_PRICE));
        assert(balanceAdminAfter.sub(balanceAdminBefore).eq(expectedFee));
        assert(balanceSellerAfter.sub(balanceSellerBefore).eq(MIN_PRICE.sub(expectedFee)));
      });

      it("buyItem with eth", async function () {
        await ptCollection.connect(userA).approve(ptMarket.address, tokenId);
        await ptMarket.connect(userA).listItem(ptCollection.address, tokenId, ZERO_ADDRESS, MIN_PRICE, 1, true);

        const balanceBuyerBefore = await ethers.provider.getBalance(await userB.getAddress());
        const balanceAdminBefore = await ethers.provider.getBalance(await admin.getAddress());
        const balanceSellerBefore = await ethers.provider.getBalance(await userA.getAddress());

        const tx = ptMarket.connect(userB).buyItem(ptCollection.address, tokenId, {
          value: MIN_PRICE,
        });
        await expect(tx).to.emit(ptMarket, "TradeExecuted").to.emit(ptMarket, "ItemBought");

        const { effectiveGasPrice, gasUsed } = await (await tx).wait();
        const totalGasUsed = gasUsed.mul(effectiveGasPrice);
        const balanceBuyerAfter = await ethers.provider.getBalance(await userB.getAddress());
        const balanceAdminAfter = await ethers.provider.getBalance(await admin.getAddress());
        const balanceSellerAfter = await ethers.provider.getBalance(await userA.getAddress());
        const feePercent = await ptMarket.feePercent();
        const expectedFee = MIN_PRICE.mul(feePercent).div(DENOMINATOR);

        assert(balanceBuyerBefore.sub(totalGasUsed).sub(balanceBuyerAfter).eq(MIN_PRICE));
        assert(balanceAdminAfter.sub(balanceAdminBefore).eq(expectedFee));
        assert(balanceSellerAfter.sub(balanceSellerBefore).eq(MIN_PRICE.sub(expectedFee)));
      });

      afterEach(async () => {
        await ptCollection.connect(userB).approve(await userA.getAddress(), tokenId);
        await ptCollection.connect(userA).transferFrom(await userB.getAddress(), await userA.getAddress(), tokenId);
      });
    });

    afterEach(async () => {
      try {
        await ptMarket.connect(userA).unlistItem(ptCollection.address, tokenId);
      } catch {}
    });
  });

  describe("buyLazzNFT", async function () {
    let voucher0: NFTVoucherStruct, voucher1: NFTVoucherStruct;
    before(async () => {
      voucher0 = await createNewVoucher(userA, ZERO_ADDRESS, MIN_PRICE, false);
      voucher1 = await createNewVoucher(userA, ZERO_ADDRESS, MIN_PRICE, true);
    });
    it("buyLazzNFT in not fixed price mode", async () => {
      await expect(ptMarket.connect(userB).buyLazzNFT(ptCollection.address, voucher0)).to.rejectedWith(
        "This voucher is not in fixed price mode",
      );
    });
    it("buyLazzNFT success", async () => {
      await expect(
        ptMarket.connect(userB).buyLazzNFT(ptCollection.address, voucher1, {
          value: MIN_PRICE,
        }),
      )
        .to.emit(ptMarket, "VoucherWritten")
        .to.emit(ptMarket, "ItemBought")
        .to.emit(ptMarket, "TradeExecuted");
    });
  });

  describe("setFeePercent", async function () {
    it("setFeePercent with non-owner", async function () {
      await expect(ptMarket.connect(userA).setFeePercent(20)).to.rejectedWith("Ownable: caller is not the owner");
    });
    it("setFeePercent", async function () {
      await expect(ptMarket.connect(admin).setFeePercent(20)).to.emit(ptMarket, "FeePercentUpadated");
      assert((await ptMarket.feePercent()).eq(20));
    });
  });
});
