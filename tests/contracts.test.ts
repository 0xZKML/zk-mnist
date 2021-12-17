const { buildContractCallArgs, genProof } = require("../scripts/utils");

const { expect } = require("chai");
const { ethers } = require("hardhat");
const path = require("path");

describe("mnist test", () => {
  it("should generate the right digit", async () => {
    // const [_, signer1] = await ethers.getSigners();
    // const NFTPrize = await ethers.getContractFactory("NFTPrize");
    // const nft = await NFTPrize.deploy();
    // await nft.deployed();
    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    // Generate proof
    const { proof, publicSignals } = await genProof(
      { image: [1, 2, 3] },
      path.resolve(__dirname, "./zk/build/circuit_js/circuit.wasm"),
      path.resolve(__dirname, "../zk/build/circuit_0001.zkey")
    );
    console.log(proof, publicSignals);
    const callArgs = await buildContractCallArgs(proof, publicSignals);
    const result = await verifier.verifyProof(...callArgs);
    console.log(result)
    expect(result).equals(true);
  });
});
