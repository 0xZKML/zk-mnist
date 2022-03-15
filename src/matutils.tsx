export function zeros(m, n) {
    return Array(m).fill(null).map(() => Array(n).fill(0));
}

export const matmul = (A, B) => {
    var m = A.length;
    var n = A[0].length; // A = (m x n)
    var p = B[0].length; // B = (n x p)
    if (B.length !== n) {
        console.log("Incorrect size for matmul!");
    }
    var C = zeros(m, n);;

    for (var i = 0; i < m; i++) {
        for (var j = 0; j < p; j++) {
            for (var k = 0; k < n; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C;
};

export const matByVec = (A, b) => {
    var m = A.length;
    var n = A[0].length;
    if (b.length !== n) {
        console.log("Incorrect size for mat x vec!");
    }
    var C = Array(m).fill(0);

    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            C[i] += A[i][j]*b[j];
        }
    }
    return C;
};

export const vecPlusVec = (a, b) => {
    var n = a.length;
    var c = Array(n).fill(0);
    for (var i = 0; i < n; i++) {
        c[i] = a[i] + b[i];
    }
    return c;
}

export const matPlusVec = (A, b) => {
    var m = A.length;
    var n = A[0].length;
    if (b.length !== m) {
        console.log("Incorrect size for mat + vec!");
    }
    var C = zeros(m, n);
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < n; j++) {
            C[i][j] = A[i][j] + b[i];
        }
    }
    return C;
};

export const argMax = (v) => {
    var max = v[0];
    var amax = 0;

    for (var i = 1; i < v.length; i++) {
        if (v[i] > max) {
            amax = i;
            max = v[i];
        }
    }
    return amax;
}

function indexOfMax(arr) { // implement Argmax()
    if (arr.length === 0) {
      return -1;
    }
    var max = arr[0];
    var maxIndex = 0;
    for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
        maxIndex = i;
        max = arr[i];
      }
    }
    return maxIndex;
}

function multiplymatvec(mat, vec) {
    var aNumRows = mat.length, aNumCols = mat[0].length,
      bNumRows = vec.length
    if (aNumCols!=bNumRows){
      alert('Error in multiplymatvec()!')
    }
    var m = new Array(aNumRows);
    for (var r = 0; r < aNumRows; ++r) {
      m[r] = 0;
      for (var i = 0; i < aNumCols; ++i) {
        m[r] += mat[r][i] * vec[i];
      }
    }
    return m;
}

function addvec(v1, v2) {
    var aNumRows = v1.length, bNumRows = v2.length;
    if (aNumRows!=bNumRows){
      alert('Error in addvec()!')
    }
    var m = new Array(aNumRows);
    for (var r = 0; r < aNumRows; r++) {
      m[r] = v1[r] + v2[r];
    }
    return m;
  }

function convImgUrl(image) {
    // load the image array into the URL to be displayed
    const p=4, myr=28;
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    var imageData = context.createImageData(p*myr, p*myr);
    const dataURIList = [];

    for (var pos=0; pos<p*p*myr*myr; pos++) {
      // i1,j1 = row and col for the physical grid
      let i1 = Math.floor(pos/(p*myr));
      let j1 = pos % (p*myr);
      let i = Math.floor(i1/p);
      let j = Math.floor(j1/p);
      let ind = i*myr+j;
      imageData.data[4*pos] = image[ind] * 255;
      imageData.data[4*pos + 1] = image[ind] * 255;
      imageData.data[4*pos + 2] = image[ind] * 255;
      imageData.data[4*pos + 3] = 255;
    }
    context.putImageData(imageData,0,0);
    return(canvas.toDataURL())
  }

/*

    var A = [[1, 0], [0, 1]];
    var B = [[2, 3], [5, 7]];
    var E = [[0], [1], [2]]
    var d = [100, 300, 500];
    var C = matmul(A, B);
    var D = matPlusVec(E, d);
    console.log("Matmul:");
    console.log(C);
    console.log("Matvec:");
    console.log(D)

*/
