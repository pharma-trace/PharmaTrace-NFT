// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../libraries/Helper.sol";

interface IPTCollection {
    error PTCollection__OnlyMarketPlace();

    function redeem(address redeemer, NFTVoucher calldata voucher) external;

    function verifySignature(NFTVoucher calldata voucher) external view returns (address);
}
