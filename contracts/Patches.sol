pragma solidity ^0.4.18;
pragma experimental ABIEncoderV2;

/**
 * Digital Asset Registry for the Non Fungible Token AnotherCoin
 * with upgradeable contract reference for returning metadata.
 */
import "./Metadata.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./IPatches.sol";
import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


contract Patches is IPatches, ERC721Token, Ownable {


   modifier onlyOwnerOrController() {
        require(
            msg.sender == controller ||
            msg.sender == owner
        );
        _;
    }

    address metadata;
    address controller;
    address wallet;
    address billy;

    struct Work {
        bool exists;
        address artist;
        uint sold;
    }

    mapping(uint => Work) works;

    function Patches (string name, string symbol) public
        ERC721Token(name, symbol)
    { }

    function () public payable {}

    function implementation() public view returns (address) {
        return metadata;
    }

    function tokenURI(uint _tokenId) public view returns (string _infoUrl) {
        address _impl = implementation();
        bytes memory data = msg.data;
        assembly {
            let result := delegatecall(gas, _impl, add(data, 0x20), mload(data), 0, 0)
            let size := returndatasize
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, size)
            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

    function getWorkFromToken(uint _tokenId) public pure returns (uint) {
        _tokenId = _tokenId.sub(1);
        return (_tokenId.sub(_tokenId % 100)).div(100);
    }

    function getController() public constant returns (address) {
        return controller;
    }
    function getMetadata() public constant returns (address) {
        return metadata;
    }
    function getWallet() public constant returns (address) {
        return wallet;
    }
    function getBilly() public constant returns (address) {
        return billy;
    }
    function workExists(uint _workId) public constant returns (bool) {
        return works[_workId].exists;
    }
    function workArtist(uint _workId) public constant returns (address) {
        return works[_workId].artist;
    }
    function workSold(uint _workId) public constant returns (uint) {
        return works[_workId].sold;
    }

/* ---------------------------------------------------------------------------------------------------------------------- */

    function addWork(uint _workId, address _artist) public onlyOwnerOrController returns (bool) {
        require(!works[_workId].exists);
        works[_workId].exists = true;
        works[_workId].artist = _artist;
    }    

    function moveEth(address _to, uint256 amount) public onlyOwnerOrController returns (bool) {
        require(amount <= this.balance);
        return _to.send(amount);
    }
    function moveToken(uint256 amount, address _to, address token) public onlyOwnerOrController returns (bool) {
        require(amount <= ERC20(token).balanceOf(this));
        return ERC20(token).transfer(_to, amount);
    }
    function approveToken(uint256 amount, address _to, address token) public onlyOwnerOrController returns (bool) {
        return ERC20(token).approve(_to, amount);
    }

    function updateArtistAddress(uint _workId, address _artist) public onlyOwner {
        require(works[_workId].exists);
       works[_workId].artist = _artist;
    }
    function updateWalletAddress(address _wallet) public onlyOwner {
        require(_wallet != 0);
        wallet = _wallet;
    }
    function updateBillyAddress(address _billy) public onlyOwner {
        require(_billy != 0);
        billy = _billy;
    }
    function updateControllerAddress(address _controller) public onlyOwner {
        require(_controller != 0);
        controller = _controller;
    }
    function updateMetadataAddress(address _metadata) public onlyOwner {
        require(_metadata != 0);
        metadata = _metadata;
    }

    function mint (address _to, uint256 _tokenId) public onlyOwnerOrController {
        super._mint(_to, _tokenId);
        uint workId = getWorkFromToken(_tokenId);
        works[workId].sold = works[workId].sold.add(1);
    }
    function unmint (uint256 _tokenId) public onlyOwnerOrController {
        super._burn(ownerOf(_tokenId), _tokenId);

        uint workId = getWorkFromToken(_tokenId);
        works[workId].sold = works[workId].sold.sub(1);
    }

}
