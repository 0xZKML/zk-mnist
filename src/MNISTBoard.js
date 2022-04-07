import { useState } from 'react'
// import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
// import { INPUT } from './const';
import './MNIST.css';
import './App.css';

import { CopyBlock, dracula } from "react-code-blocks";
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import { Tensor, InferenceSession } from "onnxruntime-web";
import { doClassify } from "./Classify";
import { verifyProof } from "./MyVerify.js";


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

export function MNISTDraw() {
  const [quantizedEmbedding, setQuantizedEmbedding] = useState([])
  const [prediction, setPrediction] = useState([]);
  const [proof, setProof] = useState("")
  const [proofDone, setProofDone] = useState(false)
  const [publicSignal, setPublicSignal] = useState()
  const [isVerified, setIsVerified] = useState(false);
  const [verifyDone, setVerifyDone] = useState(false)
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

    var endTime = performance.now();
    console.log(`Call to doSomething took ${endTime - start} milliseconds`)

    var pstart = performance.now();
    const { proof, publicSignals } = await generateProof(quantizedEmbedding)
    var pend = performance.now();
    console.log(`Proof time: ${pend - pstart}ms`);
    setPrediction(publicSignals[0]);
    setPublicSignal(publicSignals);
    setProof(proof);
    setProofDone(true);

  }

  async function doVerify() {
    const result = await verifyProof(proof, publicSignal)
    if (result!=null) {
      setIsVerified(result);
      setVerifyDone(true);
    }
  }

  // async function verifyProof() {
  //   if (typeof window.ethereum !== 'undefined') {
  //     await requestAccount();
  //     const provider = new ethers.providers.Web3Provider(window.ethereum)
  //     const verifier = new ethers.Contract(verifierAddress, Verifier.abi, provider)
  //     const callArgs = await buildContractCallArgs(proof, publicSignal)
  //     try {
  //       const result = await verifier.verifyProof(...callArgs)
  //       console.log(result)
  //       setIsVerified(result)
  //     } catch(err) {
  //       console.log(err)
  //     }
  //   }
  // }

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

  function ProofButton () {
    return (
      <button className="button" onClick={doProof}>
        Classify & Prove
      </button>
    );
  }

  function VerifyButton () {
    return (
      <button className="button" onClick={doVerify}>
        Verify
      </button>
    );
  }

  function ResetButton () {
    return (
      <button className="button" onClick={resetImage}>
        Reset image
      </button>
    );
  }

  function ProofBlock () {
    return (
      <div className="proof">
        <h2>Prediction</h2>
        {prediction}
        <h2>Proof of computation</h2>
        <CopyBlock
          text={JSON.stringify(proof, null, 2)}
          language="json"
          theme={dracula}
        />
      </div>
    );
  }
 
  function VerifyBlock () {
    return (
      <div className="proof">
        <h2>Verified by on-chain smart contract: {JSON.stringify(isVerified)}</h2>
      </div>
    );
  }

  return (
    <div className="MNISTPage">
      <h2>Draw and classify a digit</h2>
      <div className="container">
        <MNISTBoard grid={grid} onChange={(r,c) => handleSetSquare(r,c)}  />

        <div className="buttonPanel">
          <ProofButton />
          <VerifyButton />
          <ResetButton />
        </div>
      </div>
      {proofDone && ProofBlock()}
      {verifyDone && VerifyBlock()}
    </div>
  );
};
