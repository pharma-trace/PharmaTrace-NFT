// contracts/BadgeToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

interface Token_Interface {
    // 3. Interfaces, Libraries, Contracts
    error PTToken__OnlyControllersCanMint();
    error PTToken__MaximumSupplyHasBeenReached();

    // Events
    event ReceivedCalled(address indexed buyer, uint256 indexed amount);
    event FallbackCalled(address indexed buyer, uint256 indexed amount);
    event Mint(address indexed to, uint256 indexed amount, uint256 indexed balance);
    event Burn(address indexed to, uint256 indexed amount, uint256 indexed balance);
    event AddController(address indexed owner, address indexed controller);
    event RemoveController(address indexed owner, address indexed controller);
}
