// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;
enum State {
    Created,
    Release,
    Inactive
}
enum OfferState {
    OPEN,
    CLOSE
}

// 3. Interfaces, Libraries, Contracts
error PTNFTMarketPlace__NotOwner();
error PTNFTMarketPlace__InsufficientFund();
error PTNFTMarketPlace__NotAvailableForOffer();
error PTNFTMarketPlace__FailToWithDrawAmount();
error PTNFTMarketPlace__NoAmountForWithDraw();
// error PTNFTMarketPlace__ZeroExpiredNoOfDaysAndMinPrice();
error PTNFTMarketPlace__ValueShouldGreaterThenZero();

error PTNFTMarketPlace__PermissionRequired();
error PTNFTMarketPlace__MarketItemExpired();
error PTNFTMarketPlace__OfferTimeExpired();
error PTNFTMarketPlace__NoOfferExist();

error PTNFTMarketPlace__FixedPirceMarketItem();
// error PTNFTMarketPlace__ListingFeeNotZero();
error PTNFTMarketPlace__NFTContractAddressIsRequired();
// error PTNFTMarketPlace__ExpiringNoDaysNotZero();
error PTNFTMarketPlace__AlreadyListed(address, uint256);
error PTNFTMarketPlace__ItemIdInvalid(address, uint256);

struct NFTVoucher {
    /// @notice The id of the token to be redeemed. Must be unique - if another token with this ID already exists, the redeem function will revert.
    uint256 tokenId;
    /// @notice The minimum price (in wei) that the NFT creator is willing to accept for the initial sale of this NFT.
    uint256 minPrice;
    // /// @notice The maxmum price (in wei) that the NFT creator is willing to accept for the buy this NFT.
    // uint256 maxPrice;
    /// @notice The metadata URI to associate with this token.
    string uri;
    /// @notice the EIP-712 signature of all other fields in the NFTVoucher struct. For a voucher to be valid, it must be signed by an account with the MINTER_ROLE.
    bytes signature;
}

/// @notice Represents an Offer for NFT, which has not yet been recorded into the blockchain. A signed voucher can be redeemed for a real NFT using the redeem function once owner will accepte.
struct Offer {
    /// @notice The id of the token to be redeemed. Must be unique - if another token with this ID already exists, the redeem function will revert.
    uint256 tokenId;
    /// @notice The offer Amount price (in wei) that buy is will to buy this NFT.
    uint256 offerAmount;
    /// @notice The highest Offer price (in wei) that show what will be thr highest bid someone place to buy this NFT.
    // uint256 highestOffer;
    // /// @notice The average Offer price (in wei) that the average offer Price for this NFT based on only offer.
    // uint256 averageOffer;
    /// @notice The total Offers this count the number of offer on this NFT.
    uint256 totalOffers;
    /// @notice The metadata URI to associate with this token.
    uint256 startAt;
    /// @notice The metadata URI to associate with this token.
    uint256 expiresAt;
    /// @notice the Time on which this offer well be expired.
    address payable offerBy;
    /// @notice the close offer when deal done.
    OfferState status;
}

struct MarketItem {
    uint256 tokenId;
    address payable seller;
    address payable buyer;
    uint256 minPrice;
    bool isFixedPrice;
    /// @notice The metadata URI to associate with this token.
    uint256 startAt;
    /// @notice The metadata URI to associate with this token.
    uint256 expiresAt;
    State state;
}

struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
}
