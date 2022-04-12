# About

zk-MNIST: web frontend app + Jupyter notebook with ML model generation
Authors: @horacepan @sunfishstanford @henripal

You can play with the webapp demo at: https://zkmldemo.netlify.app/
(Note: mobile browsers not supported; wallet connected to Ropsten testnet required to demonstrate ZK verifier.)
Tutorial blog post: https://hackmd.io/Y7Y79_MtSoKdHNAEfZRXUg


This project is part of [0xPARC](https://0xparc.org/blog/program-for-applied-research)'s winter 2021 applied zk learning group, and draws heavily from 0xJOF's [zk learning in public](https://github.com/JofArnold/zkp-learning-in-public) repo and Wei Jie Koh's [zk nft mint repo](https://github.com/weijiekoh/zknftmint/blob/main/contracts/contracts/NftMint.sol)

## Current Functionality:

1) draw a digit or select an image of a hand-drawn digit
2) pass the digit through 2 conv layers and 2 FC layers in browser, generating a dim 84 embedding
3) generate a zkSNARK proof in browser that the embedding represents a given digit
4) verify proof on-chain using ethers + snarkjs

## How to run it locally:

Prerequisites: global install of circom 2.0

1) `git clone` the repo
2) `cd` into the directory
3) `npm i` to install dependencies
4) generate powers of tau `yarn zk:ptau`
5) compile circuits: (_yarn zk:compile_ doesn't work)
   5a) `cd zk`
   5b) `zsh compile.sh`
   5c) `cd ..` (back to main directory)
   5d) copy over some of the wasm files
      `mkdir public/static`
      `mkdir public/static/js`
      `cp node_modules/onnxruntime-web/dist/*.wasm public/static/js/`
6) compile the contracts `npx hardhat compile`
7) start a local ether node: `npx hardhat node`
8) switch to another terminal
9) deploy the smart contract ` npx hardhat run scripts/deploy.js --network localhost`
10) make a note of where the contract address has been deployed
11) edit `verifierAddress` in `./src/App.js`
12) start web app `npm start`

## Development loop:

### ZK circuits

All zk circuits are in the `zk` directory.
1) generate basic powers of tau phase 1 with `yarn zk:ptau`
2) compile the circuits, generate the solidty validator with `yarn zk:compile` (but see 5a/5b above)
