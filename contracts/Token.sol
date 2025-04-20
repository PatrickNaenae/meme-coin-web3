// SPDX-License-Identifier: UNLICENSED
// Specifies that the contract is unlicensed (not recommended for production)
pragma solidity ^0.8.27;
// Pragma directive defining the Solidity compiler version (0.8.27 or newer)

// Importing the standard ERC20 implementation from OpenZeppelin
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Token
 * @dev An ERC20 token contract with additional owner and creator tracking
 * Inherits from OpenZeppelin's ERC20 implementation for standard token functionality
 */
contract Token is ERC20 {
    // State variables
    address payable public owner; // The current owner of the contract (can receive ETH)
    address public creator; // The original creator of the token (immutable)

    /**
     * @dev Constructor function that initializes the token
     * @param _creator The address of the token creator
     * @param _name The name of the token (e.g., "My Token")
     * @param _symbol The symbol of the token (e.g., "MTK")
     * @param _totalSupply The initial total supply of tokens (in smallest units)
     *
     * The constructor:
     * 1. Initializes the ERC20 token with name and symbol
     * 2. Sets the deployer (msg.sender) as the initial owner
     * 3. Records the creator address
     * 4. Mints the total supply to the owner's address
     */
    constructor(
        address _creator,
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) ERC20(_name, _symbol) {
        // Set the contract deployer as the owner (payable to receive funds)
        owner = payable(msg.sender);

        // Record the creator address (immutable after deployment)
        creator = _creator;

        // Mint the total supply to the owner's address
        _mint(msg.sender, _totalSupply);
    }

    // Note: The contract inherits all standard ERC20 functions from OpenZeppelin:
    // - transfer()
    // - transferFrom()
    // - approve()
    // - allowance()
    // - balanceOf()
    // - totalSupply()
    // Plus all the internal functions and events defined in ERC20.sol
}
