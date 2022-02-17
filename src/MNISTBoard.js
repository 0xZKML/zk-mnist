import React, { useState, useRef } from 'react'
import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
import { INPUT } from './const';
import './MNISTBoard.css';

function GridSquare(row, col, handleReset, mouseDown, onChange) {
    const [on, setOn] = useState(false);
    handleReset(() => {reset(0)});

    function reset(val) {
        setOn(val);
        // grid[row][col] = val;
    }

    function handleChange() {
        if (mouseDown) {
            setOn(true);
            // grid[row][col] = 1;
            onChange(row,col)
        }
    }

    return (
        <div className={"square" + (on ? " on" : " off")}
            onMouseEnter={() => handleChange()}
        >
        </div>
    );
}   

export default function MNISTBoard(props) {
    const [mouseDown, setMouseDown] = useState(false);
    const [predClass, setPredClass] = useState(null);
    const [resetHandlers, setResetHandlers] = useState([]);

    const size = 28;

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

    function onSqChange(myrow, mycol) {
        props.onChange(myrow, mycol)
    }

    function renderRow(row) {
        var mygrid = [];
        var rowCols = [];
        for (var col=0; col < size; col++) {
            rowCols.push([row, col]);
            mygrid.push(
                <div>{GridSquare(row, col, bindResetHandler, mouseDown, onSqChange)}</div>
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
            <div className="boardText">
                Draw and classify a digit
            </div>
            <div className="boardObject">
                <div className="grid">
                    {RenderGrid()}
                </div>
            </div>
            <div className='boardText'>
                <button className="button" 
                    onClick={() => {reset()}}
                >
                    Reset image
                </button>
            </div>
        </div>
    )
}

