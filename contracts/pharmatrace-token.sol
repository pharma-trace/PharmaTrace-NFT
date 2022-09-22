//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./token-interface.sol";

contract PTToken is ERC20, ERC20Burnable, Pausable, ReentrancyGuard, Ownable, Token_Interface {
    using SafeMath for uint256;

    mapping(address => uint256) private s_balances;
    mapping(address => bool) private s_controllers;
    mapping(address => uint256) private s_amounts;

    uint256 private s_totalSupply;
    uint256 private MAXSUP;
    uint256 immutable i_maximum_supply;

    constructor(
        uint256 maximum_supply,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        i_maximum_supply = maximum_supply * 10**18;
        s_controllers[msg.sender] = true;
        _mint(msg.sender, maximum_supply * 10**18);
    }

    //// receive
    receive() external payable {
        s_amounts[msg.sender] += msg.value;
        emit ReceivedCalled(msg.sender, msg.value);
    }

    //// fallback
    fallback() external payable {
        s_amounts[msg.sender] += msg.value;
        emit FallbackCalled(msg.sender, msg.value);
    }

    function mint(address to, uint256 amount) external nonReentrant {
        if (s_controllers[msg.sender]) revert PTToken__OnlyControllersCanMint();
        if ((MAXSUP + amount) <= i_maximum_supply) revert PTToken__MaximumSupplyHasBeenReached();
        s_totalSupply = s_totalSupply.add(amount);
        MAXSUP = MAXSUP.add(amount);
        s_balances[to] = s_balances[to].add(amount);
        _mint(to, amount);
        emit Mint(to, amount, s_balances[to]);
    }

    function burnFrom(address account, uint256 amount) public override nonReentrant {
        if (s_controllers[msg.sender]) {
            _burn(account, amount);
        } else {
            super.burnFrom(account, amount);
        }
        s_balances[account] = s_balances[account].sub(amount);
        emit Burn(account, amount, s_balances[account]);
    }

    function addController(address controller) external onlyOwner nonReentrant {
        s_controllers[controller] = true;
        emit AddController(owner(), controller);
    }

    function removeController(address controller) external onlyOwner nonReentrant {
        s_controllers[controller] = false;
        emit RemoveController(owner(), controller);
    }

    function checkController(address controller) public view returns (bool) {
        return s_controllers[controller];
    }

    function totalSupply() public view override returns (uint256) {
        return s_totalSupply;
    }

    function maxSupply() public view returns (uint256) {
        return i_maximum_supply;
    }

    function pauseContract() public onlyOwner {
        _pause();
    }

    function unpauseContract() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        require(!paused(), "ERC20Pausable: token transfer while paused");
    }
}
