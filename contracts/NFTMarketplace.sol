// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTMarketplace is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Pausable,
    Ownable
{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _itemSoldCounter;

    uint256 listingPrice = 0.025 ether;

    mapping(uint256 => MarketItem) private idToMarketIitem;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    constructor() ERC721("Metaverse Tokens", "METT") {}

    /* Updates the listing price of the contract */
    function updateListingPrice(uint256 _listingPrice)
        public
        payable
        onlyOwner
    {
        listingPrice = _listingPrice;
    }

    /* Mints a token and lists it in the marketplace */
    function createToken(string memory uri, uint256 price)
        external
        payable
        returns (uint256)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint.
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        // Create market item by minted token.
        createMarketItem(tokenId, price);

        return tokenId;
    }

    function createMarketItem(uint256 tokenId, uint256 price) private {
        require(price > 0, "Price must be at least 1");
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );

        // Transfer token from seller to the Marketplace.
        _transfer(msg.sender, address(this), tokenId);

        // Add item to MarketItem.
        idToMarketIitem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        // Emit event: MarketItemCreated.
        emit MarketItemCreated(
            tokenId,
            msg.sender,
            address(this),
            price,
            false
        );
    }

    /* Allows someone to resell a token they have purchased */
    function resellToken(uint256 tokenId, uint256 price) public payable {
        require(
            idToMarketIitem[tokenId].owner == msg.sender,
            "Only item owner can perform this peration"
        );
        require(
            msg.value == listingPrice,
            "Price must be equal to listing price"
        );

        // Transfer token from reseller to Marketplace.
        _transfer(msg.sender, address(this), tokenId);

        // Update properties of the resold NFT.
        idToMarketIitem[tokenId].sold = false;
        idToMarketIitem[tokenId].price = price;
        idToMarketIitem[tokenId].seller = payable(msg.sender);
        idToMarketIitem[tokenId].owner = payable(address(this));

        // Decrement number of items sold.
        _itemSoldCounter.decrement();
    }

    /* Creates the sale of a marketplace item */
    /* Transfers ownership of the item, as well as funds between parties */
    function createMarketSale(uint256 tokenId) public payable {
        require(
            msg.value == idToMarketIitem[tokenId].price,
            "Please submit the asking price in order to complete the purchase"
        );

        // Transfer token from Marketplace to purchaser.
        _transfer(address(this), msg.sender, tokenId);

        // Transfer listingPrice to Marketplace owner.
        payable(owner()).transfer(listingPrice);
        // Transfer NFT price to NFT seller.
        payable(idToMarketIitem[tokenId].seller).transfer(msg.value);

        // Update properties of the sold NFT.
        idToMarketIitem[tokenId].owner = payable(msg.sender);
        idToMarketIitem[tokenId].sold = true;
        idToMarketIitem[tokenId].seller = payable(address(0));

        // Increment number of items sold.
        _itemSoldCounter.increment();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
