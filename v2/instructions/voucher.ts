import { VoidSigner } from "@ethersproject/abstract-signer";
import { BigNumber, Signer } from "ethers";
import { PTCollection } from "../typechain-types";

export async function createVoucher(
  ptCollection: PTCollection,
  signer: Signer,
  tokenId: BigNumber,
  uri: string,
  currency: string,
  signingDomain: string,
  signatureVersion: string,
) {
  const voucher = { tokenId, uri, currency };
  const chainId = (await ptCollection.provider.getNetwork()).chainId;
  const domain = {
    name: signingDomain,
    version: signatureVersion,
    verifyingContract: ptCollection.address,
    chainId,
  };
  const types = {
    NFTVoucher: [
      { name: "tokenId", type: "uint256" },
      { name: "uri", type: "string" },
      { name: "currency", type: "address" },
    ],
  };
  const signature = await (signer as VoidSigner)._signTypedData(domain, types, voucher);
  const _voucher = {
    ...voucher,
    signature,
  };
  return _voucher;
}
