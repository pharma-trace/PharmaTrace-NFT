// contracts/BadgeToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./helper.sol";

interface Marketplace_Interface {
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
    error PTNFTMarketPlace__AllowedCryptoNotExist();
    error PTNFTMarketPlace__InsufficientApprovalFund();

    error PTNFTMarketPlace__FixedPirceMarketItem();
    // error PTNFTMarketPlace__ListingFeeNotZero();
    error PTNFTMarketPlace__NFTContractAddressIsRequired();
    // error PTNFTMarketPlace__ExpiringNoDaysNotZero();
    error PTNFTMarketPlace__AlreadyListed(address, uint256);
    error PTNFTMarketPlace__ItemIdInvalid(address, uint256);

    // Events Lazz NFT
    event ReceivedCalled(address indexed buyer, uint256 indexed amount);
    event FallbackCalled(address indexed buyer, uint256 indexed amount);
    event CreateOffer(
        uint256 indexed tokenId,
        address indexed contractAddress,
        uint256 offerAmount,
        uint256 totalOffers,
        uint256 startAt,
        uint256 expiresAt,
        address payable indexed offerBy,
        OfferState status
    );
    event AcceptOffer(
        uint256 indexed tokenId,
        address owner,
        address indexed contractAddress,
        uint256 offerAmount,
        address payable indexed offerBy,
        OfferState status
    );
    event RejectOffer(
        uint256 indexed tokenId,
        address owner,
        address indexed contractAddress,
        uint256 offerAmount,
        address payable indexed offerBy,
        OfferState status
    );
    event WithDrawFromOffer(
        uint256 indexed tokenId,
        address indexed contractAddress,
        uint256 offerAmount,
        address payable indexed offerBy
    );
    event WithDrawAmount(address indexed offerBy, uint256 indexed amount);
    event WithDrawRefundAmount(
        uint256 indexed tokenId,
        address indexed contractAddress,
        address indexed offerBy,
        uint256 amount
    );
    event BuyNFT(
        uint256 indexed tokenId,
        address owner,
        address indexed contractAddress,
        uint256 offerAmount,
        address payable indexed offerBy
    );

    // Event MarketPlace
    event MarketItemCreated(
        uint256 indexed tokenId,
        address indexed contractAddress,
        address indexed seller,
        address buyer,
        uint256 minPrice,
        bool isFixedPrice,
        uint256 startAt,
        uint256 expiresAt,
        State state
    );
    event MarketItemDelete(
        uint256 indexed tokenId,
        address indexed contractAddress,
        address indexed seller,
        State state
    );
    event TotalNumberOfOfferOnMarketPlace(uint256 indexed totalOfferOnMarketPlace);
    event TotalNumberOfItemMarketPlace(uint256 indexed itemSoldCounter);
}
