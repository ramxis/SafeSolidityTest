const { expect } = require("chai")
const { ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const hre = require("hardhat")
const GnosisSafeCompiled = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json")
const GnosisSafeProxyCompiled = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxy.sol/GnosisSafeProxy.json")
const { executeContractCallWithSigners, calculateSafeTransactionHash, buildContractCall } = require("./utils/execution")

describe("TokenWithdrawalModule", async () => {
  const ADDRESS_0 = "0x0000000000000000000000000000000000000000"

  beforeEach(async () => {})

  // Fixture to setup environment and contracts for testing
  async function deployGnosisSafeFixture() {
    const [owner1, owner2, addr1, addr2] = await ethers.getSigners()

    // Create Master Copy
    const GnosisSafe = await ethers.getContractFactory(GnosisSafeCompiled.abi, GnosisSafeCompiled.bytecode)
    const gnosisSafeMasterCopy = await GnosisSafe.connect(owner1).deploy()
    await gnosisSafeMasterCopy.deployed()

    const GnosisSafeProxy = await ethers.getContractFactory(
      GnosisSafeProxyCompiled.abi,
      GnosisSafeProxyCompiled.bytecode
    )
    const proxy = await GnosisSafeProxy.connect(owner1).deploy(gnosisSafeMasterCopy.address)
    await proxy.deployed()

    const gnosisSafe = await GnosisSafe.attach(proxy.address)

    // setup the safe with 3 owners and a threshold of 2
    await gnosisSafe
      .connect(owner1)
      .setup([owner1.address, owner2.address, addr2.address], 2, ADDRESS_0, "0x", ADDRESS_0, ADDRESS_0, 0, ADDRESS_0)

    // instantiate and deploy unicorn token contract
    const UnicornToken = await ethers.getContractFactory("UnicornToken")
    const unicornToken = await UnicornToken.connect(owner1).deploy()
    await unicornToken.deployed()

    // deploy our safe module
    const TokenModule = await ethers.getContractFactory("TokenWithdrawalModule")
    const tokenModule = await TokenModule.connect(owner1).deploy(unicornToken.address, gnosisSafe.address)
    await tokenModule.deployed()

    // transfer 50 unicorn tokens to safe
    const tx = await unicornToken.connect(owner1).transfer(gnosisSafe.address, ethers.utils.parseEther("50"))
    tx.wait()

    return { gnosisSafe, unicornToken, tokenModule, owner1, owner2, addr1, addr2 }
  }

  describe("Testing TokenWithdrawalModule", async () => {
    // testing normal token transfer using threshold signatures
    it("should unicorn tokens from safe to owner2 using threshold signature scheme", async () => {
      const { gnosisSafe, unicornToken, owner1, owner2 } = await loadFixture(deployGnosisSafeFixture)

      // safe should have 50 unicorn tokens after fixture is loaded
      const safeinitialTokenBalance = ethers.utils.formatEther(await unicornToken.balanceOf(gnosisSafe.address))

      const owner2InitialTokenBalance = ethers.utils.formatEther(await unicornToken.balanceOf(owner2.address))
      const txHash = calculateSafeTransactionHash(
        gnosisSafe,
        buildContractCall(
          unicornToken,
          "transfer",
          [owner2.address, ethers.utils.parseEther("10")],
          await gnosisSafe.nonce()
        ),
        hre.network.config.chainId
      )

      await expect(
        executeContractCallWithSigners(
          gnosisSafe,
          unicornToken,
          "transfer",
          [owner2.address, ethers.utils.parseEther("10")],
          [owner1, owner2]
        )
      )
        .to.emit(gnosisSafe, "ExecutionSuccess")
        .withArgs(txHash, 0)

      const safefinalTokenBalance = ethers.utils.formatEther(await unicornToken.balanceOf(gnosisSafe.address))
      const owner2FinalTokenBalance = ethers.utils.formatEther(await unicornToken.balanceOf(owner2.address))

      expect(safeinitialTokenBalance).to.be.equal("50.0")
      // owner2 should not have any unicorn tokens to begin with
      expect(owner2InitialTokenBalance).to.be.equal("0.0")
      // safe unicornToken balance should go down by 10
      expect(safefinalTokenBalance).to.be.equal("40.0")
      // owner2 should have 10 unicorn tokens after transfer from safe
      expect(owner2FinalTokenBalance).to.be.equal("10.0")
    })

    it("Should emit an event when our module is enabled", async () => {
      const { gnosisSafe, tokenModule, owner1, owner2 } = await loadFixture(deployGnosisSafeFixture)

      await expect(
        executeContractCallWithSigners(gnosisSafe, gnosisSafe, "enableModule", [tokenModule.address], [owner1, owner2])
      )
        .to.emit(gnosisSafe, "EnabledModule")
        .withArgs(tokenModule.address)

      await expect(await gnosisSafe.isModuleEnabled(tokenModule.address)).to.be.true
    })

    it("function 'withdrawTokensUsingSignatures' should revert if safe does not have sufficient unicorn tokens", async () => {
      const { gnosisSafe, tokenModule, owner1, owner2, addr1 } = await loadFixture(deployGnosisSafeFixture)

      await executeContractCallWithSigners(
        gnosisSafe,
        gnosisSafe,
        "enableModule",
        [tokenModule.address],
        [owner1, owner2]
      )

      await expect(await gnosisSafe.isModuleEnabled(tokenModule.address)).to.be.true

      // generate the offline message to allow any one who knows the signature to withdraw tokens
      const message = "transfer 10 coins to bob"
      const messageHash = ethers.utils.solidityKeccak256(["string"], [message])
      const messageHashBinary = ethers.utils.arrayify(messageHash)
      const signature = await owner1.signMessage(messageHashBinary)

      // safe only holds 50 token from the initial setup and addr1 is trying to withdraw 60
      await expect(
        tokenModule
          .connect(addr1)
          .withdrawTokensUsingSignatures(addr1.address, ethers.utils.parseEther("60"), signature, messageHash)
      ).to.be.revertedWith("Insufficient balance")
    })

    it("function 'withdrawTokensUsingSignatures' should revert if the message is not signed by the safe owner", async () => {
      const { gnosisSafe, tokenModule, owner1, owner2, addr1 } = await loadFixture(deployGnosisSafeFixture)

      await executeContractCallWithSigners(
        gnosisSafe,
        gnosisSafe,
        "enableModule",
        [tokenModule.address],
        [owner1, owner2]
      )

      await expect(await gnosisSafe.isModuleEnabled(tokenModule.address)).to.be.true

      // addr1 tries to generate the offline message to allow him/her to withdraw from owner1's safe
      const message = "transfer 10 coins to bob"
      const messageHash = ethers.utils.solidityKeccak256(["string"], [message])
      const messageHashBinary = ethers.utils.arrayify(messageHash)
      const signature = await addr1.signMessage(messageHashBinary)

      // message was generated by addr1 instead of one of the owners
      await expect(
        tokenModule
          .connect(addr1)
          .withdrawTokensUsingSignatures(addr1.address, ethers.utils.parseEther("10"), signature, messageHash)
      ).to.be.revertedWith("only message signed by a safe owner is accepted")
    })

    it("function 'withdrawTokensUsingSignatures' should allow anyone to withdraw x amounts of token provided they have the valid signtaures from the safe owners", async () => {
      const { gnosisSafe, unicornToken, tokenModule, owner1, owner2, addr1 } = await loadFixture(
        deployGnosisSafeFixture
      )

      await executeContractCallWithSigners(
        gnosisSafe,
        gnosisSafe,
        "enableModule",
        [tokenModule.address],
        [owner1, owner2]
      )

      await expect(await gnosisSafe.isModuleEnabled(tokenModule.address)).to.be.true

      // generate the offline message to allow any one who knows the signature to withdraw tokens
      const message = "transfer 10 coins to bob"
      const messageHash = ethers.utils.solidityKeccak256(["string"], [message])
      const messageHashBinary = ethers.utils.arrayify(messageHash)
      const signature = await owner1.signMessage(messageHashBinary)

      await tokenModule
        .connect(addr1)
        .withdrawTokensUsingSignatures(addr1.address, ethers.utils.parseEther("10"), signature, messageHash)

      // check final token balance after token transfers from the safe using TokenModule
      const safeTokenBalance = ethers.utils.formatEther(await unicornToken.balanceOf(gnosisSafe.address))
      const addr1TokenBalance = ethers.utils.formatEther(await unicornToken.balanceOf(addr1.address))

      // safe unicornToken balance should go down by 10
      expect(safeTokenBalance).to.be.equal("40.0")
      // owner2 should have 10 unicorn tokens after transfer from safe
      expect(addr1TokenBalance).to.be.equal("10.0")
    })
  })
})
