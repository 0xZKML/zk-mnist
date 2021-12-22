"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var react_1 = require("react");
var matutils_1 = require("./matutils");
require("./App.css");
var const_1 = require("./const");
var GridSquare = /** @class */ (function (_super) {
    __extends(GridSquare, _super);
    function GridSquare(props) {
        var _this = _super.call(this, props) || this;
        _this.row = props.row;
        _this.col = props.col;
        _this.grid = props.grid;
        _this.state = {
            on: false
        };
        props.handleReset(function () { _this.reset(0); });
        return _this;
    }
    GridSquare.prototype.reset = function (val) {
        this.setState({ on: val });
        this.grid[this.row][this.col] = val;
    };
    GridSquare.prototype.render = function () {
        var _this = this;
        return (<div className={"square" + (this.state.on ? " on" : " off")} onMouseEnter={function () {
                if (_this.props.mouseDown) {
                    _this.setState({ on: true });
                    _this.grid[_this.row][_this.col] = 1;
                }
            }}>
            </div>);
    };
    return GridSquare;
}(react_1["default"].Component));
var MNISTBoard = /** @class */ (function (_super) {
    __extends(MNISTBoard, _super);
    function MNISTBoard(props) {
        var _this = _super.call(this, props) || this;
        _this.bindResetHandler = function (func) {
            _this.state.resetHandlers.push(func);
        };
        _this.bindValueHandler = function (r, c, func) {
            _this.valueUpdaters[r][c] = func;
        };
        _this.renderClassifiedResult = function () {
            if (_this.state.predclass !== null) {
                return (<div className="result">
                    Predicted class: {_this.state.predClass}
                </div>);
            }
            else {
                return (<div>Predicted class: </div>);
            }
        };
        _this.size = 28;
        _this.grid = Array(_this.size).fill(null).map(function (_) { return Array(_this.size).fill(0); });
        _this.valueUpdaters = Array(_this.size).fill(null).map(function () { return Array(_this.size).fill(function (_) { }); }); // init as no-ops
        _this.state = {
            predClass: null,
            mouseDown: false,
            resetHandlers: []
        };
        _this.input = const_1.INPUT;
        _this.weight = _this.input.weight;
        _this.bias = _this.input.bias;
        _this.decimal_places = _this.input.decimal_places;
        console.log(_this.bias);
        return _this;
    }
    MNISTBoard.prototype.reset = function () {
        this.state.resetHandlers.forEach(function (func) {
            func();
        });
        this.setState({ predClass: null, mouseDown: false });
    };
    MNISTBoard.prototype.classify = function () {
        var imgVec = this.grid.flat();
        var ypred = (0, matutils_1.vecPlusVec)((0, matutils_1.matByVec)(this.weight, imgVec), this.bias);
        var pred = (0, matutils_1.argMax)(ypred);
        this.setState({ predClass: pred });
    };
    MNISTBoard.prototype.renderRow = function (row) {
        var grid = [];
        var rowCols = [];
        for (var col = 0; col < this.size; col++) {
            rowCols.push([row, col]);
            grid.push(<GridSquare row={row} col={col} grid={this.grid} handleReset={this.bindResetHandler} mouseDown={this.state.mouseDown}/>);
        }
        return (<div>
                {grid}
            </div>);
    };
    MNISTBoard.prototype.renderGrid = function () {
        var grid = [];
        for (var i = 0; i < this.size; i++) {
            grid.push(this.renderRow(i));
        }
        return grid;
    };
    MNISTBoard.prototype.render = function () {
        var _this = this;
        return (<div className="MNISTBoard" onMouseDown={function () {
                _this.setState({ mouseDown: true });
            }} onMouseUp={function () {
                _this.setState({ mouseDown: false });
            }}>
                <div className="grid">
                    <div>
                    Draw and classify a digit
                    </div>
                    {this.renderGrid()}
                </div>
                <div>
                    <button onClick={function () { _this.classify(); }}>
                    Classify
                    </button>
                    <button onClick={function () { _this.reset(); }}>
                    Reset image
                    </button>
                </div>
                {this.renderClassifiedResult()}
            </div>);
    };
    ;
    return MNISTBoard;
}(react_1["default"].Component));
function App() {
    return (<MNISTBoard />);
}
exports["default"] = App;
