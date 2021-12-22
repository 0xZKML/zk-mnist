import React, { useState } from 'react'
import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
import './App.css'
import { INPUT } from './const';

import ReactDOM from "react-dom";

import { ethers } from 'ethers'
import Verifier from './artifacts/contracts/verifier.sol/Verifier.json'
import snarkjs from 'snarkjs';
import { generateProof, buildContractCallArgs } from "./snarkUtils";
import path from 'path';
import './App.css';
// import Token from './artifacts/contracts/Token.sol/Token.json'

class GridSquare extends React.Component {
    constructor(props) {
        super(props);
        this.row = props.row;
        this.col = props.col;
        this.grid = props.grid;
        this.state = {
            on: false,
        };
        props.handleReset(() => {this.reset(0)});
    }

    reset(val) {
        this.setState({on: val});
        this.grid[this.row][this.col] = val;
    }

    render() {
        return (
            <div className={"square" + (this.state.on ? " on" : " off")}
                onMouseEnter={() => {
                    if (this.props.mouseDown) {
                        this.setState({on: true});
                        this.grid[this.row][this.col] = 1;
                    }
                }}
            >
            </div>
        );
    }
}   

class MNISTBoard extends React.Component {
    constructor(props) {
        super(props);
        this.size = 28;
        this.grid = Array(this.size).fill(null).map(_ => Array(this.size).fill(0));
        this.valueUpdaters = Array(this.size).fill(null).map(() => Array(this.size).fill( _ => {})); // init as no-ops
        this.state = {
            predClass: null,
            mouseDown: false,
            resetHandlers: [],
        }

        this.input = INPUT;
        this.weight = this.input.weight;
        this.bias = this.input.bias;
        this.decimal_places = this.input.decimal_places;
        console.log(this.bias)
    }

    bindResetHandler = (func) => {
        this.state.resetHandlers.push(func);
    }; 

    bindValueHandler = (r, c, func) => {
        this.valueUpdaters[r][c] = func;
    };

    reset() {
        this.state.resetHandlers.forEach(func => {
            func();
        });
        this.setState({predClass: null, mouseDown: false});
    }

    classify() {
        var imgVec = this.grid.flat(); 
        var ypred = vecPlusVec(matByVec(this.weight, imgVec), this.bias); 
        var pred = argMax(ypred);
        this.setState({predClass: pred});
    }

    renderRow(row) {
        var grid = [];
        var rowCols = [];
        for (var col=0; col < this.size; col++) {
            rowCols.push([row, col]);
            grid.push(
                <GridSquare
                    row={row}
                    col={col}
                    grid={this.grid}
                    handleReset={this.bindResetHandler}
                    mouseDown={this.state.mouseDown} />
            );
        }
        
        return (
            <div>
                {grid}
            </div>
        );
    }

    renderClassifiedResult = () => {
        if (this.state.predclass !== null) {
            return (
                <div className="result">
                    Predicted class: {this.state.predClass}
                </div>
            );
        } else {
            return (<div>Predicted class: </div>);
        }
    };

    renderGrid() {
        var grid = [];
        for (var i = 0; i < this.size; i++) {
            grid.push(this.renderRow(i));
        }
        return grid;
    }

    render() {
        return (
            <div className="MNISTBoard"
                onMouseDown={() => {
                    this.setState({mouseDown: true});
                }}
                onMouseUp={() => {
                    this.setState({mouseDown: false});
                }}
            >
                <div className="grid">
                    <div>
                    Draw and classify a digit
                    </div>
                    {this.renderGrid()}
                </div>
                <div>
                    <button onClick={() => {this.classify();}}>
                    Classify
                    </button>
                    <button onClick={() => {this.reset();}}>
                    Reset image
                    </button>
                </div>
                {this.renderClassifiedResult()}
            </div>
        )
    };
}

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
      <MNISTBoard/>

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