const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title Factory Contract Tests
 * @dev Comprehensive test suite for the Factory smart contract
 */
describe("Factory", function () {
  // Constants
  const FEE = ethers.parseUnits("0.01", 18); // 0.01 ETH creation fee

  /**
   * @dev Fixture for deploying factory and creating initial token
   * @returns Deployed contracts and test accounts
   */
  async function deployFactoryFixture() {
    // Get test accounts
    const [deployer, creator, buyer] = await ethers.getSigners();

    // Deploy factory contract
    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy(FEE);

    // Creator creates a new token
    const transaction = await factory
      .connect(creator)
      .create("DAPP Uni", "DAPP", { value: FEE });
    await transaction.wait();

    // Get the deployed token address
    const tokenAddress = await factory.tokens(0);
    const token = await ethers.getContractAt("Token", tokenAddress);

    return { factory, token, deployer, creator, buyer };
  }

  /**
   * @dev Extended fixture that also executes a token purchase
   * @returns Same as deployFactoryFixture plus purchase data
   */
  async function buyTokenFixture() {
    const { factory, token, creator, buyer } = await deployFactoryFixture();

    const AMOUNT = ethers.parseUnits("10000", 18); // 10,000 tokens to buy
    const COST = ethers.parseUnits("1", 18); // 1 ETH purchase cost

    // Buyer purchases tokens
    const transaction = await factory
      .connect(buyer)
      .buy(await token.getAddress(), AMOUNT, { value: COST });
    await transaction.wait();

    return { factory, token, creator, buyer };
  }

  // ============================================
  // Test Suite: Deployment
  // ============================================
  describe("Deployment", function () {
    it("Should set the fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.fee()).to.equal(FEE);
    });

    it("Should set the owner", async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      expect(await factory.owner()).to.equal(deployer.address);
    });
  });

  // ============================================
  // Test Suite: Token Creation
  // ============================================
  describe("Creating", function () {
    it("Should set the token owner as factory", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.owner()).to.equal(await factory.getAddress());
    });

    it("Should set the correct creator address", async function () {
      const { token, creator } = await loadFixture(deployFactoryFixture);
      expect(await token.creator()).to.equal(creator.address);
    });

    it("Should mint the correct initial supply", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      const totalSupply = ethers.parseUnits("1000000", 18);
      expect(await token.balanceOf(await factory.getAddress())).to.equal(
        totalSupply
      );
    });

    it("Should collect the creation fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );
      expect(balance).to.equal(FEE);
    });

    it("Should initialize token sale correctly", async function () {
      const { factory, token, creator } = await loadFixture(
        deployFactoryFixture
      );
      const count = await factory.totalTokens();
      expect(count).to.equal(1);

      const sale = await factory.getTokenSale(0);
      expect(sale.token).to.equal(await token.getAddress());
      expect(sale.creator).to.equal(creator.address);
      expect(sale.sold).to.equal(0);
      expect(sale.raised).to.equal(0);
      expect(sale.isOpen).to.equal(true);
    });
  });

  // ============================================
  // Test Suite: Token Purchasing
  // ============================================
  describe("Buying", function () {
    const AMOUNT = ethers.parseUnits("10000", 18); // Test purchase amount
    const COST = ethers.parseUnits("1", 18); // Test purchase cost

    it("Should update factory ETH balance correctly", async function () {
      const { factory } = await loadFixture(buyTokenFixture);
      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );
      expect(balance).to.equal(FEE + COST); // Creation fee + purchase cost
    });

    it("Should transfer tokens to buyer", async function () {
      const { token, buyer } = await loadFixture(buyTokenFixture);
      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.equal(AMOUNT);
    });

    it("Should update sale statistics", async function () {
      const { factory, token } = await loadFixture(buyTokenFixture);
      const sale = await factory.tokenToSale(await token.getAddress());
      expect(sale.sold).to.equal(AMOUNT);
      expect(sale.raised).to.equal(COST);
      expect(sale.isOpen).to.equal(true); // Sale should still be open
    });

    it("Should increase token price according to bonding curve", async function () {
      const { factory, token } = await loadFixture(buyTokenFixture);
      const sale = await factory.tokenToSale(await token.getAddress());
      const cost = await factory.getCost(sale.sold);
      expect(cost).to.be.equal(ethers.parseUnits("0.0002")); // Price should increase
    });
  });

  // ============================================
  // Test Suite: Finalizing Sales
  // ============================================
  describe("Depositing", function () {
    const AMOUNT = ethers.parseUnits("10000", 18);
    const COST = ethers.parseUnits("2", 18);

    it("Should close sale and distribute funds correctly", async function () {
      const { factory, token, creator, buyer } = await loadFixture(
        buyTokenFixture
      );

      // Make additional purchase to reach target
      const buyTx = await factory
        .connect(buyer)
        .buy(await token.getAddress(), AMOUNT, { value: COST });
      await buyTx.wait();

      // Verify sale is closed
      const sale = await factory.tokenToSale(await token.getAddress());
      expect(sale.isOpen).to.equal(false);

      // Creator finalizes sale
      const depositTx = await factory
        .connect(creator)
        .deposit(await token.getAddress());
      await depositTx.wait();

      // Verify creator received remaining tokens (1,000,000 - 20,000 sold)
      const balance = await token.balanceOf(creator.address);
      expect(balance).to.equal(ethers.parseUnits("980000", 18));
    });
  });

  // ============================================
  // Test Suite: Fee Withdrawal
  // ============================================
  describe("Withdrawing Fees", function () {
    it("Should allow owner to withdraw collected fees", async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);

      // Owner withdraws creation fee
      const transaction = await factory.connect(deployer).withdraw(FEE);
      await transaction.wait();

      // Verify factory balance is empty
      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );
      expect(balance).to.equal(0);
    });
  });
});
