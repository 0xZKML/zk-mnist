import React, { useState } from 'react'
import './App.css'
import MNISTBoard from './MNISTBoard.js';

import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import path from 'path';
import './App.css';
// import Token from './artifacts/contracts/Token.sol/Token.json'

const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

function App() {
//   const [greeting, setGreetingValue] = useState()
  const [image, setImage] = useState("")
  const [proof, setProof] = useState("")
  const [publicSignal, setPublicSignal] = useState()
  const [isVerified, setIsVerified] = useState(false);
  var saveableCanvas;
// console.log(myvar);

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async function publishProof() {
    let imageVec = image.slice(1,-1);
    imageVec = imageVec.split(', ') // array of strings of numbers
    if (typeof window.ethereum !== 'undefined') {
        const { proof, publicSignals } = await generateProof(imageVec)
        setPublicSignal(publicSignals);
        setProof(proof);
    }
  }

  async function verifyProof() {
    // console.log(typeof proof);
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
  function handleChangeData(){
      let a=1;
  }

  return (
    <div className="App">
      <MNISTBoard onChange={handleChangeData} />

      <header className="App-header">
        <p></p>
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