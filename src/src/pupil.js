(function(window) {

    window.gazer = window.gazer || {};
    gazer.pupil = gazer.pupil || {};

/**
 * Returns intensity value at x,y position of a pixels image
 * @param{array} pixels - array of size width*height
 * @param{number} x -  input x value
 * @param{number} y - input y value
 * @param{number} width - width of pixels image
 * @returns{number} - intensity value in [0,255]
 */
var getValue = function (pixels, x, y, width){
    return pixels[y * width + x];
}

/**
 * Computes summation area table/integral image of a pixel matrix
 * @param{pixels} pixels value of eye area
 * @param{number} width - of image in 'pixels'
 * @param{number} height - of image in 'pixels'
 * @returns{2d array} -integral image
 */
var getSumTable = function (pixels, width, height){
    var integralImage = new Array(width);
    var sumx = 0;
    var sumy = 0;

    for (var i = 0; i < width; i++){
        integralImage[i] = new Array(height);
        sumx += getValue(pixels, i, 0, width);
        integralImage[i][0] = sumx;
    }

    for (var i = 0; i < height; i++){
        sumy += getValue(pixels, 0, i, width);
        integralImage[0][i] = sumy;
    }

    for (var x = 1; x < width; x++){
        for (var y = 1; y < height; y++){
            integralImage[x][y] = getValue(pixels, x, y, width) + integralImage[x - 1][y] + integralImage[x][y - 1] - integralImage[x - 1][y - 1];
        }
    }
    return integralImage;
}


var getSinglePupil = function (pixels, width, height){
    var summedAreaTable = getSumTable(pixels, width, height);
    var bestAvgScore = 999999; //want to minimize this score
    var bestPoint = [0, 0]; //bottom right corner of best fitted pupil
    var bestHalfWidth = 0; //corresponding half width of the best fitted pupil
    var offset = Math.floor(width / 10.0); //padding
    //halfWidth could also start at 1, but this makes it faster
    for (var halfWidth = Math.floor(height / 10.0); halfWidth < width / 2; halfWidth++){
        //think of a sliding rectangular window of width halfWidth*2 that goes through the whole eye pixel matrix and does the following:
        //1) computes the irisArea, which is the total intensity of the iris
        //2) computes the scleraIrisArea, which is multiple rows of pixels including the sclera and iris.
        //3) computes avg, which is the intensity of the area divided by the number of pixels.               
        //start at the bottom right of the rectangle!not top left
        for (var x = halfWidth; x < width - offset; x++){
            for (var y = halfWidth; y < height - offset; y++){
                //evaluate area by the formula found on wikipedia about the summed area table: I(D)+I(A)-I(B)-I(C)
                var irisArea = summedAreaTable[x + offset][y + offset] + summedAreaTable[x + offset - halfWidth][y + offset - halfWidth] - summedAreaTable[x + offset][y + offset - halfWidth] - summedAreaTable[x + offset - halfWidth][y + offset];
                var avgScore = 1.0 * irisArea / ((halfWidth + 1) * (halfWidth + 1)) + 1; 
                //summation area table again
                var scleraIrisArea = ((1.0 * summedAreaTable[width - 1 - offset][y + offset] + summedAreaTable[0 + offset][y + offset - halfWidth] - summedAreaTable[0 + offset][y + offset] - summedAreaTable[width - 1 - offset][y + offset - halfWidth]) - irisArea);
                //minimize avgScore/scleraIrisArea. 150 is too high, might have to change since it's closer to white
                if ((avgScore) / scleraIrisArea < bestAvgScore && avgScore < 150){
                    bestAvgScore = (avgScore) / scleraIrisArea;
                    bestPoint = [x + offset, y + offset];
                    bestHalfWidth = halfWidth;
                }
            }
        }
    }
    return [bestPoint, bestHalfWidth];
}

gazer.pupil.getPupils = function(eyesObj) {
    if (!eyesObj) {
        return eyesObj;
    }
    if (!eyesObj.left.blink) {
        eyesObj.left.pupil = getSinglePupil(eyesObj.left.patch, eyesObj.left.width, eyesObj.left.height)[0];
        eyesObj.left.pupil[0] += eyesObj.left.imagex;
        eyesObj.left.pupil[1] += eyesObj.left.imagey;
    }
    if (!eyesObj.right.blink) {
        eyesObj.right.pupil = getSinglePupil(eyesObj.right.patch, eyesObj.right.width, eyesObj.right.height)[0];
        eyesObj.right.pupil[0] += eyesObj.right.imagex;
        eyesObj.right.pupil[1] += eyesObj.right.imagey;
    }
    return eyesObj;
}
}(window));