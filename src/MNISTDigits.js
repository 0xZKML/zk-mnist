import React, { useEffect, useState } from "react";
import {DIGIT} from './mnistpics';
import './MNIST.css';
import './App.css';
import { Tensor, InferenceSession } from "onnxruntime-web";
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { CopyBlock, dracula } from "react-code-blocks";
import { doClassify } from "./Classify";
import { verifyProof } from "./MyVerify.js";
import { verifierAddress, batchSize, MNISTSIZE} from "./config"
// const verifierAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

export const digSize = 4;
const randomDigits = randints(0, DIGIT['weight'].length, 16);

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randints(lo, hi, cnt) {
  var nums = Array(cnt).fill(0);
  for (let i = 0; i < cnt; i++) {
    var idx = getRandomInt(lo, hi);
    nums[i] = idx;
  };
  return nums;
};

export function MNISTSelect(props) {
    const size = digSize; // array of images to choose from
    const [imgUrl, setImgUrl] = useState([]);
    const [selected, setSelected] = useState([]);
    const [prediction, setPrediction] = useState([]);
    const [publicSignal, setPublicSignal] = useState([]);
    const [proof, setProof] = useState("");
    const [proofDone, setProofDone] = useState(false)
    const [isVerified, setIsVerified] = useState(false);
    const [verifyDone, setVerifyDone] = useState(false)

    const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0)));
    const [gridChecked, setGridChecked] = useState(Array(size).fill(null).map(_ => Array(size).fill(false)));
    const digit = DIGIT.weight;
    const dataURIList = [];
    // const ONNXOUTPUT = 84;
    // const batchSize = 16; // saved model can only do 16 batch size
    // const MNISTSIZE = 784;
    var nrows = 4;
    var ncols = 4;
    var image = [];

    const getImg = async () => {
        const p = 7; // it's a p*r x p*r 2d grid of pixels
        const r = 28; // with pxp blocks of identical pixels
        // so it's effectively a rxr grid of large pxp block pixels
        // TODO: images are overlapping and getting hidden by subsequent images in grid
        const canvas = document.createElement('canvas')
        canvas.width = 196;
        canvas.height = 196;
        const context = canvas.getContext('2d')
        var imageData = context.createImageData(p*r, p*r);

        for(let n=0; n<size*size; n++){
            let idx = randomDigits[n];
            for (var pos=0; pos<p*p*r*r; pos++) {
                // i1,j1 = row and col for the physical grid
                let i1 = Math.floor(pos/(p*r));
                let j1 = pos % (p*r);
                let i = Math.floor(i1/p);
                let j = Math.floor(j1/p);
                let ind = i*r+j;
                imageData.data[4*pos] = digit[idx][ind] * 255;
                imageData.data[4*pos + 1] = digit[idx][ind] * 255;
                imageData.data[4*pos + 2] = digit[idx][ind] * 255;
                imageData.data[4*pos + 3] = 255;
            }
            context.putImageData(imageData, 0, 0);
            const dataURI = canvas.toDataURL();
            dataURIList.push(dataURI);
        }
        setImgUrl(dataURIList);
    };

    useEffect(
        () => {
        getImg();
        }
        , []);

    function getSelectedImages(selected) {
      var nselected = selected.length;
      var imgTensor = Array(batchSize * MNISTSIZE).fill(0);

      for (let i = 0; i < nselected; i++) {
        var idx = randomDigits[selected[i]];
        for (let j = 0; j < MNISTSIZE; j++) {
          imgTensor[i * MNISTSIZE + j] = digit[idx][j];
        }
      }
      return imgTensor;
    }

    async function doProof() {
      if (selected.length == 0) {
        console.log("No images selected");
        return;
      }
      // const batchSize = 16;
      var nselected = selected.length;
      var imgTensor = getSelectedImages(selected);
      const tensor = new Tensor('float32', Float32Array.from(imgTensor), [batchSize, 1, 28, 28]);

      const {quantizedEmbedding} = await doClassify(nselected,tensor,batchSize)
      const { proof, publicSignals } = await generateProof(quantizedEmbedding)
      // output of the circuit has size {batchSize} so we must slice
      console.log("Proofdone:");
      console.log(proof);
      console.log("classification:");
      console.log(publicSignals);
      setPrediction(publicSignals.slice(0, nselected));
      setPublicSignal(publicSignals);
      setProof(proof);
      setProofDone(true);
    }

    async function requestAccount() {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    async function doVerify() {
      const result = await verifyProof(proof, publicSignal)
      if (result!=null) {
        setIsVerified(result);
        setVerifyDone(true);
      }
    }

    // async function doVerify() {
    //     if (typeof window.ethereum !== 'undefined') {
    //       await requestAccount();
    //       const provider = new ethers.providers.Web3Provider(window.ethereum)
    //       const verifier = new ethers.Contract(verifierAddress, Verifier.abi, provider)
    //       const callArgs = await buildContractCallArgs(proof, publicSignal)
    //       try {
    //           const result = await verifier.verifyProof(...callArgs)
    //           console.log('verifier result = ',result)
    //           setIsVerified(result);
    //           setVerifyDone(true);
    //       } catch(err) {
    //           console.log(err)
    //       }
    //     }    
    //     else {
    //       alert('Please connect your wallet to the blockchain containing the verifier smart contract')
    //     }
    // }

    function GridSquare(row, col, onClick) {
        var _id = "imgSquareDigit(" + row + ", " + col + ")";
        return (
            <div className="imgSquareDigit">
              <input type="checkbox" id={_id} checked={gridChecked[row][col]} />
              <label htmlFor={_id} >
                <img src={imgUrl[row*size+col]} alt="" onClick = {()=>onClick(row, col)}/>
              </label>
            </div>
        );
    }

    function handleSelectDigit(r,c){
      var idx = r*digSize+c;
      image = DIGIT.weight[idx];
      //doProof();
    }

    function onClick(row, col) {
      console.log("Clicking " + row + ", " + col);
      var idx = row * size + col;
      var newSelected = selected.slice();
      var idxOf = newSelected.indexOf(idx);

      if (idxOf == -1) {
        newSelected.push(idx)
      } else {
        newSelected.splice(idxOf, 1);
      }
      newSelected.sort(function (a, b) {
        return a-b;
      });
      console.log('newSelected = ',newSelected)
      setSelected(newSelected);

      var newGridChecked = gridChecked.slice();
      newGridChecked[row][col] = !newGridChecked[row][col];
    }

    function renderCol(col) {
        var mycol = [];
        for (var row=0; row < size; row++) {
            mycol.push(
                <div>{GridSquare(row, col, onClick)}</div>
            );
        }
        return (
            <div>
                {mycol}
            </div>
        );
    }

    function RenderGrid() {
        var grid = [];
        for (var i = 0; i < size; i++) {
            grid.push(renderCol(i));
        }
        return grid;
    }

    function reset() {
      var newGridChecked = Array(size).fill(null).map(_ => Array(size).fill(false));
      setGridChecked(newGridChecked);
      setPublicSignal([]);
      setProof("");
      setProofDone(false);
      setVerifyDone(false);
      setSelected([]);
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

    function ResetButton() {

        return (
          <button className="button" onClick={reset}>
            Reset selection
          </button>
        );
    }
    function SelectAllButton() {
      return (
        <button className="button"
          onClick={() => {
            setSelected([...Array(size*size).keys()]);
            setGridChecked(Array(size).fill(null).map(_ => Array(size).fill(true)));
          }}
        >
          Select all
        </button>
      );
    }

    function DisplaySelection() {
      return (
          <div className="selectedPanel">
            <h2>Selected {selected.length} images</h2>
            <div>
              {selected.length > 0 ? "[" + selected.join(", ") + "]" : ""}
            </div>
          </div>
      );
    }

    function ProofBlock () {
        return (
          <div className="proof">
            <h2>Predictions</h2>
              {"[" + prediction.join(", ") + "]"}
              <h2>Public Signals</h2>
              {"[" + publicSignal.join(", ") + "]"}
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
        <div>
            <div className="MNISTBoard">
                <div className="bigText">
                    Select digits to to classify
                </div>

                <div className="centerObject">
                    <div className="grid">
                        {RenderGrid()}
                    </div>
                </div>
                <div className="buttonPanel">
                  <SelectAllButton />
                  <ProofButton />
                  <VerifyButton />
                  <ResetButton />
                </div>
                <DisplaySelection />
                {proofDone && ProofBlock()}
                {verifyDone && VerifyBlock()}
            </div>

        </div>
    );
}

