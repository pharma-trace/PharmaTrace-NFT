const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { PTMinter } = require("../../lib")

const { developmentChains } = require("../../helper.config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("PT-NFT ", function () {
          let ptNFT, minter, redeemer, PTNFTMarketPlaceContract, PTNFTMarketPlace, ptNFTContract
          beforeEach(async function () {
              // deploy the contract on hard hardhat-deploy we will used
              // deployments -> it will run all the deployment script with tag
              ;[minter, redeemer, _] = await ethers.getSigners()
              //   minter = (await getNamedAccounts()).deployer
              //   console.log("minter => ", minter)
              console.log("redeemer => ", redeemer)

              //   await deployments.fixture("all") // it will run all the deployment file tag == > all
              ptNFTContract = await ethers.getContract("PTNFT") // Returns a new connection to the Raffle contract
              ptNFT = ptNFTContract.connect(minter)
              PTNFTMarketPlaceContract = await ethers.getContract("PTNFTMarketPlace")
              PTNFTMarketPlace = await PTNFTMarketPlaceContract.connect(minter)
              console.log("ptNFT", ptNFT.address)

              console.log("PTNFTMarketPlace", PTNFTMarketPlace.address)
          })

          describe("PTNFTMarketPlace Onchain Testing ", function () {
              //   it("check getMarketItem check market item is create valid", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       let sendEther = ethers.utils.parseEther("0.001")
              //       let minPrice = ethers.utils.parseEther("0.001")

              //       //   const voucher = await ptMinter.createVoucher(
              //       //       1,
              //       //       "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //       //       minPrice
              //       //   )
              //       //   console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
              //       //   var txResponse
              //       //   var txResponse = await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //       //       value: sendEther,
              //       //   })
              //       //   await txResponse.wait(1)
              //       //   txResponse = await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
              //       //   await txResponse.wait(1)
              //       txResponse = await ptNFT.approve(PTNFTMarketPlace.address, 1)
              //       await txResponse.wait(1)

              //       txResponse = await PTNFTMarketPlace.createMarketItem(
              //           1,
              //           minPrice,
              //           false,
              //           1,
              //           ptNFT.address
              //       )
              //       await txResponse.wait(1)

              //       var res = await PTNFTMarketPlace.getMarketItem(ptNFT.address, 1)
              //       console.log("Create Market Place Item", res)
              //       //   assert.equal(res.tokenId.toString(), "1")
              //       //   assert.equal(res.seller.toString(), minter.address.toString())
              //       //   assert.equal(res.buyer.toString(), "0x0000000000000000000000000000000000000000")
              //       //   assert.equal(res.minPrice.toString(), minPrice.toString())
              //       //   assert.equal(res.isFixedPrice.toString(), "false")
              //       //   assert.equal(res.state.toString(), "0")
              //   })
              //   it("check WithDrawFund event ", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       let sendEther = ethers.utils.parseEther("0.4")
              //       let minPrice = ethers.utils.parseEther("0.1")

              //       const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
              //           value: sendEther,
              //       }) // emit RefundOfferAmount
              //       await txResponse.wait(1) // waits 1 block

              //       await expect(PTNFTMarketPlace.withDrawOfferFromMarket(ptNFT.address, 1)).to.emit(
              //           PTNFTMarketPlace,
              //           "WithDrawFromOffer"
              //       ) // transfer from null address to minter
              //   })

              it("check deleteMarketItem with event", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  await expect(PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)).to.emit(
                      PTNFTMarketPlace,
                      "MarketItemDelete"
                  )
              })
          })
      })
