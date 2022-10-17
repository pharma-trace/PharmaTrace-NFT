// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

struct NFTVoucher {
    /// @notice The id of the token to be redeemed. Must be unique - if another token with this ID already exists, the redeem function will revert.
    uint256 tokenId;
    /// @notice The metadata URI to associate with this token.
    string uri;
    /// @notice The token address on which user want to sale the NFT.
    address currency;
    /// @notice Minimum price of the nft.
    uint256 minPrice;
    /// @notice True if and only if fixed price mode.
    bool isFixedPrice;
    /// @notice the EIP-712 signature of all other fields in the NFTVoucher struct. For a voucher to be valid, it must be signed by an account with the MINTER_ROLE.
    bytes signature;
}
