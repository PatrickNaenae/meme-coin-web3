// SPDX-License-Identifier: UNLICENSED
// Indicates this is unlicensed code (not recommended for production use)
pragma solidity ^0.8.27;
// Requires Solidity compiler version 0.8.27 or higher

// Import dependencies
import {Token} from "./Token.sol"; // The Token contract we'll be creating
import "hardhat/console.sol"; // Hardhat console for debugging

/**
 * @title Token Factory
 * @dev A factory contract that creates ERC20 tokens and manages their sales
 * Features:
 * - Creates new Token contracts
 * - Manages token sales with dynamic pricing
 * - Handles fund collection and distribution
 */
contract Factory {
    // Constants
    uint256 public constant TARGET = 3 ether; // Fundraising target for the Factory Contract (3 ETH)
    uint256 public constant TOKEN_LIMIT = 500_000 ether; // Max tokens to sell to creators of the token (500,000 tokens)
    uint256 public immutable fee; // Creation fee (in wei) (set in constructor)
    address public owner; // Contract owner address (creator of the factory contract)

    // Token tracking
    uint256 public totalTokens; // Total tokens created by the factory
    address[] public tokens; // Array of all created token addresses
    mapping(address => TokenSale) public tokenToSale; // Mapping of token to sale info

    /**
     * @dev Struct representing a token sale
     * @param token The token contract address
     * @param name The token name
     * @param creator The original creator address of the token
     * @param sold Amount of tokens sold (in wei)
     * @param raised ETH raised (in wei)
     * @param isOpen Whether the sale is still active
     */
    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    // Events
    event Created(address indexed token); // Emitted when new token is created
    event Buy(address indexed token, uint256 amount); // Emitted on token purchase

    /**
     * @dev Constructor sets the creation fee and owner
     * @param _fee The fee required to create a new token (in wei)
     */
    constructor(uint256 _fee) {
        fee = _fee;
        owner = msg.sender; // Deployer becomes owner
    }

    /**
     * @dev Get sale information by index
     * @param _index The index in the tokens array
     * @return TokenSale struct with sale details
     */
    function getTokenSale(
        uint256 _index
    ) public view returns (TokenSale memory) {
        return tokenToSale[tokens[_index]];
    }

    /**
     * @dev Calculates the current token price based on amount sold
     * Implements a bonding curve where price increases with more tokens sold
     * @param _sold Amount of tokens already sold
     * @return cost Current price per token (in wei)
     */
    function getCost(uint256 _sold) public pure returns (uint256) {
        uint256 floor = 0.0001 ether; // Base price (0.0001 ETH) for first 10,000 tokens
        uint256 step = 0.0001 ether; // Price increment amount
        uint256 increment = 10000 ether; // Tokens sold before each price increase

        // Price increases by 0.0001 ETH every 10,000 tokens sold
        uint256 cost = (step * (_sold / increment)) + floor;
        return cost;
    }

    /**
     * @dev Creates a new ERC20 token
     * @param _name The token name
     * @param _symbol The token symbol
     * Requirements:
     * - Must send at least the required fee
     */
    function create(
        string memory _name,
        string memory _symbol
    ) external payable {
        require(msg.value >= fee, "Factory: Creator fee not met");

        // Deploy new Token contract with 1 million supply
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);

        // Store token address
        tokens.push(address(token));
        totalTokens++;

        // Initialize sale record
        TokenSale memory sale = TokenSale(
            address(token),
            _name,
            msg.sender,
            0, // Initial tokens sold
            0, // Initial ETH raised
            true // Sale is open
        );

        tokenToSale[address(token)] = sale;
        emit Created(address(token));
    }

    /**
     * @dev Purchase tokens from an active sale
     * @param _token The token contract address to buy
     * @param _amount Amount of tokens to purchase (in wei)
     * Requirements:
     * - Sale must be open
     * - Amount must be between 1 and 10,000 tokens
     * - Must send enough ETH to cover the cost
     */
    function buy(address _token, uint256 _amount) external payable {
        TokenSale storage sale = tokenToSale[_token];

        require(sale.isOpen == true, "Factory: Buying closed");
        require(_amount >= 1 ether, "Factory: Amount too low");
        require(_amount <= 10000 ether, "Factory: Amount exceeded");

        // Calculate current price and total cost
        uint256 cost = getCost(sale.sold);
        uint256 price = cost * (_amount / 10 ** 18);

        require(msg.value >= price, "Factory: Insufficient ETH received");

        // Update sale state
        sale.sold += _amount;
        sale.raised += price;

        // Close sale if targets reached
        if (sale.sold >= TOKEN_LIMIT || sale.raised >= TARGET) {
            sale.isOpen = false;
        }

        // Transfer tokens to buyer
        Token(_token).transfer(msg.sender, _amount);
        emit Buy(_token, _amount);
    }

    /**
     * @dev Finalize sale and distribute funds/tokens to creator
     * @param _token The token contract address to finalize
     * Requirements:
     * - Sale must be closed (targets reached)
     */
    function deposit(address _token) external {
        Token token = Token(_token);
        TokenSale memory sale = tokenToSale[_token];

        require(sale.isOpen == false, "Factory: Target not reached");

        // Transfer remaining tokens to creator
        token.transfer(sale.creator, token.balanceOf(address(this)));

        // Transfer raised ETH to creator
        (bool success, ) = payable(sale.creator).call{value: sale.raised}("");
        require(success, "Factory: ETH transfer failed");
    }

    /**
     * @dev Withdraw contract ETH (owner only)
     * @param _amount Amount to withdraw (in wei)
     * Requirements:
     * - Caller must be owner
     */
    function withdraw(uint256 _amount) external {
        require(msg.sender == owner, "Factory: Not owner");

        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Factory: ETH transfer failed");
    }
}
