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
import { doClassify } from "./Classify";


const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const ONNXOUTPUT = 84; // length 84 vector output from onnx model

function MNISTBoard(props) {
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
  const size = 28;
  const MNISTSIZE = 784; // TODO: merge constants with MNISTDIGIT constants
  const batchSize = 16;
  const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0))); // initialize to a 28x28 array of 0's

  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  async function doProof() {
    var start = performance.now();
    const session = await InferenceSession.create(
      // "http://localhost:3000/clientmodel.onnx",
      "http://localhost:3000/clientmodel_bs16.onnx",
      {
        executionProviders: ["wasm"],
      }
    );
    // get image from grid
    var imgTensor = Array(batchSize * MNISTSIZE).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        imgTensor[i * size + j] = grid[i][j];
      }
    }

    var nselected = 1;
    const tensor = new Tensor('float32', Float32Array.from(imgTensor), [batchSize, 1, 28, 28]);
    const {quantizedEmbedding} = await doClassify(nselected,tensor,batchSize)

    // var imgStr = imgTensor.slice(0, 784).join(", ");
    // console.log("img_str = [" + imgStr + "]");
    // const tensor = new Tensor('float32', Float32Array.from(imgTensor), [batch, 1, 28, 28]);
    // console.log('tensor is:');
    // console.log(tensor);
    // const feeds: Record<string, Tensor> = {};
    // feeds[session.inputNames[0]] = tensor;
    // const results = await session.run(feeds);
    // var output = results['19']['data']
    // console.log("output:");
    // console.log(output.slice(0, 5));
    // var tempQuantizedEmbedding = new Array(ONNXOUTPUT)
    // for (var i = 0; i < ONNXOUTPUT; i++)
    //   tempQuantizedEmbedding[i] = parseInt(output[i].toFixed());

    var endTime = performance.now();
    console.log(`Call to doSomething took ${endTime - start} milliseconds`)

    var pstart = performance.now();
    const { proof, publicSignals } = await generateProof(quantizedEmbedding)
    var pend = performance.now();
    console.log(`Proof time: ${pend - pstart}ms`);
    setPublicSignal(publicSignals.slice(0, 1)); // circuit spits out batch result
    setProof(proof);
    setProofDone(true);
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
    for (let i = 0; i < imgTensor.length; i++) {
      imgTensor[i] = 0;
    }
  }

  function handleSetSquare(myrow,mycol){
    var newArray = [];
    for (var i = 0; i < grid.length; i++)
      newArray[i] = grid[i].slice();
    newArray[myrow][mycol]=1;
    setGrid(newArray);
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
