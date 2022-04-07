import { ethers } from 'ethers'
import { buildContractCallArgs } from "./snarkUtils";
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import {verifierAddress} from "./config"

async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

export async function verifyProof(proof, publicSignal) {
    let result = null;
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const verifier = new ethers.Contract(verifierAddress, Verifier.abi, provider)
      const callArgs = await buildContractCallArgs(proof, publicSignal)
      try {
          result = await verifier.verifyProof(...callArgs)
          console.log('verifier result = ',result)
      } catch(err) {
          console.log(err)
          result=null;
      }
    }    
    else {
      alert('Please connect your wallet to the blockchain containing the verifier smart contract')
    }
    return result
}
