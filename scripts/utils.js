const bigInt = require("big-integer");

const { groth16 } = require("snarkjs");
const fs = require("fs");
const builder = require("./circuit_js/witness_calculator");

const p = bigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

// FROM https://github.com/darkforest-eth/packages/blob/05c85915ad664563e17085eb23817ea9a0f83bb2/snarks/index.ts#L205-L218
function buildContractCallArgs(snarkProof, publicSignals) {
  // the object returned by genZKSnarkProof needs to be massaged into a set of parameters the verifying contract
  // will accept
  return [
    snarkProof.pi_a.slice(0, 2), // pi_a
    // genZKSnarkProof reverses values in the inner arrays of pi_b
    [
      snarkProof.pi_b[0].slice(0).reverse(),
      snarkProof.pi_b[1].slice(0).reverse(),
    ], // pi_b
    snarkProof.pi_c.slice(0, 2), // pi_c
    publicSignals, // input
  ];
}

function modPBigInt(x) {
  let ret = bigInt(x).mod(p);
  if (ret.lesser(bigInt(0))) {
    ret = ret.add(p);
  }
  return ret;
}

// From https://github.com/akinovak/circom2-example/blob/375895064dcbc2c7747dd1deeafc634869de79c7/src/index.ts

const genWnts = async (input, wasmFilePath, witnessFileName) => {
  const buffer = fs.readFileSync(wasmFilePath);

  return new Promise((resolve, reject) => {
    builder(buffer)
      .then(async (witnessCalculator) => {
        const buff = await witnessCalculator.calculateWTNSBin(input, 0);
        fs.writeFileSync(witnessFileName, buff);
        resolve(witnessFileName);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const genProof = async (grothInput, wasmFilePath, finalZkeyPath) => {
  await genWnts(grothInput, wasmFilePath, "witness.wtns");
  const { proof, publicSignals } = await groth16.prove(
    finalZkeyPath,
    "witness.wtns",
    null
  );
  const exists = fs.existsSync("witness.wtns");
  if (exists) fs.unlinkSync("witness.wtns");
  return { proof, publicSignals };
};

const verifyProof = (vKey, fullProof) => {
  const { proof, publicSignals } = fullProof;
  return groth16.verify(vKey, publicSignals, proof);
};

module.exports = {
  buildContractCallArgs,
  modPBigInt,
  genWnts,
  genProof,
  verifyProof,
};
