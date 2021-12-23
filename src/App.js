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
    const [image, setImage] = useState([])
    const [quantizedEmbedding, setQuantizedEmbedding] = useState([])
    const [proof, setProof] = useState("")
    const [publicSignal, setPublicSignal] = useState()
    const [isVerified, setIsVerified] = useState(false);
    const size=28;
    const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0)));

    

    async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    async function publishProof() {
        if (typeof window.ethereum !== 'undefined') {
          console.log('generate proof with')
          console.log(quantizedEmbedding)
            const { proof, publicSignals } = await generateProof(quantizedEmbedding)
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

    async function calcEmbedding() {
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

      setQuantizedEmbedding(tempQuantizedEmbedding)
    }

    async function myReset() {
      setGrid(Array(size).fill(null).map(_=> Array(size).fill(0)));
      setImage([])

    }

    function handleChangeData(myrow,mycol){
        // console.log('handleChangeData ',grid[0]);
        var newArray = [];
        for (var i = 0; i < grid.length; i++)
            newArray[i] = grid[i].slice();
        newArray[myrow][mycol]=1;
        setGrid(newArray);

        setImage(newArray.flat());
    }


  return (
    <div className="App">
      <MNISTBoard onChange={(r,c) => handleChangeData(r,c)}  />

      <header className="App-header">
        <p></p>
        <button onClick={myReset}>
        Reset Data
        </button>
        <p></p>
        <button onClick={calcEmbedding}>
           Compute Embeddings 
        </button>
        <p></p>
        <button onClick={publishProof}>
            Capture and publish proof
        </button>

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