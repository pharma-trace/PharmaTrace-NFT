import { ethers } from "hardhat";
import { assert, expect } from "chai";
import * as fs from "fs";

import { ADDRESS_PATH } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { createVoucher, DENOMINATOR } from "../instructions";
import { BigNumber, Signer } from "ethers";
import { NFTVoucherStruct } from "../typechain-types/contracts/core/PTCollection";
import { ZERO_ADDRESS } from "../test/constants";
const ADDRESSES = require("../" + ADDRESS_PATH);

const PRINT_LOG = true;

async function main() {
  const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
  const COLLECTION_SIGNATURE_VERSION = "1";
  const NFT_URI = "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC";
  const DECIMALS = 18;
  const MIN_PRICE = ethers.utils.parseEther("0.1");
  const OFFER_PRICE = ethers.utils.parseEther("0.11");
  const EXPIRES_AT = 1;
  let tokenIdNonce = BigNumber.from(8);

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

  console.log("Step 1. Prepare Contracts and accounts");
  const ptMarket = await ethers.getContractAt("PTMarket", ADDRESSES.PTMarket);
  const ptCollection = await ethers.getContractAt("PTCollection", ADDRESSES.PTCollection);
  const ptToken = await ethers.getContractAt("PTToken", ADDRESSES.PTToken);
  const [admin, userA, userB, userC] = await ethers.getSigners();

  console.log("Step 2. Whitelist Currency and Collection");
  await expect(ptMarket.connect(admin).whitelistCurrency(ptToken.address, true)).to.emit(
    ptMarket,
    "CurrencyWhitelisted",
  );
  await expect(ptMarket.connect(admin).whitelistCollection(ptCollection.address)).to.emit(
    ptMarket,
    "CollectionWhitelisted",
  );
  assert(await ptMarket.currencyList(ptToken.address));

  console.log("Step 3. Create voucher");
  let voucher = await createNewVoucher(userA, ZERO_ADDRESS, MIN_PRICE, false);

  console.log("Step 4. Create Lazz Offer");
  await expect(
    ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher, OFFER_PRICE, {
      value: OFFER_PRICE,
    }),
  )
    .to.emit(ptMarket, "OfferCreated")
    .to.emit(ptMarket, "VoucherWritten")
    .changeEtherBalances([ptMarket, userB], [OFFER_PRICE, OFFER_PRICE.mul(-1)]);

  console.log("Step 5. Withdraw Offer");
  await expect(ptMarket.connect(userB).withdrawOffer(ptCollection.address, voucher.tokenId))
    .to.emit(ptMarket, "OfferWithdrawn")
    .changeEtherBalances([ptMarket, userB], [OFFER_PRICE.mul(-1), OFFER_PRICE]);

  console.log("Step 6. Create Lazz Offer overwriting");
  await expect(
    ptMarket.connect(userB).createLazzOffer(ptCollection.address, voucher, OFFER_PRICE, {
      value: OFFER_PRICE,
    }),
  )
    .to.emit(ptMarket, "OfferCreated")
    .changeEtherBalances([ptMarket, userB], [OFFER_PRICE, OFFER_PRICE.mul(-1)]);
  const priceOverwrite = OFFER_PRICE.add(1);
  await expect(
    ptMarket.connect(userC).createLazzOffer(ptCollection.address, voucher, priceOverwrite, {
      value: priceOverwrite,
    }),
  )
    .to.emit(ptMarket, "OfferCreated")
    .to.changeEtherBalances(
      [ptMarket, userB, userC],
      [priceOverwrite.sub(OFFER_PRICE), OFFER_PRICE, priceOverwrite.mul(-1)],
    );

  console.log("Step 7. Accept Lazz Offer");
  let expectedFee = priceOverwrite.mul(await ptMarket.feePercent()).div(DENOMINATOR);
  await expect(ptMarket.connect(userA).acceptOffer(ptCollection.address, voucher.tokenId, true))
    .to.emit(ptMarket, "TradeExecuted")
    .to.emit(ptMarket, "OfferAccepted")
    .to.changeEtherBalances(
      [ptMarket, admin, userA],
      [priceOverwrite.mul(-1), expectedFee, priceOverwrite.sub(expectedFee)],
    );

  console.log("Step 8. List Item");
  await expect(ptCollection.connect(userC).approve(ptMarket.address, voucher.tokenId)).to.emit(
    ptCollection,
    "Approval",
  );
  await expect(
    ptMarket
      .connect(userC)
      .listItem(ptCollection.address, voucher.tokenId, ptToken.address, MIN_PRICE, EXPIRES_AT, false),
  ).to.emit(ptMarket, "ItemListed");

  console.log("Step 9. Unlist Item");
  await expect(ptMarket.connect(userC).unlistItem(ptCollection.address, voucher.tokenId)).to.emit(
    ptMarket,
    "ItemUnlisted",
  );

  console.log("Step 10. Create Offer");
  await expect(ptCollection.connect(userC).approve(ptMarket.address, voucher.tokenId)).to.emit(
    ptCollection,
    "Approval",
  );
  await expect(
    ptMarket
      .connect(userC)
      .listItem(ptCollection.address, voucher.tokenId, ptToken.address, MIN_PRICE, EXPIRES_AT, false),
  ).to.emit(ptMarket, "ItemListed");

  await expect(ptToken.connect(admin).transfer(await userA.getAddress(), OFFER_PRICE)).to.emit(ptToken, "Transfer");
  await expect(ptToken.connect(userA).approve(ptMarket.address, OFFER_PRICE)).to.emit(ptToken, "Approval");
  await expect(ptMarket.connect(userA).createOffer(ptCollection.address, voucher.tokenId, OFFER_PRICE)).to.emit(
    ptMarket,
    "OfferCreated",
  );
  // .to.changeTokenBalances(ptToken, [ptMarket, userA], [OFFER_PRICE, OFFER_PRICE.mul(-1)]);

  console.log("Step 11. Accept Offer");
  expectedFee = OFFER_PRICE.mul(await ptMarket.feePercent()).div(DENOMINATOR);
  await expect(ptMarket.connect(userC).acceptOffer(ptCollection.address, voucher.tokenId, true))
    .to.emit(ptMarket, "TradeExecuted")
    .to.emit(ptMarket, "OfferAccepted");
  // .to.changeTokenBalances(ptToken, [ptMarket, admin, userC], [OFFER_PRICE.mul(-1), expectedFee, OFFER_PRICE.sub(expectedFee)]);
  assert((await ptCollection.ownerOf(voucher.tokenId)).toLowerCase() === (await userA.getAddress()).toLowerCase());

  console.log("Step 12. Buy Lazz NFT with Fixed Price");
  voucher = await createNewVoucher(userA, ZERO_ADDRESS, MIN_PRICE, true);
  expectedFee = MIN_PRICE.mul(await ptMarket.feePercent()).div(DENOMINATOR);
  await expect(
    ptMarket.connect(userB).buyLazzNFT(ptCollection.address, voucher, {
      value: MIN_PRICE,
    }),
  )
    .to.emit(ptMarket, "VoucherWritten")
    .to.emit(ptMarket, "ItemBought")
    .to.emit(ptMarket, "TradeExecuted")
    .to.changeEtherBalances([admin, userA, userB], [expectedFee, MIN_PRICE.sub(expectedFee), MIN_PRICE.mul(-1)]);
  assert((await ptCollection.ownerOf(voucher.tokenId)).toLowerCase() === (await userB.getAddress()).toLowerCase());

  console.log("Step 13. Unwhitelist Currency");
  await expect(ptMarket.connect(admin).whitelistCurrency(ptToken.address, false)).to.emit(
    ptMarket,
    "CurrencyWhitelisted",
  );
  assert(!(await ptMarket.connect(admin).currencyList(ptToken.address)));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
