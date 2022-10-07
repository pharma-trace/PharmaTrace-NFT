import { Signer } from "ethers";
import { PTMarket } from "../typechain-types";
import { NFTVoucherStruct, PTCollection } from "../typechain-types/contracts/core/PTCollection";

export async function selfTrade(ptMarket: PTMarket, ptCollection: PTCollection, user: Signer, voucher: NFTVoucherStruct) {
  const signer = await ptCollection.verifySignature(voucher);

  await ptMarket.connect(user).buyLazzNFT(ptCollection.address, voucher, {
    value: voucher.minPrice
  });
}
