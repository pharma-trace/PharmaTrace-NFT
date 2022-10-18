
![PharmaTrace](logo.svg)

<h1 align="center">PharmaTrace NFT MarketPlace</h1>


<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.17-e6e6e6?style=for-the-badge&logo=solidity&logoColor=black) ![NodeJS](https://img.shields.io/badge/Node.js-16.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)]() [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)]() [![Website](https://img.shields.io/badge/Website-E34F26?style=for-the-badge&logo=Google-chrome&logoColor=white)]() [![Docs](https://img.shields.io/badge/Docs-7B36ED?style=for-the-badge&logo=gitbook&logoColor=white)]()

</div>

# Deployed Addresses

## Ethereum mainnet

```
PTToken:
PTMarket:
PTCollection:
```

## Goerli testnet

```
PTToken: 0xfDA036A53E7616a5cC9Ad44c7774892A9c3eFc4F
PTMarket: 0x487bD0f95D9F90fa267EF66A240327e3e864693D
PTCollection: 0x61121f288D34C30E08Fd8817eF4814bfE3d6d5C7
```

# Guide

## Installation

Prerequisites for this project are:

- NodeJS v16.x
- Yarn
- Git

To get a copy of the source

```bash
git clone https://git-codecommit.eu-central-1.amazonaws.com/v1/repos/PharmaTrace-NFT
cd PharmaTrace-NFT
yarn install
```

## Deploy
Make **.env** file by following **.env.example**.

Run the script below.
```bash
yarn deploy
```

## Test

### Slither and Echidna setup
```bash
pip3 install slither-analyzer
sudo wget -O /tmp/echidna-test.tar.gz https://github.com/crytic/echidna/releases/download/v1.7.2/echidna-test-1.7.2-Ubuntu-18.04.tar.gz
sudo tar -xf /tmp/echidna-test.tar.gz -C /usr/bin
sudo chmod +x /usr/bin/echidna-test
```
### Unit Testing
```bash
yarn test
```

### Slither Testing
```bash
yarn slither
```

### Echidna Testing
```bash
yarn echidna
```

### Staging Testing
```bash
yarn test-staging
```

