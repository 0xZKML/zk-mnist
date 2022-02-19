import React, { useState, useRef } from 'react'
import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
import { INPUT } from './const';
import './MNIST.css';



export default function MNISTBoard(props) {
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
            <div className="bigText">
                Draw and classify a digit
            </div>
            <div className="centerObject">
                <div className="grid">
                    {RenderGrid()}
                </div>
            </div>
        </div>
    )
}

