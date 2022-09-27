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

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.0")

                  await expect(
                      PTNFTMarketPlace.createMarketItem(
                          1,
                          minPrice,

                          true,
                          1,
                          ptNFT.address
                      )
                  ).to.be.revertedWith("PTNFTMarketPlace__ValueShouldGreaterThenZero")
              })
              it("check createMarketItem without approval of the owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await expect(
                      PTNFTMarketPlace.createMarketItem(
                          1,
                          minPrice,

                          true,
                          1,
                          ptNFT.address
                      )
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check createMarketItem with approval of the owner to marketplace", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  minPrice = ethers.utils.parseEther("0.1")

                  await expect(
                      PTNFTMarketPlace.createMarketItem(
                          1,
                          minPrice,

                          true,
                          1,
                          ptNFT.address
                      )
                  ).to.emit(PTNFTMarketPlace, "MarketItemCreated")
              })
              it("check createMarketItem not a owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  minPrice = ethers.utils.parseEther("0.1")

                  await expect(
                      PTNFTMarketPlace.createMarketItem(
                          1,
                          minPrice,

                          true,
                          1,
                          ptNFT.address
                      )
                  ).to.be.revertedWith("PTNFTMarketPlace__NotOwner")
              })
              it("check getMarketItem check market item is create valid", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  var res = await PTNFTMarketPlace.getMarketItem(ptNFT.address, 1)
                  assert.equal(res.tokenId.toString(), "1")
                  assert.equal(res.seller.toString(), minter.address.toString())
                  assert.equal(res.buyer.toString(), "0x0000000000000000000000000000000000000000")
                  assert.equal(res.minPrice.toString(), minPrice.toString())
                  assert.equal(res.isFixedPrice.toString(), "false")
                  assert.equal(res.state.toString(), "0")
              })
              it("check createMarketItem fail on if NFT is already listed", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await expect(
                      PTNFTMarketPlace.createMarketItem(
                          1,
                          minPrice,

                          true,
                          1,
                          ptNFT.address
                      )
                  ).to.be.revertedWith("PTNFTMarketPlace__AlreadyListed")
              })
          })

          describe("PTNFTMarketPlace withDrawOfferFromMarket ", function () {
              it("check withDrawOfferFromMarket fail when try to get amount without place any offer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  //   var res = await PTNFTMarketPlace.getSign(voucher)
                  //   console.log(res)
                  await expect(
                      PTNFTMarketPlace.withDrawOfferFromMarket(ptNFT.address, 1)
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check withDrawOfferFromMarket amount is return in account", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  const startingBalance = await PTNFTMarketPlace.provider.getBalance(minter.address)

                  var txResponse = await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  var txReceipt = await txResponse.wait(1) // waits 1 block
                  var { gasUsed, effectiveGasPrice } = txReceipt
                  let createOfferCost = gasUsed.mul(effectiveGasPrice)

                  txResponse = await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  txReceipt = await txResponse.wait(1) // waits 1 block
                  var { gasUsed, effectiveGasPrice } = txReceipt
                  let acceptOfferCost = gasUsed.mul(effectiveGasPrice)

                  var txResponse1 = await PTNFTMarketPlace.withDrawAmount()
                  txReceipt1 = await txResponse1.wait(1) // waits 1 block
                  var gasUsed1 = txReceipt1.gasUsed
                  var effectiveGasPrice1 = txReceipt1.effectiveGasPrice
                  let withDrawAmount = gasUsed1.mul(effectiveGasPrice1)

                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")

                  txResponse = await ptNFT.approve(PTNFTMarketPlace.address, 1)

                  var txReceipt = await txResponse.wait(1) // waits 1 block
                  var { gasUsed, effectiveGasPrice } = txReceipt
                  let approvedCost = gasUsed.mul(effectiveGasPrice)

                  txResponse = await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  var txReceipt = await txResponse.wait(1) // waits 1 block
                  var { gasUsed, effectiveGasPrice } = txReceipt
                  let marketItemCost = gasUsed.mul(effectiveGasPrice)

                  txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  var txReceipt = await txResponse.wait(1) // waits 1 block
                  var { gasUsed, effectiveGasPrice } = txReceipt
                  let withdrawGasCostCreateOfferFoRLazzNFT = gasUsed.mul(effectiveGasPrice)

                  var txResponse1 = await PTNFTMarketPlace.withDrawOfferFromMarket(ptNFT.address, 1)
                  var txReceipt1 = await txResponse1.wait(1) // waits 1 block
                  var gasUsed1 = txReceipt1.gasUsed
                  var effectiveGasPrice1 = txReceipt1.effectiveGasPrice
                  let withdrawGasCostwithDrawFromOffer = gasUsed1.mul(effectiveGasPrice1)

                  var endingBalance = await PTNFTMarketPlace.provider.getBalance(minter.address)
                  endingBalance = endingBalance
                      .add(withdrawGasCostwithDrawFromOffer)
                      .add(withdrawGasCostCreateOfferFoRLazzNFT)
                      .add(acceptOfferCost)
                      .add(createOfferCost)
                      .add(withDrawAmount)
                      .add(marketItemCost)
                      .add(approvedCost)

                  console.log("endingBalance", endingBalance.toString())
                  console.log("startingBalance", startingBalance.toString())
                  assert.equal(endingBalance.toString(), startingBalance.toString())
              })
              it("check WithDrawFund event ", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  await expect(PTNFTMarketPlace.withDrawOfferFromMarket(ptNFT.address, 1)).to.emit(
                      PTNFTMarketPlace,
                      "WithDrawFromOffer"
                  ) // transfer from null address to minter
              })
          })
          describe("PTNFTMarketPlace deleteMarketItem ", function () {
              it("check deleteMarketItem invalid item id", async function () {
                  await expect(
                      PTNFTMarketPlace.deleteMarketItem(3, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__ItemIdInvalid")
              })
              it("check deleteMarketItem with event", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  minPrice = ethers.utils.parseEther("0.1")

                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      true,
                      1,
                      ptNFT.address
                  )
                  await expect(PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)).to.emit(
                      PTNFTMarketPlace,
                      "MarketItemDelete"
                  )
              })
              it("check deleteMarketItem not a owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)

                  minPrice = ethers.utils.parseEther("0.1")

                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      true,
                      1,
                      ptNFT.address
                  )
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  var res = await PTNFTMarketPlace.getItemCounter()
                  console.log("res", res.toString())
                  await expect(
                      PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__NotOwner")
              })
              it("check deleteMarketItem try to inactive MarketPlace Item", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)

                  minPrice = ethers.utils.parseEther("0.1")

                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      true,
                      1,
                      ptNFT.address
                  )

                  await PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  await expect(
                      PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__NotAvailableForOffer")
              })
          })

          describe("PTNFTMarketPlace createOffer ", function () {
              it("check createOffer offer for item not exist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__ItemIdInvalid")
              })
              it("check createOffer fail on when fixed price item get offer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      true,
                      1,
                      ptNFT.address
                  )

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__FixedPirceMarketItem")
              })
              it("check createOffer fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__NotAvailableForOffer")
              })
              it("check createOffer fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check createOffer fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address)
                  ).to.be.revertedWith("PTNFTMarketPlace__MarketItemExpired")
              })
              it("check createOffer fail if insufficent fund transfer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.1")

                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.01")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__InsufficientFund")
              })
              it("check createOffer with minPrice", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.1")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                          value: sendEther,
                          gasLimit: 4100000,
                      })
                  ).to.emit(PTNFTMarketPlace, "CreateOffer")
              })

              it("check createOffer Offer Created", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.4")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.1")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1) // waits 1 block
                  var res = await PTNFTMarketPlace.getMarketOffer(ptNFT.address, 1)
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

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  let txReceipt = await txResponse.wait(1)
                  sendEther = ethers.utils.parseEther("0.3")

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__InsufficientFund")
              })
              it("check createOffer Offer the amount which is more then current offer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.3")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  await txResponse.wait(1) // waits 1 block
                  //   var blocktime = await PTNFTMarketPlace.getBlockTime()
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  //   var res = await PTNFTMarketPlace.getOffer(1)
                  //   console.log("res", res.offerBy.toString(), res.offerAmount.toString())
                  sendEther = ethers.utils.parseEther("0.45")
                  txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  })
                  res = await PTNFTMarketPlace.getMarketOffer(ptNFT.address, 1)
                  //   console.log("txResponse", txResponse)
                  console.log("res", res.offerBy.toString(), res.offerAmount.toString())
                  assert.equal(res.offerBy, redeemer.address)
              })
              it("check createOffer on new offer does old amount is move to Refund Offer Amount", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.3")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  await txResponse.wait(1) // waits 1 block
                  //   var blocktime = await PTNFTMarketPlace.getBlockTime()
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  //   var res = await PTNFTMarketPlace.getOffer(1)
                  //   console.log("res", res.offerBy.toString(), res.offerAmount.toString())
                  sendEther = ethers.utils.parseEther("0.45")
                  txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  })
                  //   console.log("txResponse", txResponse)
                  var refundOfferAmount = await PTNFTMarketPlace.getWithDrawAmounts(minter.address)
                  sendEther = ethers.utils.parseEther("0.4")
                  refundOfferAmount =
                      parseInt(refundOfferAmount.toString()) - ethers.utils.parseEther("0.3")

                  console.log("refundOfferAmount", refundOfferAmount)
                  assert.equal(refundOfferAmount.toString(), sendEther.toString())
              })
              it("check createOffer redeem NFT voucher Offer will Close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.5")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )

                  var txResponse = await PTNFTMarketPlace.buy(1, ptNFT.address, {
                      value: sendEther,
                  })
                  var txReceipt = await txResponse.wait(1) // waits 1 block

                  await expect(
                      PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__NotAvailableForOffer")
              })
          })
          describe("PTNFTMarketPlace setlistingFee ", function () {
              it("check setlistingFee not zero or less", async function () {
                  await expect(PTNFTMarketPlace.setlistingFee(0)).to.be.revertedWith(
                      "PTNFTMarketPlace__ValueShouldGreaterThenZero"
                  )
              })
              it("check setlistingFee fail on market item is close", async function () {
                  await PTNFTMarketPlace.setlistingFee(1)
                  var res = await PTNFTMarketPlace.getListingFee()
                  assert.equal(res.toString(), 1)
              })
              it("check getMarketowner fail on market item is close", async function () {
                  var res = await PTNFTMarketPlace.getMarketowner()
                  assert.equal(res.toString(), minter.address.toString())
              })
          })
          describe("PTNFTMarketPlace setNftContractAddress ", function () {
              it("check setNftContractAddress not zero or less", async function () {
                  await expect(
                      PTNFTMarketPlace.setNftContractAddress(
                          "0x0000000000000000000000000000000000000000"
                      )
                  ).to.be.revertedWith("PTNFTMarketPlace__NFTContractAddressIsRequired")
              })
              it("check setlistingFee fail on market item is close", async function () {
                  await PTNFTMarketPlace.setNftContractAddress(ptNFT.address)
                  var res = await PTNFTMarketPlace.getNftContractAddress()
                  assert.equal(res.toString(), ptNFT.address)
              })
          })
          describe("PTNFTMarketPlace getContractBlanace ", function () {
              it("check getContractBlanace check contract balance", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)

                  var res = await PTNFTMarketPlace.getContractBlanace()
                  console.log("res", res.toString())
                  assert.equal(res.toString(), sendEther.toString())
              })
          })
          describe("PTNFTMarketPlace buy ", function () {
              it("check buyMarketplace offer for item not exist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await expect(PTNFTMarketPlace.buy(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check buyMarketplace fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  await expect(PTNFTMarketPlace.buy(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__NotAvailableForOffer"
                  )
              })
              it("check buyMarketplace fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)
                  await expect(PTNFTMarketPlace.buy(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__PermissionRequired"
                  )
              })
              it("check buyMarketplace fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.buy(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__MarketItemExpired"
                  )
              })

              it("check buyMarketplace redeem NFT voucher", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )

                  await expect(
                      PTNFTMarketPlace.buy(1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.emit(PTNFTMarketPlace, "BuyNFT") // transfer from null address to minter

                  //   var res = await ptNFT.balanceOf(redeemer.address)
                  //   var resURI = await ptNFT.tokenURI(1)
                  //   console.log("res", res.toString(), resURI.toString())
              })
              it("check buyMarketplace redeem NFT voucher Offer will Close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.5")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )

                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await PTNFTMarketPlace.buy(1, ptNFT.address, {
                      value: sendEther,
                  })

                  var offer = await PTNFTMarketPlace.getMarketOffer(ptNFT.address, 1)
                  console.log("offer", offer.status)
                  assert.equal(offer.status.toString(), "0")
              })
              it("check buyMarketplace on new offer old offer is less and move to refund", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.3")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  sendEther = ethers.utils.parseEther("0.4")
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  let txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount

                  await txResponse.wait(1) // waits 1 block
                  //   var blocktime = await PTNFTMarketPlace.getBlockTime()
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
                  sendEther = ethers.utils.parseEther("0.5")
                  txResponse = await PTNFTMarketPlace.buy(1, ptNFT.address, {
                      value: sendEther,
                  })

                  //   console.log("txResponse", txResponse)
                  var refundOfferAmount = await PTNFTMarketPlace.getWithDrawAmounts(minter.address)
                  sendEther = ethers.utils.parseEther("1.2")
                  console.log("refundOfferAmount", refundOfferAmount.toString())

                  assert.equal(refundOfferAmount.toString(), sendEther.toString())
              })
          })
          describe("PTNFTMarketPlace acceptOffer ", function () {
              it("check acceptOffer offer for item not exist", async function () {
                  await expect(PTNFTMarketPlace.acceptOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check acceptOffer fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  await expect(PTNFTMarketPlace.acceptOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__NotAvailableForOffer"
                  )
              })
              it("check acceptOffer fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await expect(
                      PTNFTMarketPlace.acceptOffer(1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check acceptOffer try to accept offer but not owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  await expect(
                      PTNFTMarketPlace.acceptOffer(1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__NotOwner")
              })
              it("check acceptOffer fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.acceptOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__MarketItemExpired"
                  )
              })
              it("check acceptOffer fail on offer expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.acceptOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__OfferTimeExpired"
                  )
              })
              it("check acceptOffer fail on no offer expist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )

                  await expect(PTNFTMarketPlace.acceptOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__NoOfferExist"
                  )
              })

              it("check acceptOffer Buy NFT", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.234")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )
                  console.log("sendEther", sendEther.toString())
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)

                  await expect(PTNFTMarketPlace.acceptOffer(1, ptNFT.address)).to.emit(
                      PTNFTMarketPlace,
                      "AcceptOffer"
                  ) // transfer from null address to minter
              })
              it("check acceptOffer check balance of buyer", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )
                  var oldBalance = await ptNFT.balanceOf(redeemer.address)
                  console.log("res", oldBalance.toString())
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)

                  await PTNFTMarketPlace.acceptOffer(1, ptNFT.address)

                  var newBalance = await ptNFT.balanceOf(redeemer.address)
                  console.log("res", oldBalance.toString(), newBalance.toString())
                  assert.equal(newBalance.toString(), "1")
              })
              it("check acceptOffer Offer will after Accpte Close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)
                  await PTNFTMarketPlace.acceptOffer(1, ptNFT.address)

                  var offer = await PTNFTMarketPlace.getMarketOffer(ptNFT.address, 1)
                  console.log("offer", offer.status)
                  assert.equal(offer.status.toString(), "0")
              })
          })

          describe("PTNFTMarketPlace fallback ", function () {
              it("should invoke the fallback function", async () => {
                  const nonExistentFuncSignature = "nonExistentFunc()"
                  const fakeDemoContract = new ethers.Contract(
                      PTNFTMarketPlace.address,
                      [
                          ...PTNFTMarketPlace.interface.fragments,
                          `function ${nonExistentFuncSignature}`,
                      ],
                      minter
                  )
                  const tx = fakeDemoContract[nonExistentFuncSignature]()
                  await expect(tx).to.emit(PTNFTMarketPlace, "FallbackCalled")
              })
              //   it("should invoke the ReceivedCalled function", async () => {
              //       const tx = minter.sendTransaction({
              //           to: PTNFTMarketPlace.address,
              //           data: "0x1234",
              //       })
              //       await expect(tx).to.emit(PTNFTMarketPlace, "ReceivedCalled")
              //   })
          })
          describe("PTNFTMarketPlace rejectOffer ", function () {
              it("check rejectOffer offer for item not exist", async function () {
                  await expect(PTNFTMarketPlace.rejectOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__ItemIdInvalid"
                  )
              })
              it("check rejectOffer fail on market item is close", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await PTNFTMarketPlace.deleteMarketItem(1, ptNFT.address)
                  await expect(PTNFTMarketPlace.rejectOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__NotAvailableForOffer"
                  )
              })
              it("check rejectOffer fail on market item expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(
                      PTNFTMarketPlace.rejectOffer(1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__MarketItemExpired")
              })
              it("check rejectOffer fail on market item permission reverted", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  await ptNFT.revertApprovalForAll("0x0000000000000000000000000000000000000000", 1)

                  var res = await ptNFT.getApprovedOrOwner(PTNFTMarketPlace.address, 1)
                  console.log("res", res.toString())
                  await expect(
                      PTNFTMarketPlace.rejectOffer(1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__PermissionRequired")
              })
              it("check rejectOffer try to accept offer but not owner", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      1,
                      ptNFT.address
                  )
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  await expect(
                      PTNFTMarketPlace.rejectOffer(1, ptNFT.address, {
                          value: sendEther,
                      })
                  ).to.be.revertedWith("PTNFTMarketPlace__NotOwner")
              })
              it("check rejectOffer fail on offer expired", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )
                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  network.provider.send("evm_increaseTime", [86400 * 1])
                  network.provider.send("evm_mine", [])

                  await expect(PTNFTMarketPlace.rejectOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__OfferTimeExpired"
                  )
              })
              it("check rejectOffer fail on NO offer expist", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(
                      1,
                      minPrice,

                      false,
                      2,
                      ptNFT.address
                  )

                  await expect(PTNFTMarketPlace.rejectOffer(1, ptNFT.address)).to.be.revertedWith(
                      "PTNFTMarketPlace__NoOfferExist"
                  )
              })

              it("check rejectOffer event emit", async function () {
                  const ptMinter = new PTMinter({ ptNFT, signer: minter })
                  console.log("minter", minter.address)
                  let sendEther = ethers.utils.parseEther("0.2")
                  let minPrice = ethers.utils.parseEther("0.1")

                  const voucher = await ptMinter.createVoucher(
                      1,
                      "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",

                      minPrice
                  )
                  console.log("voucher", redeemer.address)
                  await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
                      value: sendEther,
                  })
                  await PTNFTMarketPlace.acceptLazzNFTOffer(voucher)
                  minPrice = ethers.utils.parseEther("0.1")

                  await ptNFT.approve(PTNFTMarketPlace.address, 1)
                  await PTNFTMarketPlace.createMarketItem(1, minPrice, false, 2, ptNFT.address)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)

                  const txResponse = await PTNFTMarketPlace.createOffer(1, 1, ptNFT.address, {
                      value: sendEther,
                  }) // emit RefundOfferAmount
                  const txReceipt = await txResponse.wait(1)
                  PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)
                  await expect(PTNFTMarketPlace.rejectOffer(1, ptNFT.address)).to.emit(
                      PTNFTMarketPlace,
                      "RejectOffer"
                  )
              })
          })
      })
