import React, { useEffect, useState } from "react";
import {DIGIT} from './mnistpics';

export default function MNISTDigits(props) {
    const [imgUrl, setImgUrl] = useState();
    const digit = DIGIT.weight[props.sel]

    const getImg = async () => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        var imageData = context.createImageData(28, 28);
        for (var i = 0; i < 28*28; i++) {
          imageData.data[i * 4] = digit[i] * 255;
          imageData.data[i * 4 + 1] = digit[i] * 255;
          imageData.data[i * 4 + 2] = digit[i] * 255;
          imageData.data[i * 4 + 3] = 255;
        }
        context.putImageData(imageData,0,0);
        const dataURI = canvas.toDataURL()
        setImgUrl(dataURI);        
    };

    useEffect(() => {
        getImg();
        }, []);

    return (
        <div>
            <img src={imgUrl} alt="" />
        </div>
    );
}