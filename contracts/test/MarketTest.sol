// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { PTMarket } from "../core/PTMarket.sol";
import { PTCollection } from "../core/PTCollection.sol";
import { MockToken } from "../mocks/MockToken.sol";
import "../libraries/Helper.sol";

contract MarketTest {
    MockToken public immutable token;
    PTCollection public immutable collection;
    PTMarket public immutable market;

    constructor() {
        market = new PTMarket();
        collection = new PTCollection(
            address(market),
            "Pharma Trace",
            "PTNFT",
            "PT-Voucher",
            "1"
        );
        token = new MockToken("Mock Token", "MOCK", 18);

        market.whitelistCurrency(address(token), true);
        market.whitelistCollection(address(collection));
    }
    
    function listItem(
        address collection,
        uint256 tokenId,
        address currency,
        uint256 minPrice,
        uint256 expiresAt,
        bool isFixedPrice
    ) public {
        market.listItem(collection, tokenId, currency, minPrice, expiresAt, isFixedPrice);
    }

    function buyItem(address collection, uint256 tokenId) public {
        market.buyItem(collection, tokenId);
    }

    function buyLazzNFT(address collection, NFTVoucher calldata voucher) public {
        market.buyLazzNFT(collection, voucher);
    }

    function createOffer(address collection, uint256 tokenId, uint256 offerPrice) public {
        market.createOffer(collection, tokenId, offerPrice);
    }

    function createLazzOffer(address collection, NFTVoucher calldata voucher, uint256 offerPrice) public {
        market.createLazzOffer(collection, voucher, offerPrice);
    }

    function acceptOffer(address collection, uint256 tokenId, bool acceptOrReject) public {
        market.acceptOffer(collection, tokenId, acceptOrReject);
    }

    function unlistItem(address collection, uint256 tokenId) public {
        market.unlistItem(collection, tokenId);
    }

    function withdrawOffer(address collection, uint256 tokenId) public {
        market.withdrawOffer(collection, tokenId);
    }

    function echidna_void() public view returns (bool) {
        return true;
    }
}
