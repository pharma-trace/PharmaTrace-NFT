const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { PTMinter } = require("../../lib/")

const { developmentChains } = require("../../helper.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("PT-NFT ", function () {
          let ptNFT, minter, redeemer
          beforeEach(async function () {
              // deploy the contract on hard hardhat-deploy we will used
              // deployments -> it will run all the deployment script with tag
              ;[minter, redeemer, _] = await ethers.getSigners()
              await deployments.fixture("all") // it will run all the deployment file tag == > all
              ptNFT = await ethers.getContract("PTNFT", minter)
              console.log("ptNFT")
          })
          describe("Mint First ptNFT ", function () {
              it("Should redeem an NFT from a signed voucher", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC"
                  )
                  console.log("voucher", voucher)
                  //   var res = await ptNFT.redeem(redeemer.address, minter.address, voucher)
                  await expect(ptNFT.redeem(redeemer.address, minter.address, voucher))
                      .to.emit(ptNFT, "Transfer") // transfer from null address to minter
                      .withArgs(
                          "0x0000000000000000000000000000000000000000",
                          minter.address,
                          voucher.tokenId
                      )
                      .and.to.emit(ptNFT, "Transfer") // transfer from minter to redeemer
                      .withArgs(minter.address, redeemer.address, voucher.tokenId)
              })

              it("Should fail to redeem an NFT that's already been claimed", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC"
                  )

                  await expect(ptNFT.redeem(redeemer.address, minter.address, voucher))
                      .to.emit(ptNFT, "Transfer") // transfer from null address to minter
                      .withArgs(
                          "0x0000000000000000000000000000000000000000",
                          minter.address,
                          voucher.tokenId
                      )
                      .and.to.emit(ptNFT, "Transfer") // transfer from minter to redeemer
                      .withArgs(minter.address, redeemer.address, voucher.tokenId)
                  await expect(
                      ptNFT.redeem(redeemer.address, minter.address, voucher)
                  ).to.be.revertedWith("ERC721: token already minted")
              })

              it("Should fail to redeem an NFT voucher that's been modified", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC"
                  )

                  voucher.tokenId = 2
                  await expect(
                      ptNFT.redeem(redeemer.address, minter.address, voucher)
                  ).to.be.revertedWith("Signature invalid or unauthorized")
              })

              it("Should transfer check balance", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })

                  let voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC"
                  )
                  await ptNFT.redeem(redeemer.address, minter.address, voucher)
                  voucher = await ptMinter.createVoucher(
                      2,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC"
                  )
                  await ptNFT.redeem(redeemer.address, minter.address, voucher)
                  var res = await ptNFT.balanceOf(redeemer.address)
                  console.log(" balance ", res.toString())
                  assert.equal(res.toString(), 2)
              })
          })
      })
