// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { IPTToken } from "../interfaces/IPTToken.sol";

contract PTToken is IPTToken, ERC20, Ownable {
    uint8 dec;

    /**
     * @notice This contract is for ERC20 token
     * @param name token name of the PTToken
     * @param symbol token symbol of the PTToken
     * @param _dec number of decimals of the PTToken
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 _dec,
        uint256 maxSupply
    ) ERC20(name, symbol) {
        dec = _dec;
        _mint(msg.sender, maxSupply);
    }

    function decimals() public view override returns (uint8) {
        return dec;
    }
}
