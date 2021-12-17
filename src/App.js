import { useState } from 'react';
import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";

import path from 'path';
// import Token from './artifacts/contracts/Token.sol/Token.json'

const verifierAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"

function App() {
//   const [greeting, setGreetingValue] = useState()
  const [image, setImage] = useState()
  const [proof, setProof] = useState()
  const [publicSignal, setPublicSignal] = useState()
  const [isVerified, setIsVerified] = useState(false);

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async function publishProof() {
      let imageVec = image.slice(1,-1);
      imageVec = imageVec.split(', ')
    if (typeof window.ethereum !== 'undefined') {
        const { proof, publicSignals } = await generateProof(imageVec)
        setPublicSignal(publicSignals);
        setProof(proof);
    }
  }

  async function verifyProof() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const verifier = new ethers.Contract(verifierAddress, Verifier.abi, provider)
      const callArgs = await buildContractCallArgs(proof, publicSignal)
      try {
        const result = await verifier.verifyProof(...callArgs)
        console.log(result)
        setIsVerified(result)
      } catch(err) {
          console.log(err)
      }
    }    
  }

  return (
    <div className="App">
      <header className="App-header">

        <p>Set Image vector (format [a, b, c])</p>
        <input onChange={e => setImage(e.target.value)} placeholder="[1, 2, 3]" />
        <p></p>
        <button onClick={publishProof}>Generate Proof</button>
        <p></p>
        <button onClick={verifyProof}>Verify Proof></button>
        <p>Note: the verifier requires being connected to the chain</p>
        <h3>Output</h3>
        <p>Is verified: {JSON.stringify(isVerified)}</p>
        <p> Recognized Digit: {publicSignal}</p>
        <p> Proof: {JSON.stringify(proof)}</p>
      </header>
    </div>
  );
}

export default App;