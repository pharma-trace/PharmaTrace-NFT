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

          //   describe("PTNFTMarketPlace createOfferFoRLazzNFT ", function () {
          //       it("check it call or not ", async function () {
          //           var res = await PTNFTMarketPlace.getMarketowner()
          //           console.log("res", res)
          //           return
          //           //   const ptMinter = new PTMinter({ ptNFT, signer: minter })
          //           //   console.log("minter", minter.address)
          //           //   let sendEther = ethers.utils.parseEther("0.1")
          //           //   let minPrice = ethers.utils.parseEther("0.1")
          //           //   const voucher = await ptMinter.createVoucher(
          //           //       1,
          //           //       "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
          //           //       minPrice
          //           //   )
          //           //   console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
          //           //   await expect(
          //           //       PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
          //           //           value: sendEther,
          //           //           gasLimit: 4100000,
          //           //       })
          //           //   ).to.emit(PTNFTMarketPlace, "CreateOffer")
          //       })
          //   })
          describe("PTNFTMarketPlace createOfferFoRLazzNFT ", function () {
              //   it("check createOfferFoRLazzNFT with minPrice", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter)
              //       let sendEther = ethers.utils.parseEther("0.1")
              //       let minPrice = ethers.utils.parseEther("0.1")
              //       const voucher = await ptMinter.createVoucher(
              //           2,
              //           "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //           minPrice
              //       )
              //       console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
              //       await expect(
              //           PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //               value: sendEther,
              //               gasLimit: 4100000,
              //           })
              //       ).to.emit(PTNFTMarketPlace, "CreateOffer")
              //   })
              //   it("check withDrawAmount amount when someone offer more then your amount", async function () {
              //     //   const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //     //   console.log("minter", minter.address)
              //     //   console.log("redeemer", redeemer.address)
              //     //   let sendEther = ethers.utils.parseEther("0.01")
              //     //   let minPrice = ethers.utils.parseEther("0.01")
              //       //   const voucher = await ptMinter.createVoucher(
              //       //       2,
              //       //       "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //       //       minPrice
              //       //   )
              //       //   const startingBalance = await PTNFTMarketPlace.provider.getBalance(minter.address)
              //       //   let txResponse = await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //       //       value: sendEther,
              //       //   }) // emit WithDrawAmount
              //       //   var txReceipt = await txResponse.wait(1) // waits 1 block
              //       //   await txResponse.wait(1) // waits 1 block
              //       //   var { gasUsed, effectiveGasPrice } = txReceipt
              //       //   let withdrawGasCostCreateOfferFoRLazzNFT = gasUsed.mul(effectiveGasPrice)
              //       //   //   var blocktime = await PTNFTMarketPlace.getBlockTime()
              //       //   PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
              //       //   var res = await PTNFTMarketPlace.getOffer(ptNFT.address, 1)
              //       //   console.log("res", res.offerBy.toString(), res.offerAmount.toString())
              //       //   sendEther = ethers.utils.parseEther("0.02")
              //       //   txResponse = await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //       //       value: sendEther,
              //       //   })
              //       //   await txResponse.wait(1) // waits 1 block
              //       //   console.log("transation is completed")
              //       //   PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(minter)
              //       //   var txResponse1 = await PTNFTMarketPlace.withDrawAmount()
              //       //   var txReceipt1 = await txResponse1.wait(1) // waits 1 block
              //       //   var gasUsed1 = txReceipt1.gasUsed
              //       //   var effectiveGasPrice1 = txReceipt1.effectiveGasPrice
              //       //   let withdrawGasCostwithDrawFromOffer = gasUsed1.mul(effectiveGasPrice1)
              //       //   var endingBalance = await PTNFTMarketPlace.provider.getBalance(minter.address)
              //       //   endingBalance = endingBalance
              //       //       .add(withdrawGasCostwithDrawFromOffer)
              //       //       .add(withdrawGasCostCreateOfferFoRLazzNFT)
              //       //   console.log("endingBalance", endingBalance.toString())
              //       //   console.log("startingBalance", startingBalance.toString())
              //       //   assert.equal(endingBalance.toString(), startingBalance.toString())
              //   })
              //   it("check acceptLazzNFTOffer redeem NFT voucher", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       let sendEther = ethers.utils.parseEther("0.2")
              //       let minPrice = ethers.utils.parseEther("0.1")
              //       const voucher = await ptMinter.createVoucher(
              //           1,
              //           "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //           minPrice
              //       )
              //       //   console.log("voucher", redeemer.address)
              //       //   await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //       //       value: sendEther,
              //       //   })
              //       await expect(PTNFTMarketPlace.acceptLazzNFTOffer(voucher)).to.emit(
              //           PTNFTMarketPlace,
              //           "AcceptOffer"
              //       ) // transfer from null address to minter
              //   })
              //   it("check rejectLazzNFTOffer redeem NFT voucher", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       let sendEther = ethers.utils.parseEther("0.2")
              //       let minPrice = ethers.utils.parseEther("0.1")
              //       const voucher = await ptMinter.createVoucher(
              //           2,
              //           "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //           minPrice
              //       )
              //       console.log("voucher", redeemer.address)
              //       //   await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //       //       value: sendEther,
              //       //   })
              //       await expect(PTNFTMarketPlace.rejectLazzNFTOffer(voucher)).to.emit(
              //           PTNFTMarketPlace,
              //           "RejectOffer"
              //       ) // transfer from null address to minter
              //   })
              //   it("check buyLazzNFT redeem NFT voucher", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       let sendEther = ethers.utils.parseEther("0.0001")
              //       let minPrice = ethers.utils.parseEther("0.0001")
              //       const voucher = await ptMinter.createVoucher(
              //           3,
              //           "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //           minPrice
              //       )
              //       console.log("voucher", voucher.minPrice.toString(), sendEther.toString())
              //       PTNFTMarketPlace = PTNFTMarketPlaceContract.connect(redeemer)
              //       var res = await ptNFT.balanceOf(redeemer.address)
              //       console.log("res", res.toString())
              //       //   var txResponse = await PTNFTMarketPlace.buyLazzNFT(voucher, {
              //       //       value: sendEther,
              //       //   })
              //       //   var txReceipt = await txResponse.wait(1) // waits 1 block
              //       //   let requestId = txReceipt.events
              //       //   console.log("requestId", requestId)
              //       await expect(
              //           PTNFTMarketPlace.buyLazzNFT(voucher, {
              //               value: sendEther,
              //           })
              //       ).to.emit(PTNFTMarketPlace, "BuyNFT") // transfer from null address to minter
              //       //   var res = await ptNFT.balanceOf(redeemer.address)
              //       //   var resURI = await ptNFT.tokenURI(1)
              //       //   console.log("res", res.toString(), resURI.toString())
              //   })
              //   it("check WithDrawFund event ", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       let sendEther = ethers.utils.parseEther("0.1")
              //       let minPrice = ethers.utils.parseEther("0.1")
              //       //   const voucher = await ptMinter.createVoucher(
              //       //       4,
              //       //       "ipfs://QmQFcbsk1Vjt1n361MceM5iNeMTuFzuVUZ1hKFWD7ZCpuC",
              //       //       minPrice
              //       //   )
              //       //   console.log("voucher", redeemer.address)
              //       //   var txResponse = await PTNFTMarketPlace.createOfferFoRLazzNFT(voucher, 1, {
              //       //       value: sendEther,
              //       //   })
              //       //   var txReceipt = await txResponse.wait(1) // waits 1 block
              //       //   console.log()
              //       await expect(
              //           PTNFTMarketPlace.withDrawOfferFromLazzMint(ptNFT.address, 4, {
              //               gasLimit: 4100000,
              //           })
              //       ).to.emit(PTNFTMarketPlace, "WithDrawFromOffer") // transfer from null address to minter
              //   })
              //   it("check withDrawAmount event ", async function () {
              //       const ptMinter = new PTMinter({ ptNFT, signer: minter })
              //       console.log("minter", minter.address)
              //       await expect(PTNFTMarketPlace.withDrawAmount()).to.emit(
              //           PTNFTMarketPlace,
              //           "WithDrawAmount"
              //       ) // transfer from null address to minter
              //   })
          })
      })
