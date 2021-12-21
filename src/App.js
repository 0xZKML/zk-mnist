import { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";

import path from 'path';
// import Token from './artifacts/contracts/Token.sol/Token.json'

const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

function App() {
//   const [greeting, setGreetingValue] = useState()
  const [proof, setProof] = useState("")
  const [publicSignal, setPublicSignal] = useState()
  const [isVerified, setIsVerified] = useState(false);
  const [rawImageVec, setRawImageVec] = useState();
  const [imageVec, setImageVec] = useState([]);
  const canvasRef = useRef(null)

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async function publishProof() {
    if (typeof window.ethereum !== 'undefined') {
        if(imageVec.length > 0) {
          const { proof, publicSignals } = await generateProof(imageVec)
          setPublicSignal(publicSignals);
          setProof(proof);
        } else {
          console.error("image vector not initialized")
        }
    }
  }

  async function uploadImage(imageFile) {
    const im = new Image();
    im.src = URL.createObjectURL(imageFile)
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    im.onload = () => {
      context.drawImage(im, 0, 0, 28, 28)
      setRawImageVec(context.getImageData(0, 0, 28, 28).data);
    }
  }

  async function processImage() {
    let data = new Array(784)
    console.log(rawImageVec)
    for (var i = 0; i < rawImageVec.length; i += 4) {
      var avg = (rawImageVec[i] + rawImageVec[i + 1] + rawImageVec[i + 2]) / 3;
      data[i/4] = avg
    }
    setImageVec(data)
    console.log(data)
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

  return (
    <div className="App">
      <header className="App-header">

        <p>Upload image file</p>
        <input type="file" name="image" onChange={e => uploadImage(e.target.files[0])}></input>
        <p></p>
        <canvas ref={canvasRef}  width={28} height={28}/>
        <p></p>
        <button onClick={processImage}>Process Image</button>
        <p></p>
        <button onClick={publishProof}>Generate Proof</button>
        <p></p>
        <button onClick={verifyProof}>Verify Proof</button>
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