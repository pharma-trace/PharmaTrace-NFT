// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "../libraries/Helper.sol";

interface IPTMarket {
    // structs
    struct MarketItem {
        address seller;
        address currency;
        uint256 minPrice;
        uint256 expiry;
        bool isFixedPrice;
        bool isVoucher;
    }
    struct Offer {
        address buyer;
        uint256 offerPrice;
    }

    // events
    event ItemListed(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed seller,
        address currency,
        uint256 minPrice,
        uint256 expiry,
        bool isFixedPrice,
        bool isVoucher
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
    
    event VoucherWritten(address indexed collection, uint256 indexed tokenId, string uri, bytes signature);
    event CurrencyWhitelisted(address indexed currency, bool addOrRemove);
    event ItemBought(address indexed collection, uint256 indexed tokenId, address buyer);
    event OfferCreated(address indexed collection, uint256 indexed tokenId, address buyer, uint256 offerPrice);
    event OfferAccepted(address indexed collection, uint256 indexed tokenId, address buyer);
    event OfferRejected(address indexed collection, uint256 indexed tokenId, address buyer);
    event ItemUnlisted(address indexed collection, uint256 indexed tokenId);
    event OfferWithdrawn(address indexed collection, uint256 indexed tokenId);
    event FeePercentageUpadated(uint256 newFeePercentage);

    // errors
    error PTMarket__ReentrancyError(address collection, uint256 tokenId);
    error PTMarket__NotSeller(address seller);
    error PTMarket__NotOfferer(address buyer);
    error PTMarket__MarketItemExpired(uint256 expiry);
    error PTMarket__LowerPriceThanPrevious(uint256 lastOfferPrice);
}
