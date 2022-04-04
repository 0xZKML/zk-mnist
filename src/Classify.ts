import { Tensor, InferenceSession } from "onnxruntime-web";
import {DIGIT} from './mnistpics';
const randomDigits = randints(0, DIGIT['weight'].length, 16);
const ONNXOUTPUT = 84;




export const digSize = 4;

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




// const size = digSize; // 7x7 array of images to choose from
// const [imgUrl, setImgUrl] = useState([]);
// const [publicSignal, setPublicSignal] = useState([]);
// const [proof, setProof] = useState("");
// const [proofDone, setProofDone] = useState(false)
// const [grid, setGrid] = useState(Array(size).fill(null).map(_ => Array(size).fill(0)));
// const [gridChecked, setGridChecked] = useState(Array(size).fill(null).map(_ => Array(size).fill(false)));
// const dataURIList = [];
// var nrows = 4;
// var ncols = 4;
// var image = [];

// const getImg = async () => {
//     const p = 7; // it's a p*r x p*r 2d grid of pixels
//     const r = 28; // with pxp blocks of identical pixels
//     // so it's effectively a rxr grid of large pxp block pixels
//     // TODO: images are overlapping and getting hidden by subsequent images in grid
//     const canvas = document.createElement('canvas')
//     canvas.width = 196;
//     canvas.height = 196;
//     const context = canvas.getContext('2d')
//     var imageData = context.createImageData(p*r, p*r);

//     for(let n=0; n<size*size; n++){
//         let idx = randomDigits[n];
//         for (var pos=0; pos<p*p*r*r; pos++) {
//             // i1,j1 = row and col for the physical grid
//             let i1 = Math.floor(pos/(p*r));
//             let j1 = pos % (p*r);
//             let i = Math.floor(i1/p);
//             let j = Math.floor(j1/p);
//             let ind = i*r+j;
//             imageData.data[4*pos] = digit[idx][ind] * 255;
//             imageData.data[4*pos + 1] = digit[idx][ind] * 255;
//             imageData.data[4*pos + 2] = digit[idx][ind] * 255;
//             imageData.data[4*pos + 3] = 255;
//         }
//         context.putImageData(imageData, 0, 0);
//         const dataURI = canvas.toDataURL();
//         dataURIList.push(dataURI);
//     }
//     setImgUrl(dataURIList);
// };

// useEffect(
//     () => {
//     getImg();
//     }
//     , []);

// function getSelectedImages(selected) {
//   var nselected = selected.length;
//   var imgTensor = Array(batchSize * MNISTSIZE).fill(0);

//   for (let i = 0; i < nselected; i++) {
//     var idx = randomDigits[selected[i]];
//     for (let j = 0; j < MNISTSIZE; j++) {
//       imgTensor[i * MNISTSIZE + j] = digit[idx][j];
//     }
//   }
//   return imgTensor;
// }

export const doClassify = async (
  nselected:any,
  tensor:Tensor,
  batchSize:any
): Promise <{QuantizedEmbedding: any}> => {

  const session = await InferenceSession.create(
    //"http://localhost:3000/clientmodel.onnx",
    "http://localhost:3000/clientmodel_bs16.onnx",
    {
      executionProviders: ["wasm"],
    }
  );

  // get all selected images
  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]] = tensor;
  const results = await session.run(feeds);
  var output = results['19']['data'];
  console.log("output:");
  console.log(output);
  // var tempQuantizedEmbedding = new Array(ONNXOUTPUT)
  // var tempQuantizedEmbedding = Array(batchSize).fill().map(() => Array(ONNXOUTPUT));
  var QuantizedEmbedding = Array(batchSize).fill().map(() => Array(ONNXOUTPUT).fill(0));

  // tempQuantized should be a 2 d array
  for (var i = 0; i < nselected; i++) {
      for (var j = 0; j < ONNXOUTPUT; j++) {
        QuantizedEmbedding[i][j] = parseInt(output[i * ONNXOUTPUT + j].toFixed());
      }
  }
  let x=0
  return { QuantizedEmbedding};
};



