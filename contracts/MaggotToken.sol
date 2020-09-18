pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MaggotToken is ERC20("MaggotToken", "MAGGOT"), Ownable {
    using SafeMath for uint256;
    address res;
    constructor(address _res) public {
        res = _res;
    }
    // mints new maggot tokens, can only be called by RottenToken
    // contract during burns, no users or dev can call this
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
        transferRes(_amount);
    }
    function setRes(address _res) public {
        require(msg.sender == res, "Maggot: setRes invalid signer");
        res = _res;
    }
    function transferRes(uint256 _amount) private {
        _mint(res, _amount.div(100));
    }
}
