import React, { useEffect, useState } from "react";
import {DIGIT} from './mnistpics';
import './MNIST.css';
import MNISTBoard from './MNISTBoard.js';

export const digSize = 7;

export default function MNISTDigits(props) {
    const size=digSize; // 7x7 array of images to choose from
    const [imgUrl, setImgUrl] = useState([]);
    const digit = DIGIT.weight;

    const getImg = async () => {
        const p = 4; // it's a p*r x p*r 2d grid of pixels
        const r = 28; // with pxp blocks of identical pixels
        // so it's effectively a rxr grid of large pxp block pixels
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        var imageData = context.createImageData(p*r, p*r);
        const dataURIList = [];
        for(let n=0; n<size*size; n++){
            for (var pos=0; pos<p*p*r*r; pos++) {
                // i1,j1 = row and col for the physical grid
                let i1 = Math.floor(pos/(p*r));
                let j1 = pos % (p*r);
                let i = Math.floor(i1/p);
                let j = Math.floor(j1/p);
                let ind = i*r+j;
                imageData.data[4*pos] = digit[n][ind] * 255;
                imageData.data[4*pos + 1] = digit[n][ind] * 255;
                imageData.data[4*pos + 2] = digit[n][ind] * 255;
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


        function GridSquare(row, col, onClick) {

            function handleChange() {
                console.log('in handleChange, clicked on',row,col)
                onClick(row,col)
            }
        
            return (
                <div className={"imgSquare"}
                    onClick = {()=>handleChange()}
                >
                    {/* row = {row}, col = {col} */}
                    <img src={imgUrl[row*size+col]} alt="" />
                </div>
            );
        }   

    function onClick(myrow, mycol) {
        props.onClick(myrow, mycol)
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

    return (

        <div>
            <div className="MNISTBoard">
                <div className="bigText">
                    Click on digit to submit
                </div>

                <div className="centerObject">
                    <div className="grid">
                        {RenderGrid()}
                    </div>
                </div>
            </div>

        </div>
    );
}