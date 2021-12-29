import React, { useState } from 'react'
import { matmul, matPlusVec, zeros, vecPlusVec, matByVec, argMax } from './matutils';
import './App.css'
import { INPUT } from './const';

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

export default function App() {
  return (
      <MNISTBoard/>
  )
}