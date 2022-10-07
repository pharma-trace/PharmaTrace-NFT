import { assert, expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { IERC165__factory, IERC721__factory, PTCollection } from "../typechain-types";
import { deployPTCollection, createVoucher, getInterfaceID } from "../instructions";
import { NFTVoucherStruct } from "../typechain-types/contracts/core/PTCollection";
import { ZERO_ADDRESS } from "./constants";

const PRINT_LOG = false;

describe("PTCollection", async function () {
  let admin: Signer, virtualMarket: Signer, userA: Signer, userB: Signer;
  let ptCollection: PTCollection;
  let voucher: NFTVoucherStruct;

  const COLLECTION_SIGNING_DOMAIN = "PT-Voucher";
  const COLLECTION_SIGNATURE_VERSION = "1";
  const NFT_URI = "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC";
  const MIN_PRICE = ethers.utils.parseEther("10");

  before(async () => {
    [admin, virtualMarket, userA, userB] = await ethers.getSigners(); // could also do with getNamedAccounts
    ptCollection = await deployPTCollection(
      await virtualMarket.getAddress(),
      "Pharma Trace",
      "PTNFT",
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    );
    voucher = (await createVoucher(
      ptCollection,
      userA,
      BigNumber.from(1),
      NFT_URI,
      ZERO_ADDRESS,
      MIN_PRICE,
      false,
      COLLECTION_SIGNING_DOMAIN,
      COLLECTION_SIGNATURE_VERSION,
    )) as NFTVoucherStruct;
  });

  describe("PTCollection.redeem", async function () {
    it("Unallowed user", async function () {
      await expect(ptCollection.connect(userA).redeem(await userB.getAddress(), voucher)).to.be.revertedWithCustomError(
        ptCollection,
        "PTCollection__OnlyMarketPlace",
      );
    });
    it("Check verifySignature", async function () {
      const signer = await ptCollection.verifySignature(voucher);
      assert(signer === (await userA.getAddress()));
    });
    it("Successful Redeem", async function () {
      await expect(ptCollection.connect(virtualMarket).redeem(await userA.getAddress(), voucher)).to.emit(
        ptCollection,
        "RedeemVoucher",
      );
    });
  });

  describe("PTCollection.supportsInterface", async function () {
    it("Check supportsInterface for IERC165", async function () {
      const interfaceIdIERC165 = getInterfaceID(IERC165__factory.createInterface());
      const supportsInterface = await ptCollection.supportsInterface(interfaceIdIERC165._hex);
      assert(supportsInterface);
    });
    it("Check supportsInterface for invalid", async function () {
      const supportsInterface = await ptCollection.supportsInterface("0x12345678");
      assert(!supportsInterface);
    });
  });
});
