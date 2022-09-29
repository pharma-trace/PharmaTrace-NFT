// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "../libraries/Helper.sol";
import { IPTCollection } from "../interfaces/IPTCollection.sol";

contract PTCollection is IPTCollection, ERC721URIStorage, EIP712, AccessControl {
    // State variables
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Modifiers
    modifier onlyMarketPlace() {
        if (!hasRole(MINTER_ROLE, msg.sender)) revert PTNFT__ONLYMARKETPLACE();
        _;
    }
    // Events Lazz NFT
    event RedeemVoucher(address indexed signer, uint256 indexed tokenId, address indexed redeemer);

    constructor(
        address marketPlace,
        string memory name,
        string memory symbol,
        string memory signingDomain,
        string memory signatureVersion
    ) ERC721(name, symbol) EIP712(signingDomain, signatureVersion) {
        _setupRole(MINTER_ROLE, marketPlace); // this for ristricty only audit contract will call this
    }

    /// @notice Redeems an NFTVoucher for an actual NFT, creating it in the process.
    /// @param redeemer The address of the account which will receive the NFT upon success.
    /// @param voucher A signed NFTVoucher that describes the NFT to be redeemed.
    function redeem(
        address redeemer,
        NFTVoucher calldata voucher /*onlyMarketPlace*/
    )
        external
        onlyMarketPlace /*returns (uint256)*/
    {
        // make sure signature is valid and get the address of the signer
        address signer = verifySignature(voucher);

        // first assign the token to the signer, to establish provenance on-chain
        _safeMint(signer, voucher.tokenId);
        _setTokenURI(voucher.tokenId, voucher.uri);

        // transfer the token to the redeemer
        _safeTransfer(signer, redeemer, voucher.tokenId, "");
        emit RedeemVoucher(signer, voucher.tokenId, redeemer);
        // return voucher.tokenId;
    }

    /// @notice Returns a hash of the given NFTVoucher, prepared using EIP712 typed data hashing rules.
    /// @param voucher An NFTVoucher to hash.
    function _hash(NFTVoucher calldata voucher) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256("NFTVoucher(uint256 tokenId, string uri)"),
                        voucher.tokenId,
                        keccak256(bytes(voucher.uri))
                    )
                )
            );
    }

    /// @notice Verifies the signature for a given NFTVoucher, returning the address of the signer.
    /// @dev Will revert if the signature is invalid. Does not verify that the signer is authorized to mint NFTs.
    /// @param voucher An NFTVoucher describing an unminted NFT.
    function verifySignature(NFTVoucher calldata voucher) public view onlyMarketPlace returns (address) {
        bytes32 digest = _hash(voucher);
        return ECDSA.recover(digest, voucher.signature);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl, ERC721) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }
}
