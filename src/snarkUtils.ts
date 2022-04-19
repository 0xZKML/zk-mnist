// from https://github.com/Derked/FantasyCampaign/blob/main/src/utils/snarkUtils.ts

// @ts-ignore
import * as snarkjs from "snarkjs";
import {builder} from "./circuit_js/witness_calculator.js";

export const generateProof = async (
    image: number[][]
  ): Promise<{ proof: any; publicSignals: any }> => {
    const { proof, publicSignals } = await genProof(
      {
        image: image,
      },
      // "http://localhost:3000/circuit.wasm",
      // "http://localhost:3000/circuit_0001.zkey"
      "./circuit.wasm",
      "./circuit_0001.zkey"
    );
    console.log('load the .wask and .zkey resources')

    return { proof, publicSignals };
  };

export const genWnts = async (
  input: any,
  wasmFilePath: string
): Promise<any> => {
  let wntsBuff: ArrayBuffer;
  const resp = await fetch(wasmFilePath);
  wntsBuff = await resp.arrayBuffer();

  return new Promise((resolve, reject) => {
    builder(wntsBuff)
      .then(async witnessCalculator => {
        const buff = await witnessCalculator.calculateWTNSBin(input, 0);
        resolve(buff);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const genProof = async (
  grothInput: any,
  wasmFilePath: string,
  finalZkeyPath: string
) => {
  let zkeyBuff: ArrayBuffer;
  const wtnsBuff = await genWnts(grothInput, wasmFilePath);
  //window exists only in browser
  const resp = await fetch(finalZkeyPath);
  zkeyBuff = await resp.arrayBuffer();

  const { proof, publicSignals } = await snarkjs.groth16.prove(
    new Uint8Array(zkeyBuff),
    wtnsBuff,
    null
  );
  return { proof, publicSignals };
};

export const verifyProof = (vKey: string, fullProof: any) => {
  const { proof, publicSignals } = fullProof;
  return snarkjs.groth16.verify(vKey, publicSignals, proof);
};

export function buildContractCallArgs(snarkProof, publicSignals) {
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
