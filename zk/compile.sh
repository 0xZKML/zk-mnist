#!/bin/zsh
set -e
echo $path
which circom

# Check if input.json exists to define the inputs for your witness. If not, exist

if [[ ! -f input.json ]] ; then
    echo "You must have an input.json file for generating a witness"
    exit 1
fi

# --------------------------------------------------------------------------------
# Phase 2
# ... circuit-specific stuff

# Compile the circuit. Creates the files:
# - circuit.r1cs: the r1cs constraint system of the circuit in binary format
# - circuit_js folder: wasm and witness tools
# - circuit.sym: a symbols file required for debugging and printing the constraint system in an annotated mode
circom circuit.circom --r1cs --wasm  --sym --output ./build

# Optional - view circuit state info
# yarn snarkjs r1cs info ./zk/circuit.r1cs

# Optional - print the constraints
# yarn snarkjs r1cs print ./zk/circuit.r1cs zk/circuit.sym

# Optional - export the r1cs
# yarn snarkjs r1cs export json ./zk/circuit.r1cs ./zk/circuit.r1cs.json && cat circuit.r1cs.json
# or...
# yarn zk:export-r1cs

# Generate witness
echo "generating witness"
node ./build/circuit_js/generate_witness.js ./build/circuit_js/circuit.wasm input.json ./build/witness.wtns


# Setup (use plonk so we can skip ptau phase 2
echo "compute zkey"
#yarn snarkjs groth16 setup ./zk/build/circuit.r1cs ./zk/ptau/pot13_final.ptau ./zk/build/circuit_0000.zkey
# need pot13
yarn snarkjs groth16 setup ./zk/build/circuit.r1cs ./zk/ptau/pot13_final.ptau ./zk/build/circuit_0000.zkey

# Ceremony just like before but for zkey this time
yarn snarkjs zkey contribute ./zk/build/circuit_0000.zkey ./zk/build/circuit_0001.zkey --name="First contribution" -v -e="$(head -n 4096 /dev/urandom | openssl sha1)"

# Export verification key
yarn snarkjs zkey export verificationkey ./zk/build/circuit_0001.zkey ./zk/build/verification_key.json

# Create the proof
yarn snarkjs groth16 prove ./zk/build/circuit_0001.zkey ./zk/build/witness.wtns ./zk/build/proof.json ./zk/build/public.json

# Verify the proof
yarn snarkjs groth16 verify ./zk/build/verification_key.json ./zk/build/public.json ./zk/build/proof.json

# Export the verifier as a smart contract
yarn snarkjs zkey export solidityverifier ./zk/build/circuit_0001.zkey ./contracts/verifier.sol

# copy the necessary files to src
cp -r ./build/circuit_js ../src/
cp ./build/circuit_0001.zkey ../src/circuit_js/

# copy the necdssary files to public (bad)
cp ./build/circuit_0001.zkey ../public/
cp ./build/circuit_js/circuit.wasm ../public/
