// contracts/BadgeToken.sol
// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.8;

// 2. Imports
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./pharmaTrace-NFT.sol";
import "./helper.sol";

/**@title A Pharmatrace  NFT MarketPlace contract
 * @author Touqeer Shah
 * @notice This contract is for creating a Lazy NFT
 * @dev Create MarketPlace for PhramaTrace
 */
contract PTNFTMarketPlace is ReentrancyGuard {
    // Type Declarations
    using Counters for Counters.Counter;

    // State variables
    Counters.Counter private _itemCounter;
    Counters.Counter private _itemSoldCounter;
    Counters.Counter private _totalOfferOnMarketPlace;
    address payable immutable i_marketowner;
    uint256 private s_listingFee = 25; // 2.5%
    address private s_nftContractAddress;
    mapping(uint256 => Offer) private s_offers;
    mapping(uint256 => Offer) private s_marketOffers;
    mapping(address => uint256) private s_amounts;
    mapping(address => mapping(uint256 => MarketItem)) public s_marketItems;

    // Modifiers
    modifier onlyMarketplaceOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_marketowner) revert PTNFTMarketPlace__NotOwner();
        _;
    }
    modifier notListed(address nftAddress, uint256 tokenId) {
        MarketItem memory item = s_marketItems[nftAddress][tokenId];
        if (item.minPrice > 0) {
            revert PTNFTMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        MarketItem memory item = s_marketItems[nftAddress][tokenId];
        if (item.minPrice <= 0) {
            revert PTNFTMarketPlace__ItemIdInvalid(nftAddress, tokenId);
        }
        _;
    }

    // Events Lazz NFT
    event ReceivedCalled(address indexed buyer, uint256 indexed amount);
    event FallbackCalled(address indexed buyer, uint256 indexed amount);
    event CreateOffer(
        uint256 indexed tokenId,
        uint256 offerAmount,
        uint256 totalOffers,
        uint256 indexed startAt,
        uint256 expiresAt,
        address payable offerBy,
        OfferState status
    );
    event AcceptOffer(
        uint256 indexed tokenId,
        uint256 offerAmount,
        address payable offerBy,
        OfferState status
    );
    event RejectOffer(
        uint256 indexed tokenId,
        uint256 offerAmount,
        address payable offerBy,
        OfferState status
    );
    event WithDrawFromOffer(uint256 indexed tokenId, uint256 offerAmount, address payable offerBy);
    event WithDrawAmount(address indexed offerBy, uint256 indexed amount);
    event WithDrawRefundAmount(address indexed offerBy, uint256 indexed amount);
    event BuyLazzNFT(uint256 indexed tokenId, uint256 offerAmount, address payable offerBy);
    event BuyMarketPlaceItem(uint256 indexed tokenId, uint256 offerAmount, address payable offerBy);

    // Event MarketPlace
    event MarketItemCreated(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 minPrice,
        uint256 maxPrice,
        bool isFixedPrice,
        uint256 startAt,
        uint256 expiresAt,
        State state
    );
    event MarketItemDelete(uint256 indexed tokenId, address indexed seller, State state);

    //// constructor
    constructor() {
        i_marketowner = payable(msg.sender);
    }

    //// receive
    receive() external payable {
        emit ReceivedCalled(msg.sender, msg.value);
    }

    //// fallback
    fallback() external payable {
        emit FallbackCalled(msg.sender, msg.value);
    }

    //// external
    //// public

    /// @notice Following are the Function for related to Lazz NFT Miting and Offers.

    /// @notice this function is used to create offer for Lazz NFT which is not minted yet.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    /// @param numberOfDays it will tell number of days this offer will expired.
    function createOfferFoRLazzNFT(NFTVoucher calldata voucher, uint256 numberOfDays)
        public
        payable
        nonReentrant
    {
        if (numberOfDays <= 0) revert PTNFTMarketPlace__ExpiringNoDaysNotZero();
        PTNFT(s_nftContractAddress)._verify(voucher);
        // verify the voucher from PTNFT
        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        /* address signer =*/
        Offer memory offer = getOffer(voucher.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, voucher.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_amounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        if (voucher.maxPrice < msg.value && voucher.maxPrice != msg.value)
            revert PTNFTMarketPlace__AmountNoExceedMaxPrice();

        s_offers[voucher.tokenId] = setOfferStruct(
            offer,
            voucher.tokenId,
            voucher.maxPrice,
            msg.value,
            msg.sender,
            numberOfDays
        );
        _totalOfferOnMarketPlace.increment();
        emit WithDrawRefundAmount(oldOfferBy, oldOfferValue);

        emit CreateOffer(
            offer.tokenId,
            offer.offerAmount,
            offer.totalOffers,
            offer.startAt,
            offer.expiresAt,
            offer.offerBy,
            offer.status
        );
    }

    /// @notice this function is used to buy Lazz NFT and mint it by pay the maxPrice of that NFT.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function buyLazzNFT(NFTVoucher calldata voucher) public payable nonReentrant {
        // verify the voucher from PTNFT
        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        Offer memory offer = getOffer(voucher.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, voucher.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_amounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        if (voucher.maxPrice != msg.value) revert PTNFTMarketPlace__AmountNoExceedMaxPrice();
        s_amounts[i_marketowner] += getPercentage(msg.value);
        s_amounts[signer] += (msg.value - getPercentage(msg.value));
        delete s_offers[voucher.tokenId];
        s_offers[voucher.tokenId].status = OfferState.CLOSE;

        PTNFT(s_nftContractAddress).redeem(msg.sender, voucher);

        _itemSoldCounter.increment();
        emit WithDrawRefundAmount(oldOfferBy, oldOfferValue);
        emit BuyLazzNFT(offer.tokenId, offer.offerAmount, offer.offerBy);
    }

    /// @notice this function is used to accept any offer for Lazz NFT and mint it and transfer that NFT to buyer.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function acceptLazzNFTOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        if (signer != msg.sender) {
            revert PTNFTMarketPlace__NotOwner();
        }
        Offer memory offer = getOffer(voucher.tokenId);
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }

        s_amounts[i_marketowner] += getPercentage(offer.offerAmount);
        s_amounts[signer] += (offer.offerAmount - getPercentage(offer.offerAmount));
        delete s_offers[voucher.tokenId];
        s_offers[voucher.tokenId].status = OfferState.CLOSE;

        PTNFT(s_nftContractAddress).redeem(offer.offerBy, voucher);
        _itemSoldCounter.increment();
        emit AcceptOffer(offer.tokenId, offer.offerAmount, offer.offerBy, offer.status);
    }

    /// @notice this function is used to reject any offer for Lazz NFT and return offer amount to  buyer.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function rejectLazzNFTOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        if (signer != msg.sender) revert PTNFTMarketPlace__NotOwner();
        Offer memory offer = getOffer(voucher.tokenId);
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }
        s_amounts[offer.offerBy] += offer.offerAmount;

        delete s_offers[voucher.tokenId];
        emit RejectOffer(offer.tokenId, offer.offerAmount, offer.offerBy, offer.status);
    }

    // Market Place
    /// @notice this function is used to resale the NFT on the Market.
    /// @param itemId ID which token you want to sale.
    /// @param minPrice in which owner want to sale.
    /// @param maxPrice price at which owner is happy to sale.
    /// @param isFixedPrice true mean no offer and false mean enable place offer.
    /// @param expiresAt time to expired from market sale.

    function createMarketItem(
        uint256 itemId,
        uint256 minPrice,
        uint256 maxPrice,
        bool isFixedPrice,
        uint256 expiresAt,
        address nftAddress
    ) public nonReentrant notListed(nftAddress, itemId) {
        IERC721 nft = IERC721(nftAddress);

        if (minPrice <= 0 || expiresAt <= 0)
            revert PTNFTMarketPlace__ZeroExpiredNoOfDaysAndMinPrice();
        if (nft.getApproved(itemId) != address(this)) revert PTNFTMarketPlace__PermissionRequired();
        if (nft.ownerOf(itemId) != msg.sender) revert PTNFTMarketPlace__NotOwner();

        _itemCounter.increment();

        s_marketItems[nftAddress][itemId] = MarketItem(
            itemId,
            payable(msg.sender),
            payable(address(0)),
            minPrice,
            maxPrice,
            isFixedPrice,
            block.timestamp,
            isFixedPrice ? 0 : block.timestamp + (expiresAt * 1 days),
            State.Created
        );

        emit MarketItemCreated(
            itemId,
            payable(msg.sender),
            payable(address(0)),
            minPrice,
            maxPrice,
            isFixedPrice,
            block.timestamp,
            isFixedPrice ? 0 : block.timestamp + (expiresAt * 1 days),
            State.Created
        );
    }

    /**
     * @dev delete a MarketItem from the marketplace.
     *
     * de-List an NFT.
     *
     * todo ERC721.approve can't work properly!! comment out
     */

    /// @notice delete a MarketItem from the marketplace.
    /// @param itemId  which record.
    function deleteMarketItem(uint256 itemId, address nftAddress)
        public
        nonReentrant
        isListed(nftAddress, itemId)
    {
        IERC721 nft = IERC721(nftAddress);

        if (s_marketItems[nftAddress][itemId].state != State.Created)
            revert PTNFTMarketPlace__NotAvailableForOffer();
        MarketItem storage item = s_marketItems[nftAddress][itemId];

        if (nft.ownerOf(item.tokenId) != msg.sender) revert PTNFTMarketPlace__NotOwner();

        item.state = State.Inactive;
        // PTNFT(s_nftContractAddress).revertApprovalForAll(address(0), item.tokenId);
        emit MarketItemDelete(item.tokenId, item.seller, item.state);
    }

    /// @notice place offer for marketplace item.
    /// @param itemId  which record.
    /// @param numberOfDays  offer expired time in days.
    function createOffer(
        uint16 itemId,
        uint16 numberOfDays,
        address nftAddress
    ) public payable nonReentrant isListed(nftAddress, itemId) {
        if (numberOfDays <= 0) revert PTNFTMarketPlace__ExpiringNoDaysNotZero();
        IERC721 nft = IERC721(nftAddress);

        MarketItem storage item = checkRequirmentMarketPlace(itemId, nftAddress, nft);
        if (item.isFixedPrice) revert PTNFTMarketPlace__FixedPirceMarketItem();

        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        if (item.maxPrice < msg.value && item.maxPrice != msg.value)
            revert PTNFTMarketPlace__AmountNoExceedMaxPrice();

        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        /* address signer =*/
        Offer memory offer = getMarketOffer(item.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, item.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_amounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        s_marketOffers[item.tokenId] = setOfferStruct(
            offer,
            item.tokenId,
            item.maxPrice,
            msg.value,
            msg.sender,
            numberOfDays
        );
        _totalOfferOnMarketPlace.increment();

        emit WithDrawRefundAmount(oldOfferBy, oldOfferValue);
        emit CreateOffer(
            offer.tokenId,
            offer.offerAmount,
            offer.totalOffers,
            offer.startAt,
            offer.expiresAt,
            offer.offerBy,
            offer.status
        );
    }

    /// @notice buy NFT on maxPirce.
    /// @param itemId  which record.
    function buy(uint256 itemId, address nftAddress)
        public
        payable
        nonReentrant
        isListed(nftAddress, itemId)
    {
        // verify the voucher from PTNFT
        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        IERC721 nft = IERC721(nftAddress);

        MarketItem storage item = checkRequirmentMarketPlace(itemId, nftAddress, nft);

        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        /* address signer =*/

        Offer memory offer = getMarketOffer(item.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, item.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_amounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        if (item.maxPrice != msg.value) revert PTNFTMarketPlace__AmountNoExceedMaxPrice();

        item.buyer = payable(msg.sender);
        item.state = State.Release;
        s_amounts[i_marketowner] += getPercentage(msg.value);
        s_amounts[item.seller] += (msg.value - getPercentage(msg.value));
        delete s_marketOffers[item.tokenId];

        s_marketOffers[item.tokenId].status = OfferState.CLOSE;

        nft.transferFrom(item.seller, msg.sender, item.tokenId);
        _itemSoldCounter.increment();
        emit WithDrawRefundAmount(oldOfferBy, oldOfferValue);
        emit BuyMarketPlaceItem(offer.tokenId, offer.offerAmount, offer.offerBy);
    }

    /// @notice Recjet offer and return amount .
    /// @param itemId  which record.
    function rejectOffer(uint256 itemId, address nftAddress)
        public
        payable
        nonReentrant
        isListed(nftAddress, itemId)
    {
        IERC721 nft = IERC721(nftAddress);

        MarketItem storage item = checkRequirmentMarketPlace(itemId, nftAddress, nft);
        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        if (item.seller != msg.sender) revert PTNFTMarketPlace__NotOwner();
        Offer memory offer = getMarketOffer(item.tokenId);
        if (offer.startAt <= 0) {
            revert PTNFTMarketPlace__NoOfferExist();
        }
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }
        s_amounts[offer.offerBy] += (offer.offerAmount);

        delete s_marketOffers[item.tokenId];
        emit RejectOffer(offer.tokenId, offer.offerAmount, offer.offerBy, offer.status);
    }

    /// @notice Accepte the offer on which you are willing to sale .
    /// @param itemId  which record.
    function acceptOffer(uint256 itemId, address nftAddress)
        public
        payable
        nonReentrant
        isListed(nftAddress, itemId)
    {
        IERC721 nft = IERC721(nftAddress);

        MarketItem storage item = checkRequirmentMarketPlace(itemId, nftAddress, nft);

        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        if (item.seller != msg.sender) revert PTNFTMarketPlace__NotOwner();
        Offer memory offer = getMarketOffer(item.tokenId);

        if (offer.startAt <= 0) {
            revert PTNFTMarketPlace__NoOfferExist();
        }
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }
        item.buyer = payable(offer.offerBy);
        item.state = State.Release;
        s_amounts[i_marketowner] += getPercentage(offer.offerAmount);
        s_amounts[item.seller] += (offer.offerAmount - getPercentage(offer.offerAmount));
        delete s_marketOffers[item.tokenId];
        s_marketOffers[item.tokenId].status = OfferState.CLOSE;
        nft.transferFrom(item.seller, offer.offerBy, item.tokenId);
        _itemSoldCounter.increment();
        emit AcceptOffer(offer.tokenId, offer.offerAmount, offer.offerBy, offer.status);
    }

    function checkRequirmentMarketPlace(
        uint256 itemId,
        address nftAddress,
        IERC721 nft
    ) internal view returns (MarketItem storage) {
        MarketItem storage item = s_marketItems[nftAddress][itemId]; //should use storge!!!!
        if (item.state != State.Created) revert PTNFTMarketPlace__NotAvailableForOffer();
        if (nft.getApproved(item.tokenId) != address(this))
            revert PTNFTMarketPlace__PermissionRequired();

        return item;
    }

    /// @notice this is an helper function optimize the code .
    function checkRequirment(
        OfferState status,
        uint256 expiresAt,
        uint256 offerAmount,
        uint256 minPrice
    ) internal {
        if (status != OfferState.OPEN) {
            revert PTNFTMarketPlace__NotAvailableForOffer();
        }
        if (expiresAt > (block.timestamp + 40) && offerAmount > msg.value) {
            revert PTNFTMarketPlace__InsufficientFund();
        }
        if (minPrice > msg.value) {
            revert PTNFTMarketPlace__InsufficientFund();
        }
    }

    function setOfferStruct(
        Offer memory offer,
        uint256 tokenId,
        uint256 maxPrice,
        uint256 value,
        address sender,
        uint256 numberOfDays
    ) internal view returns (Offer memory) {
        offer.tokenId = tokenId;
        offer.offerAmount = (maxPrice < value) ? (value - (value - maxPrice)) : value;
        offer.totalOffers++;
        offer.startAt = block.timestamp;
        offer.expiresAt = block.timestamp + (numberOfDays * 1 days);
        offer.offerBy = payable(sender);
        offer.status = OfferState.OPEN;
        return offer;
    }

    /// @notice this allow Buyer to withdraw from their offer and get back it amount .
    /// @param tokenId  which NFT.
    function withDrawFromOffer(uint256 tokenId) public payable nonReentrant {
        Offer memory offer = getOffer(tokenId);
        if (offer.offerBy != msg.sender) revert PTNFTMarketPlace__NoAmountForWithDraw();
        delete s_offers[tokenId];
        (bool success, ) = offer.offerBy.call{value: offer.offerAmount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToWithDrawAmount();
        }
        emit WithDrawFromOffer(offer.tokenId, offer.offerAmount, offer.offerBy);
    }

    /// @notice this allow Buyer whose offer is expire or over by other buyer .
    function withDrawAmount() public payable nonReentrant {
        uint256 amount = s_amounts[msg.sender];
        if (amount == 0) revert PTNFTMarketPlace__NoAmountForWithDraw();
        s_amounts[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToWithDrawAmount();
        }
        emit WithDrawAmount(msg.sender, amount);
    }

    //// private
    //// view / pure
    function getListingFee() public view returns (uint256) {
        return s_listingFee;
    }

    /// @notice it will return percentage of profite transfer to market place owner .

    function getPercentage(uint256 amount) internal view returns (uint256) {
        return (s_listingFee * amount) / 1000;
    }

    function getContractBlanace() public view returns (uint256) {
        return address(this).balance;
    }

    function getOffer(uint256 tokenId) public view returns (Offer memory) {
        return s_offers[tokenId];
    }

    function getMarketOffer(uint256 tokenId) public view returns (Offer memory) {
        return s_marketOffers[tokenId];
    }

    function getWithDrawAmounts(address buyer) public view returns (uint256) {
        return s_amounts[buyer];
    }

    function getItemCounter() public view returns (uint256) {
        return _itemCounter.current();
    }

    function setNftContractAddress(address nftContractAddress) public onlyMarketplaceOwner {
        if (nftContractAddress == address(0))
            revert PTNFTMarketPlace__NFTContractAddressIsRequired();

        s_nftContractAddress = nftContractAddress;
    }

    function getNftContractAddress() public view returns (address) {
        return s_nftContractAddress;
    }

    function getMarketItem(address nftAddress, uint256 tokenId)
        external
        view
        returns (MarketItem memory)
    {
        return s_marketItems[nftAddress][tokenId];
    }

    /// @notice it is percentage of profite fee charge by marketplace on sale it should be one decimal number 1.2 = 12, 2.6 =26 ,100=10   .
    // it will not more the 10 percentage
    function setlistingFee(uint256 listingFee) public onlyMarketplaceOwner {
        if (listingFee <= 0) revert PTNFTMarketPlace__ListingFeeNotZero();
        s_listingFee = listingFee;
    }

    function getMarketowner() public view returns (address) {
        return i_marketowner;
    }
}
