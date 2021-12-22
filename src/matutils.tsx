function zeros(m, n) {
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