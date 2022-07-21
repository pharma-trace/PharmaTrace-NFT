// contracts/BadgeToken.sol
// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.8;

// 2. Imports
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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
    uint256 private s_listingFee = 25; // 2.5
    address private s_nftContractAddress;
    mapping(uint256 => Offer) private s_offers;
    mapping(uint256 => Offer) private s_marketOffers;

    mapping(address => uint256) private s_refundOfferAmounts;

    // Market Place State Variable
    mapping(uint256 => MarketItem) private marketItems;

    // Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_marketowner) revert PTNFTMarketPlace__NotOwner();
        _;
    }
    // Events Lazz NFT
    event ReceivedCalled(address indexed buyer, uint256 indexed amount);
    event FallbackCalled(address indexed buyer, uint256 indexed amount);
    event RefundOfferAmount(address indexed oldOfferBy, uint256 indexed amount);
    event CreateOffer(uint256 indexed tokenId, Offer indexed offer);
    event AcceptOffer(uint256 indexed tokenId, Offer indexed offer);
    event RejectOffer(uint256 indexed tokenId, Offer indexed offer);
    event WithDrawFund(uint256 indexed tokenId, Offer indexed offer);
    event RedundOfferAmount(address indexed offerBy, uint256 indexed amount);
    event BuyLazzNFT(uint256 indexed tokenId, Offer indexed offer);
    event BuyMarketPlaceItem(uint256 indexed tokenId, Offer indexed offer);

    // Event MarketPlace
    event MarketItemCreated(uint256 indexed id, MarketItem indexed marketItem);
    event MarketItemDelete(uint256 indexed id, MarketItem indexed marketItem);

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
            s_refundOfferAmounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }

        // offer.tokenId = voucher.tokenId;
        // offer.offerAmount = (voucher.maxPrice < msg.value)
        //     ? (msg.value - (msg.value - voucher.maxPrice))
        //     : msg.value;
        // offer.totalOffers++;
        // offer.startAt = block.timestamp;
        // offer.expiresAt = block.timestamp + (numberOfDays * 1 days);
        // offer.offerBy = payable(msg.sender);
        // offer.status = OfferState.OPEN;
        s_offers[voucher.tokenId] = setOfferStruct(
            offer,
            voucher.tokenId,
            voucher.maxPrice,
            msg.value,
            msg.sender,
            numberOfDays
        );
        _totalOfferOnMarketPlace.increment();
        if ((voucher.maxPrice < msg.value)) {
            (bool success, ) = msg.sender.call{value: (msg.value - voucher.maxPrice)}("");
            if (!success) {
                revert PTNFTMarketPlace__RevertExceedAmount();
            }
        }
        emit RefundOfferAmount(oldOfferBy, oldOfferValue);
        emit CreateOffer(voucher.tokenId, offer);
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

    /// @notice this function is used to buy Lazz NFT and mint it by pay the maxPrice of that NFT.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function buyLazzNFT(NFTVoucher calldata voucher) public payable nonReentrant {
        // verify the voucher from PTNFT
        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        bool success;
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        Offer memory offer = getOffer(voucher.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, voucher.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_refundOfferAmounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        if (voucher.maxPrice > msg.value) revert PTNFTMarketPlace__InsufficientFund();
        delete s_offers[voucher.tokenId];
        s_offers[voucher.tokenId].status = OfferState.CLOSE;
        PTNFT(s_nftContractAddress).redeem(msg.sender, voucher);

        if (voucher.maxPrice < msg.value) {
            (success, ) = msg.sender.call{value: (msg.value - voucher.maxPrice)}("");
            if (!success) {
                revert PTNFTMarketPlace__RevertExceedAmount();
            }
        }
        (success, ) = payable(i_marketowner).call{value: getPercentage(msg.value)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferListingFee();
        }
        // uint256 remainAmount = (offerAmount - s_listingFee);
        (success, ) = payable(signer).call{value: msg.value - getPercentage(msg.value)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        _itemSoldCounter.increment();
        emit RefundOfferAmount(oldOfferBy, oldOfferValue);
        emit BuyLazzNFT(voucher.tokenId, offer);
    }

    /// @notice this function is used to accept any offer for Lazz NFT and mint it and transfer that NFT to buyer.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function acceptLazzNFTOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        if (signer != msg.sender) {
            revert PTNFTMarketPlace__OnlyOwnerAcceptOffer();
        }
        Offer memory offer = getOffer(voucher.tokenId);
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }

        delete s_offers[voucher.tokenId];
        s_offers[voucher.tokenId].status = OfferState.CLOSE;

        delete s_offers[voucher.tokenId];
        s_offers[voucher.tokenId].status = OfferState.CLOSE;
        PTNFT(s_nftContractAddress).redeem(offer.offerBy, voucher);

        (bool success, ) = payable(i_marketowner).call{value: getPercentage(offer.offerAmount)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferListingFee();
        }
        // uint256 remainAmount = (offerAmount - s_listingFee);
        (success, ) = payable(signer).call{
            value: offer.offerAmount - getPercentage(offer.offerAmount)
        }("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        _itemSoldCounter.increment();
        emit AcceptOffer(voucher.tokenId, offer);
    }

    /// @notice this function is used to reject any offer for Lazz NFT and return offer amount to  buyer.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function rejectLazzNFTOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        if (signer != msg.sender) revert PTNFTMarketPlace__OnlyOwnerAcceptOffer();
        Offer memory offer = getOffer(voucher.tokenId);
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }
        delete s_offers[voucher.tokenId];
        (bool success, ) = offer.offerBy.call{value: offer.offerAmount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        emit RejectOffer(voucher.tokenId, offer);
    }

    // Market Place
    /// @notice this function is used to resale the NFT on the Market.
    /// @param tokenId ID which token you want to sale.
    /// @param minPrice in which owner want to sale.
    /// @param maxPrice price at which owner is happy to sale.
    /// @param isFixedPrice true mean no offer and false mean enable place offer.
    /// @param expiresAt time to expired from market sale.

    function createMarketItem(
        // address nftContract,
        uint256 tokenId,
        uint256 minPrice,
        uint256 maxPrice,
        bool isFixedPrice,
        uint256 expiresAt
    ) public nonReentrant {
        if (minPrice <= 0 || expiresAt <= 0)
            revert PTNFTMarketPlace__ZeroExpiredNoOfDaysAndMinPrice();
        if (PTNFT(s_nftContractAddress).getApproved(tokenId) != address(this))
            revert PTNFTMarketPlace__PermissionRequired();
        if (PTNFT(s_nftContractAddress).ownerOf(tokenId) != msg.sender)
            revert PTNFTMarketPlace__NoTheOwnerOfNFT();

        _itemCounter.increment();
        uint256 id = _itemCounter.current();

        marketItems[id] = MarketItem(
            id,
            s_nftContractAddress,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            minPrice,
            maxPrice,
            isFixedPrice,
            block.timestamp,
            isFixedPrice ? 0 : block.timestamp + (expiresAt * 1 days),
            State.Created
        );

        emit MarketItemCreated(id, marketItems[id]);
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
    function deleteMarketItem(uint256 itemId) public nonReentrant {
        if (itemId > _itemCounter.current()) revert PTNFTMarketPlace__ItemIdInvalid();
        if (marketItems[itemId].state != State.Created)
            revert PTNFTMarketPlace__ItemMustBeOnMarket();
        MarketItem storage item = marketItems[itemId];

        if (PTNFT(s_nftContractAddress).ownerOf(item.tokenId) != msg.sender)
            revert PTNFTMarketPlace__NoTheOwnerOfNFT();

        item.state = State.Inactive;
        PTNFT(s_nftContractAddress).revertApprovalForAll(address(0), item.tokenId);
        emit MarketItemDelete(itemId, item);
    }

    /// @notice place offer for marketplace item.
    /// @param id  which record.
    /// @param numberOfDays  offer expired time in days.
    function createOffer(uint16 id, uint16 numberOfDays) public payable nonReentrant {
        if (numberOfDays <= 0) revert PTNFTMarketPlace__ExpiringNoDaysNotZero();

        MarketItem storage item = checkRequirmentMarketPlace(id);
        if (item.isFixedPrice) revert PTNFTMarketPlace__FixedPirceMarketItem();

        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        /* address signer =*/
        Offer memory offer = getMarketOffer(item.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, item.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_refundOfferAmounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }

        // offer.tokenId = item.tokenId;
        // offer.offerAmount = (item.maxPrice < msg.value)
        //     ? (msg.value - (msg.value - item.maxPrice))
        //     : msg.value;
        // offer.totalOffers++;
        // offer.startAt = block.timestamp;
        // offer.expiresAt = block.timestamp + (numberOfDays * 1 days);
        // offer.offerBy = payable(msg.sender);
        // offer.status = OfferState.OPEN;
        s_marketOffers[item.tokenId] = setOfferStruct(
            offer,
            item.tokenId,
            item.maxPrice,
            msg.value,
            msg.sender,
            numberOfDays
        );
        _totalOfferOnMarketPlace.increment();
        if ((item.maxPrice < msg.value)) {
            (bool success, ) = msg.sender.call{value: (msg.value - item.maxPrice)}("");
            if (!success) {
                revert PTNFTMarketPlace__RevertExceedAmount();
            }
        }
        emit RefundOfferAmount(oldOfferBy, oldOfferValue);
        emit CreateOffer(item.tokenId, offer);
    }

    /// @notice buy NFT on maxPirce.
    /// @param id  which record.
    function buy(uint256 id) public payable nonReentrant {
        // verify the voucher from PTNFT
        address oldOfferBy = address(0);
        uint256 oldOfferValue = 0;
        bool success;
        MarketItem storage item = checkRequirmentMarketPlace(id);

        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        /* address signer =*/

        Offer memory offer = getMarketOffer(item.tokenId);
        checkRequirment(offer.status, offer.expiresAt, offer.offerAmount, item.minPrice);
        if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_refundOfferAmounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        if (item.maxPrice > msg.value) revert PTNFTMarketPlace__InsufficientFund();
        item.buyer = payable(msg.sender);
        item.state = State.Release;

        delete s_marketOffers[item.tokenId];
        s_marketOffers[item.tokenId].status = OfferState.CLOSE;
        PTNFT(s_nftContractAddress).transferFrom(item.seller, msg.sender, item.tokenId);

        if ((item.maxPrice < msg.value)) {
            (success, ) = msg.sender.call{value: (msg.value - item.maxPrice)}("");
            if (!success) {
                revert PTNFTMarketPlace__RevertExceedAmount();
            }
        }
        (success, ) = payable(i_marketowner).call{value: getPercentage(msg.value)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferListingFee();
        }
        // uint256 remainAmount = (offerAmount - s_listingFee);
        (success, ) = payable(item.seller).call{value: msg.value - getPercentage(msg.value)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        _itemSoldCounter.increment();
        emit RefundOfferAmount(oldOfferBy, oldOfferValue);
        emit BuyMarketPlaceItem(item.tokenId, offer);
    }

    /// @notice Recjet offer and return amount .
    /// @param id  which record.
    function rejectOffer(uint256 id) public payable nonReentrant {
        MarketItem storage item = checkRequirmentMarketPlace(id);
        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        if (item.seller != msg.sender) revert PTNFTMarketPlace__OnlyOwnerAcceptOffer();
        Offer memory offer = getMarketOffer(item.tokenId);
        if (offer.startAt <= 0) {
            revert PTNFTMarketPlace__NoOfferExist();
        }
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }
        delete s_marketOffers[item.tokenId];
        (bool success, ) = offer.offerBy.call{value: offer.offerAmount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        emit RejectOffer(item.tokenId, offer);
    }

    /// @notice Accepte the offer on which you are willing to sale .
    /// @param id  which record.
    function acceptOffer(uint256 id) public payable nonReentrant {
        MarketItem storage item = checkRequirmentMarketPlace(id);

        if (item.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__MarketItemExpired();
        }
        if (item.seller != msg.sender) revert PTNFTMarketPlace__OnlyOwnerAcceptOffer();
        Offer memory offer = getMarketOffer(item.tokenId);

        if (offer.startAt <= 0) {
            revert PTNFTMarketPlace__NoOfferExist();
        }
        if (offer.expiresAt < (block.timestamp + 40)) {
            revert PTNFTMarketPlace__OfferTimeExpired();
        }
        item.buyer = payable(offer.offerBy);
        item.state = State.Release;

        delete s_marketOffers[item.tokenId];
        s_marketOffers[item.tokenId].status = OfferState.CLOSE;
        PTNFT(s_nftContractAddress).transferFrom(item.seller, offer.offerBy, item.tokenId);

        (bool success, ) = payable(i_marketowner).call{value: getPercentage(offer.offerAmount)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferListingFee();
        }
        // uint256 remainAmount = (offerAmount - s_listingFee);
        (success, ) = payable(item.seller).call{
            value: offer.offerAmount - getPercentage(offer.offerAmount)
        }("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        _itemSoldCounter.increment();
        emit AcceptOffer(item.tokenId, offer);
    }

    function checkRequirmentMarketPlace(uint256 id) internal view returns (MarketItem storage) {
        if (id > _itemCounter.current()) revert PTNFTMarketPlace__ItemIdInvalid();
        MarketItem storage item = marketItems[id]; //should use storge!!!!
        if (item.state != State.Created) revert PTNFTMarketPlace__ItemMustBeOnMarket();

        if (!PTNFT(s_nftContractAddress).getApprovedOrOwner(address(this), item.tokenId))
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
            revert PTNFTMarketPlace__NotExceedCurrentOffer();
        }
        if (minPrice > msg.value) {
            revert PTNFTMarketPlace__InsufficientFund();
        }
    }

    /// @notice this allow Buyer to withdraw from their offer and get back it amount .
    /// @param tokenId  which NFT.
    function withDrawFromOffer(uint256 tokenId) public payable nonReentrant {
        Offer memory offer = getOffer(tokenId);
        if (offer.offerBy != msg.sender) revert PTNFTMarketPlace__FirstPlaceOffer();
        delete s_offers[tokenId];
        (bool success, ) = offer.offerBy.call{value: offer.offerAmount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        emit WithDrawFund(tokenId, offer);
    }

    /// @notice this allow Buyer whose offer is expire or over by other buyer .
    function refundOfferAmount() public payable nonReentrant {
        uint256 amount = s_refundOfferAmounts[msg.sender];
        if (amount == 0) revert PTNFTMarketPlace__NoRefundAmountFound();
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToRefundAmountFound();
        }
        emit RedundOfferAmount(msg.sender, amount);
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

    function getRefundOfferAmounts(address buyer) public view returns (uint256) {
        return s_refundOfferAmounts[buyer];
    }

    function getItemCounter() public view returns (uint256) {
        return _itemCounter.current();
    }

    function setNftContractAddress(address nftContractAddress) public onlyOwner {
        if (nftContractAddress == address(0))
            revert PTNFTMarketPlace__NFTContractAddressIsRequired();
        s_nftContractAddress = nftContractAddress;
    }

    function getNftContractAddress() public view returns (address) {
        return s_nftContractAddress;
    }

    /// @notice it is percentage of profite fee charge by marketplace on sale it should be one decimal number 1.2 = 12, 2.6 =26 ,100=10   .
    // it will not more the 10 percentage
    function setlistingFee(uint256 listingFee) public onlyOwner {
        if (listingFee > 0) revert PTNFTMarketPlace__ListingFeeNotZero();
        s_listingFee = listingFee;
    }

    function getMarketowner() public view returns (address) {
        return i_marketowner;
    }

    /**
     * @dev Returns all unsold market items
     * condition:
     *  1) state == Created
     *  2) buyer = 0x0
     *  3) still have approve
     */
    function fetchActiveItems() public view returns (MarketItem[] memory) {
        return fetchHepler(FetchOperator.ActiveItems);
    }

    /**
     * @dev Returns only market items a user has purchased
     * todo pagination
     */
    function fetchMyPurchasedItems() public view returns (MarketItem[] memory) {
        return fetchHepler(FetchOperator.MyPurchasedItems);
    }

    /**
     * @dev Returns only market items a user has created
     * todo pagination
     */
    function fetchMyCreatedItems() public view returns (MarketItem[] memory) {
        return fetchHepler(FetchOperator.MyCreatedItems);
    }

    /**
     * @dev fetch helper
     * todo pagination
     */
    function fetchHepler(FetchOperator _op) private view returns (MarketItem[] memory) {
        uint256 total = _itemCounter.current();

        uint256 itemCount = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (isCondition(marketItems[i], _op)) {
                itemCount++;
            }
        }

        uint256 index = 0;
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 1; i <= total; i++) {
            if (isCondition(marketItems[i], _op)) {
                items[index] = marketItems[i];
                index++;
            }
        }
        return items;
    }

    /**
     * @dev helper to build condition
     *
     * todo should reduce duplicate contract call here
     * (IERC721(item.nftContract).getApproved(item.tokenId) called in two loop
     */
    function isCondition(MarketItem memory item, FetchOperator _op) private view returns (bool) {
        if (_op == FetchOperator.MyCreatedItems) {
            return (item.seller == msg.sender && item.state != State.Inactive) ? true : false;
        } else if (_op == FetchOperator.MyPurchasedItems) {
            return (item.buyer == msg.sender) ? true : false;
        } else if (_op == FetchOperator.ActiveItems) {
            return
                (item.buyer == address(0) &&
                    item.state == State.Created &&
                    (IERC721(item.nftContract).getApproved(item.tokenId) == address(this)))
                    ? true
                    : false;
        } else {
            return false;
        }
    }
}
