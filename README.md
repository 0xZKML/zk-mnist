# About

zk-MNIST scaffold app.
This draws heavily from 0xJOF's [zk learning in public](https://github.com/JofArnold/zkp-learning-in-public) repo and Wei Jie Koh's [zk nft mint repo](https://github.com/weijiekoh/zknftmint/blob/main/contracts/contracts/NftMint.sol)

## Current Functionality:

1) input a vector as a string format (need to replace this ASAP with image upload + preproc)
2) generate proof in-browser using snarkjs 
3) verify proof on-chain using ethers + snarkjs

## How to run it locally:

Prerequisit: global install of circom 2.0

1) git clone the repo
2) `cd` into the directory
3) `npm i` to install dependencies
4) generate powers of tau `yarn zk:ptau`
5) compile circuits `yarn zk:compile`
6) compile the contracts `npx hardhat compile`
7) start a local ether node: `npx hardhat node`
7b) switch to another terminal
8) deploy the smart contract ` npx hardhat run scripts/deploy.js --network localhost`
9) make a note of where the contract address has been deployed
10) edit `verifierAddress` in `./src/App.js`
11) start web app `npm start`

## Development loop:

### ZK circuits

All zk circuits are in the `zk` directory.
1 - generate basic powers of tau phase 1 with `yarn zk:ptau`
2 - compile the circuits, generate the solidty validator with `yarn zk:compile`
3 - test the circuits: `node src/generateJSProof.js`
3 - `yarn contracts:test` - tests the contracts
