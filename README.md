# Pharma Trace NFTMarketPlace

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

## Deploy

## Test

### Echidna setup
```bash
pip3 install slither-analyzer
sudo wget -O /tmp/echidna-test.tar.gz https://github.com/crytic/echidna/releases/download/v1.7.2/echidna-test-1.7.2-Ubuntu-18.04.tar.gz
sudo tar -xf /tmp/echidna-test.tar.gz -C /usr/bin
sudo chmod +x /usr/bin/echidna-test
echidna-test . --contract VaultMathEchidnaTest --config echidna.config.yml
```

