import { Tensor, InferenceSession } from "onnxruntime-web";
const ONNXOUTPUT = 84;

export const doClassify = async (
  nselected:any,
  tensor:Tensor,
  batchSize:any
): Promise <{quantizedEmbedding: any}> => {

  const session = await InferenceSession.create(
    //"http://localhost:3000/clientmodel.onnx",
    // "http://localhost:3000/clientmodel_bs16.onnx",
    "./clientmodel_bs16.onnx",
    {
      executionProviders: ["wasm"],
    }
  );
  console.log('load the .onnx resource')

  const feeds: Record<string, Tensor> = {};
  feeds[session.inputNames[0]] = tensor;
  const results = await session.run(feeds);
  var output = results['19']['data'];
  console.log("output:");
  console.log(output);
  // var tempQuantizedEmbedding = new Array(ONNXOUTPUT)
  // var tempQuantizedEmbedding = Array(batchSize).fill().map(() => Array(ONNXOUTPUT));
  var quantizedEmbedding = Array(batchSize).fill().map(() => Array(ONNXOUTPUT).fill(0));
  for (var i = 0; i < nselected; i++) {
      for (var j = 0; j < ONNXOUTPUT; j++) {
        quantizedEmbedding[i][j] = parseInt(output[i * ONNXOUTPUT + j].toFixed());
      }
  }
  return { quantizedEmbedding};
};



