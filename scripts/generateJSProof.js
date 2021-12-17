const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { buildContractCallArgs, genProof } = require("./utils");

async function run() {
  const { proof, publicSignals } = await genProof(
    { image: [1, 2, 3] },
    path.resolve(__dirname, "../zk/build/circuit_js/circuit.wasm"),
    path.resolve(__dirname, "../zk/build/circuit_0001.zkey")
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));

  console.log("public signals: ");
  console.log(publicSignals);

  const vKey = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../zk/build/verification_key.json"))
  );

  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  if (res === true) {
    console.log("Verification OK");
  } else {
    console.log("Invalid proof");
  }
}

run().then(() => {
  process.exit(0);
});
