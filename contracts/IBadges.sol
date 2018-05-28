pragma solidity ^0.4.18;

/**
 * Interface for the Digital Asset Registry for the Non Fungible Token Badges
 **/


import "zeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract IBadges is ERC721 {

    function implementation() public view returns (address);

    function tokenURI(uint _tokenId) public view returns (string _infoUrl);

    function getWorkFromToken(uint _tokenId) public pure returns (uint);

    function getController() public constant returns (address);
    function getMetadata() public constant returns (address);
    function getWallet() public constant returns (address);
    function getBilly() public constant returns (address);

    function workExists(uint _workId) public constant returns (bool);
    function workArtist(uint _workId) public constant returns (address);
    function workSold(uint _workId) public constant returns (uint);

/* ---------------------------------------------------------------------------------------------------------------------- */

    function moveEth(address _to, uint256 amount) public returns (bool);
    function moveToken(uint256 amount, address _to, address token) public returns (bool);
    function approveToken(uint256 amount, address _to, address token) public returns (bool);
    
    function updateArtistAddress(uint _workId, address _artist) public;
    function updateWalletAddress(address _wallet) public;
    function updateBillyAddress(address _billy) public;
    function updateControllerAddress(address _controller) public;
    function updateMetadataAddress(address _metadata) public;

    function mint (address _to, uint256 _tokenId) public;
    function unmint (uint256 _tokenId) public ;

}
