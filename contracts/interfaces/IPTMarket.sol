// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../libraries/Helper.sol";

interface IPTMarket {
    function whitelistCollection(address collection) external;

    function whitelistCurrency(address currency, bool addOrRemove) external;

    function listItem(
        address collection,
        uint256 tokenId,
        address currency,
        uint256 minPrice,
        uint256 expiresAt,
        bool isFixedPrice
    ) external;

    function buyItem(address collection, uint256 tokenId) external payable;

    function buyLazzNFT(address collection, NFTVoucher calldata voucher) external payable;

    function createOffer(
        address collection,
        uint256 tokenId,
        uint256 offerPrice
    ) external payable;

    function createLazzOffer(
        address collection,
        NFTVoucher calldata voucher,
        uint256 offerPrice
    ) external payable;

    function acceptOffer(
        address collection,
        uint256 tokenId,
        bool acceptOrReject
    ) external;

    function unlistItem(address collection, uint256 tokenId) external;

    function withdrawOffer(address collection, uint256 tokenId) external;

    function setFeePercent(uint256 newFeePercent) external;

    // structs
    struct MarketItem {
        address seller;
        address currency;
        uint256 minPrice;
        uint256 expiry;
        bool isFixedPrice;
    }
    struct Offer {
        address buyer;
        uint256 offerPrice;
        bool isVoucher;
    }

    // events
    event ItemListed(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed seller,
        address currency,
        uint256 minPrice,
        uint256 expiry,
        bool isFixedPrice
    );
    event TradeExecuted(
        address indexed collection,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        address currency,
        uint256 price,
        bool isVoucher
    );

    event VoucherWritten(
        address indexed collection,
        uint256 indexed tokenId,
        string uri,
        address currency,
        bytes signature
    );
    event CollectionWhitelisted(address indexed collection);
    event CurrencyWhitelisted(address indexed currency, bool addOrRemove);
    event ItemBought(address indexed collection, uint256 indexed tokenId, address buyer, bool isVoucher);
    event OfferCreated(
        address indexed collection,
        uint256 indexed tokenId,
        address buyer,
        uint256 offerPrice,
        bool isVoucher
    );
    event OfferAccepted(address indexed collection, uint256 indexed tokenId, address buyer);
    event OfferRejected(address indexed collection, uint256 indexed tokenId, address buyer);
    event ItemUnlisted(address indexed collection, uint256 indexed tokenId);
    event OfferWithdrawn(address indexed collection, uint256 indexed tokenId);
    event FeePercentUpadated(uint256 newFeePercent);

    // errors
    error PTMarket__ReentrancyError(address collection, uint256 tokenId);
    error PTMarket__NotSeller(address seller);
    error PTMarket__NotOfferer(address buyer);
    error PTMarket__MarketItemExpired(uint256 expiry);
    error PTMarket__LowerPriceThanPrevious(uint256 lastOfferPrice);
}
