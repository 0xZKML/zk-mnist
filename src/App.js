import React, { useState, useRef, createRef} from 'react'
import './App.css'
import MNISTBoard from './MNISTBoard.js';
import MNISTDigits from './MNISTDigits.js';

import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import path from 'path';
import './App.css';
// import Token from './artifacts/contracts/Token.sol/Token.json'
import { Tensor, InferenceSession } from "onnxruntime-web";
import {DIGIT} from './mnistpics';
import {digSize} from './MNISTDigits.js';

var image=[]; // the image array will eventually be a flattened version of grid (the 2-dim array)
const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
var selectedImgUrl="";

function App() {
    const [quantizedEmbedding, setQuantizedEmbedding] = useState([])
    const [proof, setProof] = useState("")
    const [publicSignal, setPublicSignal] = useState()
    const [isVerified, setIsVerified] = useState(false);
    const size=28;
    const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0))); // initialize to a 28x28 array of 0's
    const mydigit=17    

    async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    async function doProof() {
      console.log('image len =',image.length)
      console.log(image);
      const session = await InferenceSession.create(
        "http://localhost:3000/trimmed_convet.onnx",
        {
          executionProviders: ["wasm"],
        }
      );
      const data = Float32Array.from(image) // restore this line if we are reading from the hand drawn digit

      // const data = DIGIT.weight[mydigit]; // keep this line if we are inserting an image of a digit via the sampleDigits.tsx file

      // console.log(data)
      const tensor = new Tensor('float32', data, [1, 1, 28, 28]);
      // console.log(tensor)
      const feeds = { input: tensor};
      const results = await session.run(feeds);
      const embeddingResult = results.output.data;
      // console.log(embeddingResult)
      var tempQuantizedEmbedding = new Array(50)
      for (var i = 0; i < 50; i++)
        tempQuantizedEmbedding[i] = parseInt((embeddingResult[i]*1000).toFixed()) + 10000;

      if (typeof window.ethereum !== 'undefined') {
          // console.log('generate proof with')
          // console.log(tempQuantizedEmbedding)
            const { proof, publicSignals } = await generateProof(tempQuantizedEmbedding)
            setPublicSignal(publicSignals);
            setProof(proof);
      }
      else {
        console.log(window.ethereum)
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

    function handleChangeData(myrow,mycol){
        var newArray = [];
        for (var i = 0; i < grid.length; i++)
            newArray[i] = grid[i].slice();
        newArray[myrow][mycol]=1;
        setGrid(newArray);

        // transpose the array, because the drawing is transposed
        const newT = [];
        for(var i=0; i<grid.length; i++)
          newT.push([]);
        for(var i=0; i<grid.length; i++){
          for(var j=0; j<grid.length; j++)
            newT[j].push(newArray[i][j]);
        }
        image = newT.flat();
    }

    function handleSelectDigit(r,c){
      var mydigit = r*digSize+c;      
      image = DIGIT.weight[mydigit];
      console.log(r,c)

// load the image array into the URL to be displayed
      const p=4, myr=28;
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      var imageData = context.createImageData(p*myr, p*myr);
      const dataURIList = [];

      for (var pos=0; pos<p*p*myr*myr; pos++) {
          // i1,j1 = row and col for the physical grid
          let i1 = Math.floor(pos/(p*myr));
          let j1 = pos % (p*myr);
          let i = Math.floor(i1/p);
          let j = Math.floor(j1/p);
          let ind = i*myr+j;
          imageData.data[4*pos] = image[ind] * 255;
          imageData.data[4*pos + 1] = image[ind] * 255;
          imageData.data[4*pos + 2] = image[ind] * 255;
          imageData.data[4*pos + 3] = 255;      
      }
      context.putImageData(imageData,0,0);
      selectedImgUrl = canvas.toDataURL();
      doProof();
    }


  return (
    <div className="App">
      <div className="bigText">
        Draw a digit or select an image to submit to ML classifier and ZK Prover
      </div>
      <div className="vspace" />
      <MNISTBoard onChange={(r,c) => handleChangeData(r,c)}  />

      {/* <header className="App-header"> */}
        <div className='bigText'>
          <button className="button" onClick={doProof}>
            Capture image, compute embeddings, and generate zk proof
          </button>
        </div>
        <div className="vspace" />

      <MNISTDigits onClick={(r,c) => handleSelectDigit(r,c)} />
 
      {/* <div className="vspace" /> */}

        <h1>Output</h1>
        <h2>      <img src={selectedImgUrl} alt="" />
Recognized Digit: {publicSignal}</h2>
        <h4> Proof: {JSON.stringify(proof)}</h4>

        <div className="vspace" />

        <div className='centerObject'>
          <button className='button'
            onClick={verifyProof}>Verify Proof</button>
        </div>

        <h2>Verified by on-chain smart contract: {JSON.stringify(isVerified)}</h2>
        <p>Note: the verifier requires being connected to the chain</p>
      {/* </header> */}
      
    </div>
  );
}

export default App;