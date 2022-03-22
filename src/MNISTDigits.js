import React, { useEffect, useState } from "react";
import {DIGIT} from './mnistpics';
import './MNIST.css';
import MNISTBoard from './MNISTBoard.js';
import { Tensor, InferenceSession } from "onnxruntime-web";
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import { CopyBlock, dracula } from "react-code-blocks";

export const digSize = 4;
const random_subset = randints(0, DIGIT['weight'].length, 16);

    // console.log(results)
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

export function MNISTDigits(props) {
    const size = digSize; // 7x7 array of images to choose from
    const [imgUrl, setImgUrl] = useState([]);
    const [selected, setSelected] = useState([]);
    const [publicSignal, setPublicSignal] = useState([]);
    const [proof, setProof] = useState("");
    const [proofDone, setProofDone] = useState(false)
    const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0)));
    const digit = DIGIT.weight;
    const dataURIList = [];
    const ONNXOUTPUT = 84;
    const batchSize = 16; // saved model can only do 16 batch size
    const MNISTSIZE = 784;
    var nrows = 4;
    var ncols = 4;
    var image = [];

    const getImg = async () => {
        const p = 7; // it's a p*r x p*r 2d grid of pixels
        const r = 28; // with pxp blocks of identical pixels
        // so it's effectively a rxr grid of large pxp block pixels
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        var imageData = context.createImageData(p*r, p*r);

        // TODO: can randomly sample digits instead
        for(let n=0; n<size*size; n++){
            let idx = random_subset[n];
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
            context.putImageData(imageData,0,0);
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
        var idx = random_subset[selected[i]];
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
      const session = await InferenceSession.create(
        //"http://localhost:3000/clientmodel.onnx",
        "http://localhost:3000/clientmodel_bs16.onnx",
        {
          executionProviders: ["wasm"],
        }
      );

      // get all selected images
      const batchSize = 16;
      var nselected = selected.length;
      var imgTensor = getSelectedImages(selected);
      const tensor = new Tensor('float32', Float32Array.from(imgTensor), [batchSize, 1, 28, 28]);
      const feeds: Record<string, Tensor> = {};
      feeds[session.inputNames[0]] = tensor;
      const results = await session.run(feeds);
      var output = results['19']['data'];
      console.log("output:");
      console.log(output);
      // var tempQuantizedEmbedding = new Array(ONNXOUTPUT)
      // var tempQuantizedEmbedding = Array(batchSize).fill().map(() => Array(ONNXOUTPUT));
      var tempQuantizedEmbedding = Array(batchSize).fill().map(() => Array(ONNXOUTPUT).fill(0));

      // tempQuantized should be a 2 d array
      for (var i = 0; i < nselected; i++) {
          for (var j = 0; j < ONNXOUTPUT; j++) {
            tempQuantizedEmbedding[i][j] = parseInt(output[i * ONNXOUTPUT + j].toFixed());
          }
      }

      if (typeof window.ethereum !== 'undefined') {
            const { proof, publicSignals } = await generateProof(tempQuantizedEmbedding)
            // output of the circuit has size {batchSize} so we must slice
            console.log("Proofdone:");
            console.log(proof);
            console.log("classification:");
            console.log(publicSignals);
            setPublicSignal(publicSignals.slice(0, nselected));
            setProof(proof);
            setProofDone(true);
      }
      else {
        console.log(window.ethereum)
      }
    }

    function GridSquare(row, col, onClick) {
        return (
            <div className={"imgSquare"}
            onClick = {()=>onClick(row, col)}
            >
            {/* row = {row}, col = {col} */}
            <img src={imgUrl[row*size+col]} alt="" />
            </div>
        );
    }

    function handleSelectDigit(r,c){
      var idx = r*digSize+c;
      image = DIGIT.weight[idx];
      //doProof();
    }

    function onClick(myrow, mycol) {
      console.log("Clicking " + myrow + ", " + mycol);
      handleSelectDigit(myrow, mycol);
      var idx = myrow * size + mycol;
      var newSelected = selected.slice();
      var idxOf = newSelected.indexOf(idx);

      if (idxOf == -1) {
        newSelected.push(idx)
      } else {
        newSelected.splice(idxOf, 1);
      }
      newSelected.sort();
      setSelected(newSelected);
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
      setPublicSignal([]);
      setProof("");
      setProofDone(false);
      setSelected([]);
    }

    function ProofButton () {
        return (
          <button className="button" onClick={doProof}>
            Classify & Prove
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
        <button className="button" onClick={() => {setSelected([...Array(size*size).keys()]);}}>
          Select all
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
            <h2>Results</h2>
              Model predicted: {"[" + publicSignal.join(", ") + "]"}
            <h2>Proof of computation</h2>
            <CopyBlock
              text={JSON.stringify(proof, null, 2)}
              language="json"
              theme={dracula}
            />
          </div>
        );
    }
    function DisplaySelection() {
      return (
          <div className="selectedPanel">
            <h2>Selected {selected.length} images:</h2>
            <div>
              {selected.length > 0 ? "[" + selected.join(", ") + "]" : ""}
            </div>
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
                  <ResetButton />
                </div>
                <DisplaySelection />
                {proofDone && ProofBlock()}
            </div>

        </div>
    );
}
