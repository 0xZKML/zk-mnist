import React from "react";
import ReactDOM from "react-dom";
import CanvasDraw from "react-canvas-draw";

import { useState } from 'react';
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

  const doCapture = () => {
    const im = [], zz=[]
    for(var i=0; i<28; i++){
        zz.push(0)
    }
    for(var i=0; i<28; i++){
        im.push(zz.slice());
    } // 28x28 zeros

    var datastr = saveableCanvas.getSaveData()
    console.log(datastr)
    var data = JSON.parse(datastr)
    const xmax=400, ymax=400
    const x=[], y=[]
    for(var ln=0; ln<data["lines"].length; ln++){
      var pts=data["lines"][ln]["points"]      
      for(var i=0; i<pts.length; i++) {
          x.push(Math.round(pts[i].x/xmax*28))
          y.push(Math.round(pts[i].y/ymax*28))
      }    
    }
    for(var i=0; i<x.length; i++) {
        im[y[i]][x[i]]=100
        var i2=Math.min(y[i]+1,27)
        var j2=Math.min(x[i]+1,27)
        im[i2][j2]=100
    }  
    var out = "["
    for(var i=0; i<27; i++){
        for(var j=0; j<28; j++){
            out = out + im[i][j] + ", "
        }
    }
    for(var j=0; j<27; j++){
        out = out + im[27][j] + ", "
    }
    out = out + im[27][27] + "]"    
    console.log(out)
    setImage(out)
  }

  return (
    <div className="App">
      <CanvasDraw classname="canvas"
        ref={canvasDraw => (saveableCanvas = canvasDraw)}
        brushColor='blue'
      />
      <button onClick={doCapture}>
      Capture
      </button>
      <header className="App-header">
        <p>Enter data vector (format [a, b, c], with a space after each comma)</p>
        <input onChange={e => setImage(e.target.value)}
           placeholder="[383, 382, 991, 948, 906, 978,  55, 526, 807, 799,  46, 646, 676,
    275, 952, 932, 175, 979, 717, 100, 919, 734, 107, 159, 395,  53,
    179,  59, 381,  22, 384, 530, 835, 104, 171, 583, 902, 548,  91,
    110, 334, 938, 547, 294, 125, 356, 811, 190, 902, 245]" />
        <p></p>
        <button onClick={publishProof}>Read Digit and Generate Proof</button>
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