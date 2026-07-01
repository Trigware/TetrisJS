const Color = {
    wall: "#495052",
    air: "#838c8f",
    cyan: "#33c4f5",
    yellow: "#f2e129",
    purple: "#b437bd",
    blue: "#4346cc",
    orange: "#f5864e",
    green: "#8bf54e",
    red: "#e33d3d"
};

const rotationCount = 4;

class Tetromino {
    width = 0; height = 0;
    x = 0; y = 0;
    defaultShape = [];
    shape = [];
    shapeColor = "#000000";
    stoppedFalling = false;
    rotationKind = 0;

    constructor(w, h, strShape, color) {
        this.width = w; this.height = h;
        this.shapeColor = color;
        for (let i = 0; i < w * h; i++) {
            let ch = '-';
            if (i < strShape.length) ch = strShape[i];
            let isShape = ch === '#';
            this.defaultShape.push(isShape);
        }
    }

    HasCoord(x, y) {
        let localPos = {x: x - this.x, y: y - this.y};
        let hasPos = localPos.x >= 0 && localPos.y >= 0 && localPos.x < this.width && localPos.y < this.height;
        if (!hasPos) return false;

        let localIndex = localPos.y * this.width + localPos.x;
        let shapeLength = this.shape.length;
        if (localIndex >= shapeLength) return false;
        let isTileInShape = this.shape[localIndex];
        return isTileInShape;
    }

    CanFall() {
        for (let i = this.width * this.height - 1; i >= 0; i--) {
            let actualPos = this.GetGlobalPos(i);
            if (!this.HasCoord(actualPos.x, actualPos.y)) continue;

            let isFloor = actualPos.y > boardSize.y;
            if (isFloor) return false;
            
            let posAsStr = `(${actualPos.x}, ${actualPos.y})`;
            let isPiece = posAsStr in gameBoard;
            if (isPiece) return false;
        }
        return true;
    }

    GetLocalPos(index) {
        let localPos = {x: index % this.width, y: Math.floor(index / this.width)};
        return localPos;
    }

    GetGlobalPos(index) {
        let localPos = this.GetLocalPos(index);
        let actualPos = {x: this.x + localPos.x, y: this.y + localPos.y};
        return actualPos;
    }

    Rotate() {
        for (let i = 0; i < rotationCount; i++) {
            this.rotationKind = (this.rotationKind + 1) % rotationCount;
            this.shape = this.#GetRotatedShape();
            let isValid = this.#IsShapeValid();
            if (isValid) break;
        }
    }

    Reset() {
        this.y = 0;
        this.stoppedFalling = false;
        this.shape = Array.from(this.defaultShape);
        this.rotationKind = 0;
    }

    GetFallStopY() {
        let currentY = this.y;
        for (; this.CanFall(); this.y++) {}
        let fallStopY = this.y;
        this.y = fallStopY;
        return fallStopY;
    }

    GetFallPrediction() {
        let currentY = this.y;
        this.y = this.GetFallStopY();
        let predictedPosList = []
        
        for (let i = 0; i < this.shape.length; i++) {
            let isShape = this.shape[i];
            if (!isShape) continue;

            let globalPos = this.GetGlobalPos(i);
            let predictedPos = {x: globalPos.x, y: globalPos.y - 1};
            predictedPosList.push(predictedPos);
        }

        this.y = currentY;
        return predictedPosList;
    }

    #GetRotatedShape() {
        let centerTile = {x: this.width / 2 - .5, y: this.height / 2 - .5};
        let rotatedShape = [];
        
        for (let i = 0; i < this.defaultShape.length; i++) {
            rotatedShape.push(false);
        }

        for (let i = 0; i < this.defaultShape.length; i++) {
            let inShape = this.defaultShape[i];
            if (!inShape) continue;

            let localPos = this.GetLocalPos(i);
            let centerDiff = {x: localPos.x - centerTile.x, y: localPos.y - centerTile.y};

            let transformedDiff = centerDiff;
            switch (this.rotationKind) {
                case 1: transformedDiff = {x: -centerDiff.y, y: centerDiff.x}; break;
                case 2: transformedDiff = {x: -centerDiff.x, y: -centerDiff.y}; break;
                case 3: transformedDiff = {x: centerDiff.y, y: -centerDiff.x}; break;
            }

            let transformedPos = {x: centerTile.x + transformedDiff.x, y: centerTile.y + transformedDiff.y};
            let transformedIndex = transformedPos.y * this.width + transformedPos.x;
            rotatedShape[transformedIndex] = true;
        }

        return rotatedShape;
    }

    #IsShapeValid() {
        for (let i = 0; i < this.shape.length; i++) {
            let inShape = this.shape[i];
            if (!inShape) continue;

            let globalPos = this.GetGlobalPos(i);
            let hitWall = globalPos.x <= 0 || globalPos.x > boardSize.x || globalPos.y > boardSize.y;
            let globalPosStr = GetStrFromPos(globalPos.x, globalPos.y);
            let hitStationary = globalPosStr in gameBoard;
            let tileInvalid = hitWall || hitStationary;
            if (tileInvalid) return false;
        }

        return true;
    }
}

const Tetrominos = {
    I: new Tetromino(4, 4, "----####", Color.cyan),
    O: new Tetromino(2, 2, "####", Color.yellow),
    T: new Tetromino(3, 3, "-#-###", Color.purple),
    J: new Tetromino(3, 3, "#--###", Color.blue),
    L: new Tetromino(3, 3, "--####", Color.orange),
    S: new Tetromino(3, 3, "-####-", Color.green),
    Z: new Tetromino(3, 3, "##--##", Color.red)
};

function RandomRange(min, max) {
    let randValue = Math.random();
    let resultingValue = min + (max - min) * randValue;
    let integerValue = Math.floor(resultingValue);
    return integerValue;
}

function GenerateTetromino() {
    const tetrominoNames = Object.keys(Tetrominos);
    let tetrominoCount = tetrominoNames.length;
    let tetrominoName = "";
    while (true) {
        let tetroIndex = RandomRange(0, tetrominoCount);
        tetrominoName = tetrominoNames[tetroIndex];
        if (tetrominoName !== previousShapeType) break;
    }
    
    previousShapeType = tetrominoName;
    let tetromino = Tetrominos[tetrominoName];
    tetromino.Reset();
    let maximumX = wallsBoardSize.x - tetromino.width;
    tetromino.x = RandomRange(1, maximumX);
    let rotateTimes = RandomRange(0, rotationCount);
    for (let i = 0; i < rotateTimes; i++) tetromino.Rotate();
   
    return tetromino;
}