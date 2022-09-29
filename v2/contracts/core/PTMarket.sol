// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../libraries/Helper.sol";
import { IPTMarket } from "../interfaces/IPTMarket.sol";
import { IPTCollection } from "../interfaces/IPTCollection.sol";

contract PTMarket is IPTMarket, Ownable {
    uint256 private constant EXPIRY_ALLOW_PERIOD = 40;
    uint256 private constant DENOMINATOR = 1000;
    uint256 public feePercentage = 0; // 25 means 2.5%

    mapping(address => bool) public currencyList;
    mapping(address => mapping(uint256 => NFTVoucher)) private vouchers;
    mapping(address => mapping(uint256 => MarketItem)) public marketItems;
    mapping(address => mapping(uint256 => Offer)) public offers;
    mapping(address => mapping(uint256 => bool)) private nonReentrantLocks;

    modifier whitelisted(address currency) {
        require(currencyList[currency], "Unsupported token");
        _;
    }

    modifier nonReentrant(address collection, uint256 tokenId) {
        if (nonReentrantLocks[collection][tokenId]) {
            revert PTMarket__ReentrancyError(collection, tokenId);
        }
        nonReentrantLocks[collection][tokenId] = true;
        _;
        nonReentrantLocks[collection][tokenId] = false;
    }

    constructor() {
        whitelistCurrency(address(0), true);
        setFeePercentage(25);
    }

    /// @notice this function is used whitelist/unwhitlist market supporting ERC20 tokens
    /// @param currency address of ERC20 token
    /// @param addOrRemove true => whitelist, false => unwhitelist
    function whitelistCurrency(address currency, bool addOrRemove) public onlyOwner {
        currencyList[currency] = addOrRemove;
        emit CurrencyWhitelisted(currency, addOrRemove);
    }

    /// @notice create an item
    /// @param collection nft collection address
    /// @param tokenId nft tokenId
    /// @param currency desired currency to sell nft
    /// @param minPrice minimum price
    /// @param expiresAt number of days in expiry period, can be zero if isFixedPrice
    /// @param isFixedPrice false if and only if auction mode
    function listNFTItem(
        address collection,
        uint256 tokenId,
        address currency,
        uint256 minPrice,
        uint256 expiresAt,
        bool isFixedPrice
    ) external whitelisted(currency) nonReentrant(collection, tokenId) {
        require(minPrice > 0, "Listed price should be greater then zero");
        require(isFixedPrice || expiresAt > 0, "expiresAt should not be zero in auction mode");
        require(IERC721(collection).getApproved(tokenId) == address(this), "It should be allowed to markeplace");
        require(IERC721(collection).ownerOf(tokenId) == msg.sender, "Only owner of NFT will list into market");
        uint256 expiry = expiresAt == 0 ? 0 : block.timestamp + (expiresAt * 1 days);
        require(marketItems[collection][tokenId].seller == address(0), "Already listed");
        marketItems[collection][tokenId] = MarketItem(msg.sender, currency, minPrice, expiry, isFixedPrice, false);
        emit ItemListed(collection, tokenId, msg.sender, currency, minPrice, expiry, isFixedPrice, false);
    }

    /// @notice create an item
    /// @param collection nft collection address
    /// @param currency desired currency to sell nft
    /// @param minPrice minimum price
    /// @param expiresAt number of days in expiry period, can be zero if isFixedPrice
    /// @param isFixedPrice false if and only if auction mode
    function listLazzItem(
        address collection,
        address currency,
        uint256 minPrice,
        uint256 expiresAt,
        bool isFixedPrice,
        NFTVoucher calldata voucher
    ) external whitelisted(currency) nonReentrant(collection, voucher.tokenId) {
        uint256 tokenId = voucher.tokenId;
        require(minPrice > 0, "Listed price should be greater then zero");
        require(isFixedPrice || expiresAt > 0, "expiresAt should not be zero in auction mode");
        require(IPTCollection(collection).verifySignature(voucher) == msg.sender, "Not signer");

        uint256 expiry = expiresAt == 0 ? 0 : block.timestamp + (expiresAt * 1 days);
        require(marketItems[collection][tokenId].seller == address(0), "Already listed");
        marketItems[collection][tokenId] = MarketItem(msg.sender, currency, minPrice, expiry, isFixedPrice, true);
        emit ItemListed(collection, tokenId, msg.sender, currency, minPrice, expiry, isFixedPrice, true);
        vouchers[collection][tokenId] = voucher;
        emit VoucherWritten(collection, tokenId, voucher.uri, voucher.signature);
    }

    /// @notice buy a fixed price of Item
    /// @param collection nft collection address
    /// @param tokenId nft tokenId
    function buyItem(address collection, uint256 tokenId) external payable nonReentrant(collection, tokenId) {
        MarketItem storage marketItem = marketItems[collection][tokenId];
        require(marketItem.minPrice > 0, "Such market item doesn't exist");

        if (marketItem.expiry != 0 && marketItem.expiry < (block.timestamp + EXPIRY_ALLOW_PERIOD)) {
            revert PTMarket__MarketItemExpired(marketItem.expiry);
        }
        require(marketItem.isFixedPrice, "The item is not fixed price mode");
        _checkNFTApproved(collection, tokenId, marketItem.isVoucher);

        _lockMoney(marketItem.currency, marketItem.minPrice, msg.sender);
        _executeTrade(
            collection,
            tokenId,
            marketItem.seller,
            msg.sender,
            marketItem.currency,
            marketItem.minPrice,
            marketItem.isVoucher
        );

        emit ItemBought(collection, tokenId, msg.sender);
    }

    /// @notice create a new offer for existing item
    /// @param collection nft collection address
    /// @param tokenId nft tokenId
    /// @param offerPrice offerring price to buy
    function createOffer(
        address collection,
        uint256 tokenId,
        uint256 offerPrice
    ) external payable nonReentrant(collection, tokenId) {
        MarketItem storage marketItem = marketItems[collection][tokenId];
        require(marketItem.minPrice > 0, "Such market item doesn't exist");

        if (marketItem.expiry != 0 && marketItem.expiry < (block.timestamp + EXPIRY_ALLOW_PERIOD)) {
            revert PTMarket__MarketItemExpired(marketItem.expiry);
        }
        require(!marketItem.isFixedPrice, "The item is fixed price mode");
        _checkNFTApproved(collection, tokenId, marketItem.isVoucher);

        uint256 lastPrice = marketItem.minPrice - 1;
        Offer storage lastOffer = offers[collection][tokenId];
        if (lastOffer.buyer != address(0)) {
            lastPrice = lastOffer.offerPrice;
        }
        if (lastPrice >= offerPrice) {
            revert PTMarket__LowerPriceThanPrevious(lastPrice);
        }
        address lastBuyer = lastOffer.buyer;
        _lockMoney(marketItem.currency, marketItem.minPrice, msg.sender);
        offers[collection][tokenId] = Offer(msg.sender, offerPrice);
        if (lastBuyer != address(0)) {
            _unlockMoney(marketItem.currency, lastPrice, lastBuyer);
        }
        emit OfferCreated(collection, tokenId, msg.sender, offerPrice);
    }

    /// @notice accept/reject existing offer
    /// @param collection nft collection address
    /// @param tokenId nft tokenId
    /// @param acceptOrReject true => accept, false => reject
    function acceptOffer(
        address collection,
        uint256 tokenId,
        bool acceptOrReject
    ) external nonReentrant(collection, tokenId) {
        Offer storage offer = offers[collection][tokenId];
        require(offer.buyer != address(0), "Such market item doesn't exist");
        address buyer = offer.buyer;
        uint256 offerPrice = offer.offerPrice;
        MarketItem storage marketItem = marketItems[collection][tokenId];
        if (marketItem.seller == msg.sender) {
            revert PTMarket__NotSeller(marketItem.seller);
        }
        _checkNFTApproved(collection, tokenId, marketItem.isVoucher);
        delete offers[collection][tokenId];
        if (acceptOrReject) {
            _executeTrade(
                collection,
                tokenId,
                marketItem.seller,
                buyer,
                marketItem.currency,
                offerPrice,
                marketItem.isVoucher
            );
            emit OfferAccepted(collection, tokenId, buyer);
        } else {
            _unlockMoney(marketItem.currency, offerPrice, buyer);
            emit OfferRejected(collection, tokenId, buyer);
        }
    }

    /// @notice remove existing item
    /// @param collection nft collection address
    /// @param tokenId nft tokenId
    function unlistItem(address collection, uint256 tokenId) external nonReentrant(collection, tokenId) {
        MarketItem storage marketItem = marketItems[collection][tokenId];
        if (marketItem.seller == msg.sender) {
            revert PTMarket__NotSeller(marketItem.seller);
        }
        if (offers[collection][tokenId].buyer != address(0)) {
            _cancelOffer(collection, tokenId);
        }
        if (marketItem.isVoucher) delete vouchers[collection][tokenId];
        delete marketItems[collection][tokenId];
        emit ItemUnlisted(collection, tokenId);
    }

    /// @notice remove existing offer
    /// @param collection nft collection address
    /// @param tokenId nft tokenId
    function withdrawOffer(address collection, uint256 tokenId) external nonReentrant(collection, tokenId) {
        Offer storage offer = offers[collection][tokenId];
        if (offer.buyer == msg.sender) {
            revert PTMarket__NotOfferer(offer.buyer);
        }
        _cancelOffer(collection, tokenId);
        emit OfferWithdrawn(collection, tokenId);
    }

    /// @notice update feePercentage
    /// @param newFeePercentage fee percentage
    function setFeePercentage(uint256 newFeePercentage) public onlyOwner {
        feePercentage = newFeePercentage;
        emit FeePercentageUpadated(newFeePercentage);
    }

    function _cancelOffer(address collection, uint256 tokenId) private {
        Offer storage offer = offers[collection][tokenId];
        address buyer = offer.buyer;
        uint256 offerPrice = offer.offerPrice;
        address currency = marketItems[collection][tokenId].currency;
        delete offers[collection][tokenId];
        _unlockMoney(currency, offerPrice, buyer);
    }

    function _checkNFTApproved(
        address collection,
        uint256 tokenId,
        bool isVoucher
    ) private view {
        if (isVoucher) {
            require(
                IERC721(collection).ownerOf(tokenId) == address(0),
                "The Voucher is already used"
            );
        } else {
            require(
                IERC721(collection).getApproved(tokenId) == address(this),
                "Collection is not approved to the market"
            );
        }
    }

    function _lockMoney(
        // attention! don't call this twice in one function
        address currency,
        uint256 amount,
        address user
    ) private {
        if (currency == address(0)) {
            require(msg.value >= amount);
        } else {
            IERC20(currency).transferFrom(user, address(this), amount);
        }
    }

    function _unlockMoney(
        address currency,
        uint256 amount,
        address user
    ) private {
        if (currency == address(0)) {
            payable(user).transfer(amount);
        } else {
            IERC20(currency).transfer(user, amount);
        }
    }

    function _executeTrade(
        address collection,
        uint256 tokenId,
        address seller,
        address buyer,
        address currency,
        uint256 price,
        bool isVoucher
    ) private {
        uint256 fee = (price * feePercentage) / DENOMINATOR;
        if (currency == address(0)) {
            payable(seller).transfer(price - fee);
            payable(owner()).transfer(fee);
        } else {
            IERC20(currency).transfer(seller, price - fee);
            IERC20(currency).transfer(owner(), fee);
        }

        if (isVoucher) {
            NFTVoucher storage voucher = vouchers[collection][tokenId];
            IPTCollection(collection).redeem(buyer, voucher);
            delete vouchers[collection][tokenId];
        } else {
            IERC721(collection).safeTransferFrom(seller, buyer, tokenId);
        }
        emit TradeExecuted(collection, tokenId, seller, buyer, currency, price, isVoucher);

        delete offers[collection][tokenId];
        delete marketItems[collection][tokenId];
    }
}
