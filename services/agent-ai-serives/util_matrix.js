import * as tf from '@tensorflow/tfjs'; 

function createMatrix(rows, cols, mean = 0, stdDev = 1) {
    return tf.randomNormal([rows, cols], mean, stdDev);
}
function addMatrices(matrixA, matrixB) { 
    return tf.add(matrixA, matrixB);
}
function multiplyMatrices(matrixA, matrixB) {
    return tf.matMul(matrixA, matrixB);
}
function subtractMatrices(matrixA, matrixB) {
    return tf.sub(matrixA, matrixB);
}
function transposeMatrix(matrix){
    return tf.transpose(matrix);
}
function softmaxMatrix(matrix){ 
    return tf.softmax(matrix);
}
function reluMatrix(matrix){ 
    return tf.relu(matrix);
}
function sigmoidMatrix(matrix){ 
    return tf.sigmoid(matrix);
}
function outerProduct(vectorA, vectorB) {
    return tf.outerProduct(vectorA, vectorB);
}

export {
    createMatrix,
    addMatrices,
    multiplyMatrices,
    subtractMatrices,
    transposeMatrix,
    softmaxMatrix,
    reluMatrix,
    sigmoidMatrix,
    outerProduct,
}
