import { BigNumber } from "ethers";
import { artifacts, ethers } from "hardhat";

export async function deployPTToken(name: string, symbol: string, decimals: number, initialSupply: BigNumber) {
  const ptTokenFactory = await ethers.getContractFactory("PTToken");
  const ptToken = await ptTokenFactory.deploy(name, symbol, decimals, initialSupply);
  await ptToken.deployed();
  return ptToken;
}

export async function deployMockToken(name: string, symbol: string, decimals: number) {
  const mockTokenFactory = await ethers.getContractFactory("MockToken");
  const mockToken = await mockTokenFactory.deploy(name, symbol, decimals);
  await mockToken.deployed();
  return mockToken;
}

export async function deployPTMarket() {
  const ptMarketFactory = await ethers.getContractFactory("PTMarket");
  const ptMarket = await ptMarketFactory.deploy();
  await ptMarket.deployed();
  return ptMarket;
}

export async function deployPTCollection(
  marketAddress: string,
  name: string,
  symbol: string,
  signingDomain: string,
  signatureVersion: string,
) {
  const ptCollectionFactory = await ethers.getContractFactory("PTCollection");
  const ptCollection = await ptCollectionFactory.deploy(marketAddress, name, symbol, signingDomain, signatureVersion);
  await ptCollection.deployed();
  return ptCollection;
}
