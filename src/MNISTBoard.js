import React, { useState, useRef } from 'react'
import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
import { INPUT } from './const';
import './MNIST.css';
import './App.css';

import { ethers } from 'ethers';
import { CopyBlock, dracula } from "react-code-blocks";
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json';
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import path from 'path';
import { Tensor, InferenceSession } from "onnxruntime-web";
import {DIGIT} from './mnistpics';
import {SNARKLAYER} from './snarklayer';
import {digSize} from './MNISTDigits.js';


const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const ONNXOUTPUT = 84; // length 84 vector output from onnx model
var image = []; // the image array will eventually be a flattened version of grid (the 2-dim array)

export function MNISTBoard(props) {
  const [mouseDown, setMouseDown] = useState(false);
  const size = 28;

  function GridSquare(row, col, onChange) {
    function handleChange() {
      if (mouseDown) {
        onChange(row,col)
      }
    }

    function handleMouseDown() {
      setMouseDown(true);
      onChange(row,col)
    }

    return (
      <div className={"square" + (props.grid[row][col] ? " on" : " off")}
      onMouseEnter={() => handleChange()}
      onMouseDown={()=>handleMouseDown()}
      >
      </div>
    );
  }

  function onSqChange(myrow, mycol) {
    props.onChange(myrow, mycol)
  }

  // Create column of of GridSquare objects
  function renderCol(col) {
    var mycol = [];
    for (var row=0; row < size; row++) {
      mycol.push(
        <div>{GridSquare(row, col, onSqChange)}</div>
      );
    }
    return (
      <div>
        {mycol}
      </div>
    );
  }

  function RenderGrid() {
    var mygrid = [];
    for (var i = 0; i < size; i++) {
      mygrid.push(renderCol(i));
    }
    return mygrid;
  }

  return (
    <div className="MNISTBoard"
      onMouseDown={() => {
        setMouseDown(true);
      }}
      onMouseUp={() => {
        setMouseDown(false);
      }}
    >
      <div className="centerObject">
        <div className="grid">
          {RenderGrid()}
        </div>
      </div>
    </div>
  )
}

export function MNISTApp() {
  const [quantizedEmbedding, setQuantizedEmbedding] = useState([])
  const [proof, setProof] = useState("")
  const [proofDone, setProofDone] = useState(false)
  const [publicSignal, setPublicSignal] = useState()
  const [isVerified, setIsVerified] = useState(false);
  const size=28;
  const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0))); // initialize to a 28x28 array of 0's
  const mydigit=17;

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async function doProof() {
    const session = await InferenceSession.create(
      "http://localhost:3000/clientmodel.onnx",
      {
        executionProviders: ["wasm"],
      }
    );

    const tensor = new Tensor('float32', Float32Array.from(image), [1, 1, 28, 28]);
    const feeds: Record<string, Tensor> = {};
    feeds[session.inputNames[0]] = tensor;
    // const feeds = { Input3: tensor};
    const results = await session.run(feeds);
    // console.log(results)
    var output = results['19']['data']
    // console.log('onnx model: ', output)
    // const snarkwt = SNARKLAYER.weight;
    // const snarkbias = SNARKLAYER.bias;
    // // console.log(snarkwt)
    // // console.log(snarkbias)
    // var result1 = multiplymatvec(snarkwt,output);
    // // console.log('result1 ', result1)
    // var result2 = addvec(result1,snarkbias);
    // // console.log('ML output = ',result2)
    // var winner = indexOfMax(result2)

    var tempQuantizedEmbedding = new Array(ONNXOUTPUT)
    for (var i = 0; i < ONNXOUTPUT; i++)
      tempQuantizedEmbedding[i] = parseInt(output[i].toFixed());

    if (typeof window.ethereum !== 'undefined') {
      const { proof, publicSignals } = await generateProof(tempQuantizedEmbedding)
      setPublicSignal(publicSignals);
      setProof(proof);
      setProofDone(true);
    } else {
      console.log("No metamask wallet found");
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

  function resetImage() {
    var newArray = Array(size).fill(null).map(_ => Array(size).fill(0));
    setGrid(newArray);
    setProofDone(false);
    image = newArray.flat();
  }

  function handleSetSquare(myrow,mycol){
    var newArray = [];
    for (var i = 0; i < grid.length; i++)
      newArray[i] = grid[i].slice();
    newArray[myrow][mycol]=1;
    setGrid(newArray);
    image = newArray.flat();
  }

  function ResetButton () {
    return (
      <button className="button" onClick={resetImage}>
        Reset image
      </button>
    );
  }

  function ProofButton () {
    return (
      <button className="button" onClick={doProof}>
        Classify & Prove
      </button>
    );
  }

  function ProofBlock () {
    return (
      <div className="proof">
        <h2>Result</h2>
          Model predicted: {publicSignal}
        <h2>Proof of computation</h2>
        <CopyBlock
          text={JSON.stringify(proof, null, 2)}
          language="json"
          theme={dracula}
        />
      </div>
    );
  }

  return (
    <div className="MNISTPage">
      <h2>Draw and classify a digit</h2>
      <div className="container">
        <MNISTBoard grid={grid} onChange={(r,c) => handleSetSquare(r,c)}  />
        <div className='buttonPanel'>
          <ProofButton />
          <ResetButton />
        </div>
      </div>
      {proofDone && ProofBlock()}
    </div>
  );
};
