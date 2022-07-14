// contracts/BadgeToken.sol
// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.8;

// 2. Imports
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ptNFT.sol";
import "./helper.sol";
import "hardhat/console.sol";

// 3. Interfaces, Libraries, Contracts
error PTNFTMarketPlace__NotOwner();
error PTNFTMarketPlace__InsufficientFund();
error PTNFTMarketPlace__NotExceedCurrentOffer();
error PTNFTMarketPlace__RevertExceedAmount();
error PTNFTMarketPlace__OnlyOwnerAcceptOffer();
error PTNFTMarketPlace__FirstPlaceOffer();

error PTNFTMarketPlace__NotAvailableForOffer();
error PTNFTMarketPlace__FailToTransferListingFee();
error PTNFTMarketPlace__FailToTransferNFTOfferAmount();
error PTNFTMarketPlace__NoRefundAmountFound();
error PTNFTMarketPlace__FailToRefundAmountFound();

/**@title A Pharmatrace  NFT MarketPlace contract
 * @author Touqeer Shah
 * @notice This contract is for creating a Lazy NFT
 * @dev Create MarketPlace for PhramaTrace
 */
contract PTNFTMarketPlace is ReentrancyGuard {
    // Type Declarations

    using Counters for Counters.Counter;

    // State variables
    Counters.Counter private _itemSoldCounter;
    Counters.Counter private _totalOfferOnMarketPlace;
    address payable immutable i_marketowner;
    uint256 private s_listingFee = 0.025 ether;
    address private s_nftContractAddress;
    mapping(uint256 => Offer) private s_offers;
    mapping(address => uint256) private s_refundOfferAmounts;

    // Modifiers
    modifier onlyOwner() {
        // require(msg.sender == i_owner);
        if (msg.sender != i_marketowner) revert PTNFTMarketPlace__NotOwner();
        _;
    }
    // Events
    event ReceivedCalled(address indexed buyer, uint256 indexed amount);
    event FallbackCalled(address indexed buyer, uint256 indexed amount);
    event RefundOfferAmount(address indexed oldOfferBy, uint256 indexed amount);
    event CreateOffer(uint256 indexed tokenId, Offer indexed offer);
    event AcceptOffer(uint256 indexed tokenId, Offer indexed offer);
    event RejectOffer(uint256 indexed tokenId, Offer indexed offer);
    event RedundOfferAmount(address indexed offerBy, uint256 indexed amount);

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
    function createOffer(NFTVoucher calldata voucher, uint16 numberOfDays)
        public
        payable
        nonReentrant
    {
        // verify the voucher from PTNFT
        address oldOfferBy;
        uint256 oldOfferValue;
        /* address signer =*/
        PTNFT(s_nftContractAddress)._verify(voucher);
        Offer memory offer = getOffer(voucher.tokenId);

        if (offer.status == OfferState.CLOSE) revert PTNFTMarketPlace__NotAvailableForOffer();
        if (offer.expiresAt > block.timestamp && offer.offerAmount > msg.value) {
            revert PTNFTMarketPlace__NotExceedCurrentOffer();
        } else if (offer.expiresAt != 0 && offer.offerAmount != 0) {
            s_refundOfferAmounts[offer.offerBy] += offer.offerAmount;
            oldOfferValue = offer.offerAmount;
            oldOfferBy = offer.offerBy;
        }
        if (voucher.minPrice > msg.value) revert PTNFTMarketPlace__InsufficientFund();
        if (voucher.maxPrice > msg.value) {
            (bool success, ) = msg.sender.call{value: (msg.value - voucher.maxPrice)}("");
            if (!success) {
                revert PTNFTMarketPlace__RevertExceedAmount();
            }
        }
        offer.tokenId = voucher.tokenId;
        offer.offerAmount = (msg.value - (msg.value - voucher.maxPrice));
        offer.totalOffers++;
        offer.startAt = block.timestamp;
        offer.expiresAt = block.timestamp + numberOfDays;
        offer.offerBy = payable(msg.sender);
        offer.status = OfferState.OPEN;
        s_offers[voucher.tokenId] = offer;
        emit RefundOfferAmount(oldOfferBy, oldOfferValue);
        emit CreateOffer(voucher.tokenId, offer);
    }

    function acceptOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        Offer memory offer = getOffer(voucher.tokenId);
        delete s_offers[voucher.tokenId];
        s_offers[voucher.tokenId].status = OfferState.CLOSE;
        PTNFT(s_nftContractAddress).redeem(offer.offerBy, msg.sender, voucher);

        (bool success, ) = payable(i_marketowner).call{value: s_listingFee}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferListingFee();
        }
        (success, ) = msg.sender.call{value: (offer.offerAmount - s_listingFee)}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }

        emit AcceptOffer(voucher.tokenId, offer);
    }

    function rejectOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        address signer = PTNFT(s_nftContractAddress)._verify(voucher);
        if (signer != msg.sender) revert PTNFTMarketPlace__OnlyOwnerAcceptOffer();
        Offer memory offer = getOffer(voucher.tokenId);
        delete s_offers[voucher.tokenId];
        (bool success, ) = offer.offerBy.call{value: offer.offerAmount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        emit RejectOffer(voucher.tokenId, offer);
    }

    function withDrawOffer(NFTVoucher calldata voucher) public payable nonReentrant {
        Offer memory offer = getOffer(voucher.tokenId);
        if (offer.offerBy != msg.sender) revert PTNFTMarketPlace__FirstPlaceOffer();
        delete s_offers[voucher.tokenId];
        (bool success, ) = offer.offerBy.call{value: offer.offerAmount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToTransferNFTOfferAmount();
        }
        emit RejectOffer(voucher.tokenId, offer);
    }

    function redundOfferAmount() public payable nonReentrant {
        uint256 amount = s_refundOfferAmounts[msg.sender];
        if (amount == 0) revert PTNFTMarketPlace__NoRefundAmountFound();
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert PTNFTMarketPlace__FailToRefundAmountFound();
        }
        emit RedundOfferAmount(msg.sender, amount);
    }

    function getOffer(uint256 tokenId) public view returns (Offer memory) {
        return s_offers[tokenId];
    }

    function getNftContractAddress(address nftContractAddress) public onlyOwner {
        s_nftContractAddress = nftContractAddress;
    }

    function setlistingFee(uint256 listingFee) public onlyOwner {
        s_listingFee = listingFee;
    }

    //// internal
    //// private
    //// view / pure
    function getListingFee() public view returns (uint256) {
        return s_listingFee;
    }

    function getContractBlanace() public view returns (uint256) {
        return address(this).balance;
    }

    function getBlockTime() public view returns (uint256) {
        return block.timestamp;
    }
}
