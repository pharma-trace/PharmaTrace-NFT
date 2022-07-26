// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../../marketplace.sol";

contract VaultFuzzTest is PTNFTMarketPlace {
    constructor() PTNFTMarketPlace() {}

    function echidna_test_market_item_creation() public view returns (bool) {
        if (getItemCounter() >= 1) {
            return true;
        }
    }
}
