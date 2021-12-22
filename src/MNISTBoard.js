import React, { useState } from 'react'
import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
import { INPUT } from './const';
import './MNISTBoard.css';

function GridSquare(row, col, grid, handleReset, mouseDown) {
    const [on, setOn] = useState(false);
    handleReset(() => {reset(0)});

    function reset(val) {
        setOn(val);
        grid[row][col] = val;
    }

    return (
        <div className={"square" + (on ? " on" : " off")}
            onMouseEnter={() => {
                if (mouseDown) {
                    setOn(true);
                    grid[row][col] = 1;
                }
            }}
        >
        </div>
    );
}   

export default function MNISTBoard(props) {
    const [mouseDown, setMouseDown] = useState(false);
    const [predClass, setPredClass] = useState(null);
    const [resetHandlers, setResetHandlers] = useState([]);
    const onChange = props.onChange;

    const size = 28;
    var grid = Array(size).fill(null).map(_ => Array(size).fill(0));
    //     this.valueUpdaters = Array(this.size).fill(null).map(() => Array(this.size).fill( _ => {})); // init as no-ops

    //     this.input = INPUT;
    //     this.weight = this.input.weight;
    //     this.bias = this.input.bias;
    //     this.decimal_places = this.input.decimal_places;
    //     console.log(this.bias)

    const bindResetHandler = (func) => {
        resetHandlers.push(func);
    }; 

    // bindValueHandler = (r, c, func) => {
    //     this.valueUpdaters[r][c] = func;
    // };

    function reset() {
        resetHandlers.forEach(func => {
            func();
        });
        setMouseDown(false);
    }

    function classify() {
        var imgVec = grid.flat(); 
        // var ypred = vecPlusVec(matByVec(this.weight, imgVec), this.bias); 
        // var pred = argMax(ypred);
        setPredClass(8);
    }

    function renderRow(row) {
        var mygrid = [];
        var rowCols = [];
        for (var col=0; col < size; col++) {
            rowCols.push([row, col]);
            mygrid.push(
                <div>{GridSquare(row, col, grid, bindResetHandler, mouseDown)}</div>
            );
        }   
        return (
            <div>
                {mygrid}
            </div>
        );
    }

    function renderClassifiedResult() {
        if (predClass !== null) {
            return (
                <div className="result">
                    Predicted class: {predClass}
                </div>
            );
        } else {
            return (<div>Predicted class: </div>);
        }
    };

    function RenderGrid() { 
        var grid = [];
        for (var i = 0; i < size; i++) {
            grid.push(renderRow(i));
        }
        return grid;
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
            <div className="grid">
                <div>
                    Draw and classify a digit
                </div>
                {RenderGrid()}
            </div>
            <div>
                <button onClick={() => {classify();}}>
                    Classify
                </button>
                <button onClick={() => {reset()}}>
                Reset image
                </button>
            </div>
            {renderClassifiedResult()}
        </div>
    )
}

