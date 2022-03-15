import React, { useState } from 'react'
import './App.css'
import MNISTBoard from './MNISTBoard.js';
import MNISTDigits from './MNISTDigits.js';

import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import path from 'path';
import './App.css';
import { Tensor, InferenceSession } from "onnxruntime-web";
const ONNXOUTPUT = 84; // length 84 vector output from onnx model
import {DIGIT} from './mnistpics';
import {SNARKLAYER} from './snarklayer';
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

    function indexOfMax(arr) { // implement Argmax()
      if (arr.length === 0) {
          return -1;
      } 
      var max = arr[0];
      var maxIndex = 0;
      for (var i = 1; i < arr.length; i++) {
          if (arr[i] > max) {
              maxIndex = i;
              max = arr[i];
          }
      }
      return maxIndex;
    }

    function multiplymatvec(mat, vec) { 
      var aNumRows = mat.length, aNumCols = mat[0].length,
          bNumRows = vec.length
      if (aNumCols!=bNumRows){
        alert('Error in multiplymatvec()!')
      }
      var m = new Array(aNumRows);
      for (var r = 0; r < aNumRows; ++r) {
          m[r] = 0;
          for (var i = 0; i < aNumCols; ++i) {
            m[r] += mat[r][i] * vec[i];
          }
      }
      return m;
    }

    function addvec(v1, v2) { 
      var aNumRows = v1.length, bNumRows = v2.length;
      if (aNumRows!=bNumRows){
        alert('Error in addvec()!')
      }
      var m = new Array(aNumRows);
      for (var r = 0; r < aNumRows; r++) {
        m[r] = v1[r] + v2[r];
      }
      return m;
    }

    async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    async function doProof() {
      selectedImgUrl = convImgUrl(image);
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
      // console.log('tempquantizedembeddin ',tempQuantizedEmbedding)

      if (typeof window.ethereum !== 'undefined') {
            const { proof, publicSignals } = await generateProof(tempQuantizedEmbedding)
            setPublicSignal(publicSignals);
            // setPublicSignal(winner.toString());
            setProof(proof);
      }
      else {
        console.log(window.ethereum)
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
      image = newArray.flat();
    }

    function handleSetSquare(myrow,mycol){
        var newArray = [];
        for (var i = 0; i < grid.length; i++)
            newArray[i] = grid[i].slice();
        newArray[myrow][mycol]=1;
        setGrid(newArray);
        image = newArray.flat();
        selectedImgUrl = convImgUrl(image);

    }

    function handleSelectDigit(r,c){
      var mydigit = r*digSize+c;      
      image = DIGIT.weight[mydigit];
      doProof();
    }

    function convImgUrl(image) {
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
      return(canvas.toDataURL())
    }

  return (
    <div className="App">
      <div className="bigText">
        Draw a digit or select an image to submit to ML classifier and ZK Prover
      </div>
      <div className="vspace" />
      <MNISTBoard grid={grid} onChange={(r,c) => handleSetSquare(r,c)}  />

        <div className='bigText'>
          <button className="button" onClick={resetImage} >
            Reset image
          </button>
        </div>
        <div className='bigText'>
          <button className="button" onClick={doProof}>
            Capture image, compute embeddings, and generate zk proof
          </button>
        </div>
        <div className="vspace" />

      <MNISTDigits onClick={(r,c) => handleSelectDigit(r,c)} />
 
      <h1>Output</h1>
      <div className="singleLine">
        <img className = "digImg" src={selectedImgUrl} alt="" />
        <div className = "recDig">
          Recognized Digit: {publicSignal}
        </div>
      </div>
      <h2> Proof:</h2> 
        <h4 className="proof">{JSON.stringify(proof)}</h4>

      <div className="vspace" />

      <div className='centerObject'>
        <button className='button'
          onClick={verifyProof}>Verify Proof</button>
      </div>

      <h2>Verified by on-chain smart contract: {JSON.stringify(isVerified)}</h2>
      <p>Note: the verifier requires being connected to the chain</p>
      
    </div>
  );
}

export default App;
