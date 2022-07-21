const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { PTMinter } = require("../../lib")

const { developmentChains } = require("../../helper.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("PT-NFT ", function () {
          let ptNFT, minter, redeemer, PTNFTMarketPlaceContract, PTNFTMarketPlace, ptNFTContract
          beforeEach(async function () {
              // deploy the contract on hard hardhat-deploy we will used
              // deployments -> it will run all the deployment script with tag
              ;[minter, redeemer, _] = await ethers.getSigners()
              await deployments.fixture("all") // it will run all the deployment file tag == > all
              ptNFTContract = await ethers.getContract("PTNFT") // Returns a new connection to the Raffle contract
              ptNFT = ptNFTContract.connect(minter)
              PTNFTMarketPlaceContract = await ethers.getContract("PTNFTMarketPlace")
              PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)

              console.log("ptNFT")
          })
          describe("PTNFTMarketPlace createMarketItem ", function () {
              it("check createMarketItem minPrice not less the zero it should be greater", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.0")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await expect(
                      PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  ).to.be.revertedWith("PTNFTMarketPlace__ZeroExpiredNoOfDaysAndMinPrice")
              })
              it("check createMarketItem without approval of the owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await expect(
                      PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check createMarketItem with approval of the owner to marketplace", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await expect(
                      PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  ).to.emit(PTNFTMarketPlace, "MarketItemCreated")
              })
              it("check createMarketItem not a owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await expect(
                      PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  ).to.be.revertedWith("PTNFTMarketPlace__NoTheOwnerOfNFT")
              })
          })

          describe("PTNFTMarketPlace deleteMarketItem ", function () {
              it("check deleteMarketItem invalid item id", async function () {
                  await expect(PTNFTMarketPlace.deleteMarketItem(3)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check deleteMarketItem with event", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  await expect(PTNFTMarketPlace.deleteMarketItem(1)).to.emit(
                      PTNFTMarketPlace,
                      "MarketItemDelete"
                  )
              })
              it("check deleteMarketItem not a owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)

                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  var res = await PTNFTMarketPlace.getItemCounter()
                  console.log("res", res.toString())
                  await expect(PTNFTMarketPlace.deleteMarketItem(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__NoTheOwnerOfNFT"
                  )
              })
              it("check deleteMarketItem try to inactive MarketPlace Item", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)

                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  var res = await PTNFTMarketPlace.fetchActiveItems()
                  console.log("res", res.toString())
                  await PTNFTMarketPlace.deleteMarketItem(1)
                  res = await PTNFTMarketPlace.fetchActiveItems()
                  console.log("res", res.toString())
                  await expect(PTNFTMarketPlace.deleteMarketItem(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemMustBeOnMarket"
                  )
              })
          })

          describe("PTNFTMarketPlace createOffer ", function () {
              it("check createOffer offer for item not exist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await expect(PTNFTMarketPlace.createOffer(1, 1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check createOffer fail on when fixed price item get offer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, true, 1)
                  var res = await PTNFTMarketPlace.fetchActiveItems()
                  console.log("res", res.toString())
                  await expect(PTNFTMarketPlace.createOffer(1, 1)).to.be.revertedWith(
                      "PTNFTMarketPlace__FixedPirceMarketItem"
                  )
              })
              it("check createOffer fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await PTNFTMarketPlace.deleteMarketItem(1)
                  await expect(PTNFTMarketPlace.createOffer(1, 1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemMustBeOnMarket"
                  )
              })
              it("check createOffer fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check createOffer fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.createOffer(1, 1)).to.be.revertedWith(
                      "PTNFTMarketPlace__MarketItemExpired"
                  )
              })
              it("check createOffer fail if insufficent fund transfer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.1")

                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.01")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__InsufficientFund")
              })
              it("check createOffer with minPrice", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.1")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, {
                          value: sendEther,
                          gasLimit: 4100000,
                      })
                  ).to.emit(PTNFTMarketPlace, "CreateOffer")
              })
              it("check createOffer refund extra Amount", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.6")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.6")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  const startingFundMeBalance = await PTNFTMarketPlace.provider.getBalance(
                      minter.address
                  )
                  console.log("startingFundMeBalance", startingFundMeBalance.toString())
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1) // waits 1 block
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  let withdrawGasCost = gasUsed.mul(effectiveGasPrice)
                  const endingDeployerBalance = await PTNFTMarketPlace.provider.getBalance(
                      minter.address
                  )
                  withdrawGasCost = withdrawGasCost.add(maxPrice)
                  console.log(
                      "txReceipt.events",
                      endingDeployerBalance.add(withdrawGasCost).toString()
                  )
                  assert.equal(
                      startingFundMeBalance.toString(),
                      endingDeployerBalance.add(withdrawGasCost).toString()
                  )
              })
              it("check createOffer Offer Created", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1) // waits 1 block
                  var res = await PTNFTMarketPlace.getMarketOffer(1)
                  console.log(
                      "res",
                      res.tokenId.toString(),
                      res.offerAmount.toString(),
                      res.offerBy
                  )
                  assert.equal(res.tokenId.toString(), voucher.tokenId.toString())
                  assert.equal(res.offerAmount.toString(), sendEther.toString())
                  assert.equal(res.offerBy, minter.address)
              })
              it("check createOffer Offer the amount which is less then current offer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  let txReceipt = await txResponse.wait(1)
                  sendEther = ethers.utils.parseEther("0.3")

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__NotExceedCurrentOffer")
              })
              it("check createOffer Offer the amount which is more then current offer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.3")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  await txResponse.wait(1) // waits 1 block
                  //   var blocktime = await PTNFTMarketPlace.getBlockTime()
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  var res = await PTNFTMarketPlace.getOffer(1)
                  console.log("res", res.offerBy.toString(), res.offerAmount.toString())
                  sendEther = ethers.utils.parseEther("0.45")
                  txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  })
                  res = await PTNFTMarketPlace.getMarketOffer(1)
                  //   console.log("txResponse", txResponse)
                  console.log("res", res.offerBy.toString(), res.offerAmount.toString())
                  assert.equal(res.offerBy, redeemer.address)
              })
              it("check createOffer on new offer does old amount is move to Refund Offer Amount", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.3")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  await txResponse.wait(1) // waits 1 block
                  //   var blocktime = await PTNFTMarketPlace.getBlockTime()
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  var res = await PTNFTMarketPlace.getOffer(1)
                  console.log("res", res.offerBy.toString(), res.offerAmount.toString())
                  sendEther = ethers.utils.parseEther("0.45")
                  txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  })
                  //   console.log("txResponse", txResponse)
                  var refundOfferAmount = await PTNFTMarketPlace.getRefundOfferAmounts(
                      minter.address
                  )
                  sendEther = ethers.utils.parseEther("0.4")
                  console.log("refundOfferAmount", refundOfferAmount.toString())
                  assert.equal(refundOfferAmount.toString(), sendEther.toString())
              })
              it("check createOffer redeem NFT voucher Offer will Close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.5")
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)

                  var txResponse = await PTNFTMarketPlace.buy(1, {
                      value: sendEther,
                  })
                  var txReceipt = await txResponse.wait(1) // waits 1 block

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__ItemMustBeOnMarket")
              })
          })

          describe("PTNFTMarketPlace buy ", function () {
              it("check buyMarketplace offer for item not exist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await expect(PTNFTMarketPlace.buy(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check buyMarketplace fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await PTNFTMarketPlace.deleteMarketItem(1)
                  await expect(PTNFTMarketPlace.buy(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemMustBeOnMarket"
                  )
              })
              it("check buyMarketplace fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)
                  await expect(PTNFTMarketPlace.buy(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__PermissionRequired"
                  )
              })
              it("check buyMarketplace fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.buy(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__MarketItemExpired"
                  )
              })
              it("check buyMarketplace send less the max Price", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await expect(
                      PTNFTMarketPlace.buy(1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__InsufficientFund")
              })
              it("check buyMarketplace redeem NFT voucher", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)

                  await expect(
                      PTNFTMarketPlace.buy(1, {
                          value: sendEther,
                      })
                  ).to.emit(PTNFTMarketPlace, "BuyMarketPlaceItem") // transfer from null address to minter

                  //   var res = await ptNFT.balanceOf(redeemer.address)
                  //   var resURI = await ptNFT.tokenURI(1)
                  //   console.log("res", res.toString(), resURI.toString())
              })
              it("check buyMarketplace redeem NFT voucher Offer will Close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await PTNFTMarketPlace.buy(1, {
                      value: sendEther,
                  })

                  var offer = await PTNFTMarketPlace.getMarketOffer(1)
                  console.log("offer", offer.status)
                  assert.equal(offer.status.toString(), "1")
              })
          })
          describe("PTNFTMarketPlace acceptOffer ", function () {
              it("check acceptOffer offer for item not exist", async function () {
                  await expect(PTNFTMarketPlace.acceptOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check acceptOffer fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await PTNFTMarketPlace.deleteMarketItem(1)
                  await expect(PTNFTMarketPlace.acceptOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemMustBeOnMarket"
                  )
              })
              it("check acceptOffer fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await expect(
                      PTNFTMarketPlace.acceptOffer(1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check acceptOffer try to accept offer but not owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  await expect(
                      PTNFTMarketPlace.acceptOffer(1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__OnlyOwnerAcceptOffer")
              })
              it("check acceptOffer fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.acceptOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__MarketItemExpired"
                  )
              })
              it("check acceptOffer fail on offer expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.acceptOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__OfferTimeExpired"
                  )
              })
              it("check acceptOffer fail on no offer expist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)

                  await expect(PTNFTMarketPlace.acceptOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__NoOfferExist"
                  )
              })

              it("check acceptOffer Buy NFT", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.234")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)
                  console.log("sendEther", sendEther.toString())
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)

                  await expect(PTNFTMarketPlace.acceptOffer(1)).to.emit(
                      PTNFTMarketPlace,
                      "AcceptOffer"
                  ) // transfer from null address to minter
              })
              it("check acceptOffer check balance of buyer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)
                  var oldBalance = await ptNFT.balanceOf(redeemer.address)
                  console.log("res", oldBalance.toString())
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)

                  await PTNFTMarketPlace.acceptOffer(1)

                  var newBalance = await ptNFT.balanceOf(redeemer.address)
                  console.log("res", oldBalance.toString(), newBalance.toString())
                  assert.equal(newBalance.toString(), "1")
              })
              it("check acceptOffer Offer will after Accpte Close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)
                  await PTNFTMarketPlace.acceptOffer(1)

                  var offer = await PTNFTMarketPlace.getMarketOffer(1)
                  console.log("offer", offer.status)
                  assert.equal(offer.status.toString(), "1")
              })
          })

          describe("PTNFTMarketPlace rejectOffer ", function () {
              it("check rejectOffer offer for item not exist", async function () {
                  await expect(PTNFTMarketPlace.rejectOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check rejectOffer fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await PTNFTMarketPlace.deleteMarketItem(1)
                  await expect(PTNFTMarketPlace.rejectOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemMustBeOnMarket"
                  )
              })
              it("check rejectOffer fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await expect(
                      PTNFTMarketPlace.rejectOffer(1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check rejectOffer try to accept offer but not owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  await expect(
                      PTNFTMarketPlace.rejectOffer(1, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__OnlyOwnerAcceptOffer")
              })
              it("check rejectOffer fail on offer expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.rejectOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__OfferTimeExpired"
                  )
              })
              it("check rejectOffer fail on NO offer expist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)

                  await expect(PTNFTMarketPlace.rejectOffer(1)).to.be.revertedWith(
                      "PTNFTMarketPlace__NoOfferExist"
                  )
              })

              it("check rejectOffer event emit", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")
                  let maxPrice = ethers.utils.parseEther("0.5")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
                      maxPrice,
                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")
                  maxPrice = ethers.utils.parseEther("0.5")
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, maxPrice, false, 2)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)
                  await expect(PTNFTMarketPlace.rejectOffer(1)).to.emit(
                      PTNFTMarketPlace,
                      "RejectOffer"
                  )
              })
          })
      })
