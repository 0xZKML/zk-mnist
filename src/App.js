import React, { useState, useRef, createRef} from 'react'
import './App.css'
import MNISTBoard from './MNISTBoard.js';

import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import path from 'path';
import './App.css';
// import Token from './artifacts/contracts/Token.sol/Token.json'
import { Tensor, InferenceSession } from "onnxruntime-web";



const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

function App() {
    //   const [greeting, setGreetingValue] = useState()
    const [quantizedEmbedding, setQuantizedEmbedding] = useState([])
    const [proof, setProof] = useState("")
    const [publicSignal, setPublicSignal] = useState()
    const [isVerified, setIsVerified] = useState(false);
    const size=28;
    const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0))); // initialize to a 28x28 array of 0's
    const [image, setImage] = useState([]); // the image array will eventually be a flattened version of grid (the 2-dim array)
    const strokeSize=3;
    var stroke = [];
    stroke.push([0.2,0.5,0.2]);
    stroke.push([0.5,1,0.5]);
    stroke.push([0.,0.5,0.2]);

    async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    async function doProof() {
      console.log(image)
      const session = await InferenceSession.create(
        "http://localhost:3000/trimmed_convet.onnx",
        {
          executionProviders: ["wasm"],
        }
      );

      const data = Float32Array.from(image)
      console.log(data)
      const tensor = new Tensor('float32', data, [1, 1, 28, 28]);
      console.log(tensor)
      const feeds = { input: tensor};
      const results = await session.run(feeds);
      const embeddingResult = results.output.data;
      console.log(embeddingResult)
      var tempQuantizedEmbedding = new Array(50)
      for (var i = 0; i < 50; i++)
        tempQuantizedEmbedding[i] = parseInt((embeddingResult[i]*1000).toFixed()) + 10000;

      if (typeof window.ethereum !== 'undefined') {
          console.log('generate proof with')
          console.log(tempQuantizedEmbedding)
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
        var newT = [];
        for(var i=0; i<grid.length; i++)
          newT.push([]);
        for(var i=0; i<grid.length; i++){
          for(var j=0; j<grid.length; j++)
            newT[j].push(newArray[i][j]);
        }
        
        setImage(newT.flat());
    }


  return (
    <div className="App">
      <MNISTBoard onChange={(r,c) => handleChangeData(r,c)}  />

      <header className="App-header">
        <div className='boardText'>
          <button className="button" onClick={doProof}>
            Capture image, compute embeddings, and generate zk proof
          </button>
        </div>


        <p></p>
        <div className='boardText'>
          <button className='button'
            onClick={verifyProof}>Verify Proof</button>
        </div>
        <h1>Output</h1>
        <h2> Recognized Digit: {publicSignal}</h2>
        <h4> Proof: {JSON.stringify(proof)}</h4>
        <h2>Verified by on-chain smart contract: {JSON.stringify(isVerified)}</h2>
        <p>Note: the verifier requires being connected to the chain</p>
      </header>
    </div>
  );
}

export default App;