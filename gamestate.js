const boardSize = {"x": 10, "y": 20};
const wallsBoardSize = {"x": boardSize.x + 2, "y": boardSize.y + 2};
const upcomingPreviewSize = {x: 6, y: 6}
const boardWithPreview = {x: wallsBoardSize.x + upcomingPreviewSize.x * 2 + 2, y: wallsBoardSize.y}

let defaultTickSpeed = 200;
const softDropSpeedMultiplier = 0.2;
let tickSpeed = 200;

const gameStartTime = Date.now();

let gameBoard = {};

let fallingPiece = null;
let upcomingPiece = null;

let movementXDir = 0;
let isSoftDropping = false;
let gameActive = false;
let isPaused = false;
let isGameOver = false;
let pointsCount = 0;
let willHardDrop = false;
let hardDropTimes = []
let previousShapeType = "";

function IsWall(x, y) {
    return x === 0 || y === 0 || x > boardSize.x || y > boardSize.y;
}

function IsHolding(keyCode) {
    return keyCode in keyStates && keyStates[keyCode];
}

function IsHoldingEnter() {
    return IsHolding("Enter") || IsHolding("NumpadEnter");
}

let moveAttemptCount = 0;
const invalidAttemptStop = 4;
let previouslyAttemptedHardDrop = false;
let previousAttemptedRotate = false;

function UpdateInput() {
    isSoftDropping = false;
    movementXDir = 0;
    if (IsHolding("ArrowLeft") || IsHolding("KeyA"))
        movementXDir = Math.max(-1, movementXDir - 1);
    if (IsHolding("ArrowRight") || IsHolding("KeyD"))
        movementXDir = Math.min(1, movementXDir + 1);
    if (movementXDir != 0) AttemptMovingPiece(movementXDir);
    else moveAttemptCount = 0;

    if (IsHolding("ArrowDown") || IsHolding("KeyS")) isSoftDropping = true;
    let holdingEnter = IsHoldingEnter();
    let holdingToRotate = IsHolding("KeyR");
    if (holdingEnter && !previouslyAttemptedHardDrop) { willHardDrop = true; DrawBoard(); }
    if (holdingToRotate && fallingPiece != null && !previousAttemptedRotate) { fallingPiece.Rotate(); DrawBoard(true); }

    let usedMultiplier = isSoftDropping ? softDropSpeedMultiplier : 1;
    tickSpeed = defaultTickSpeed * usedMultiplier;
    previouslyAttemptedHardDrop = holdingEnter;
    previousAttemptedRotate = holdingToRotate;
}

function AttemptMovingPiece(movementXDir) {
    if (fallingPiece == null) return;
    let canMove = CanMovePiece();
    moveAttemptCount++;
    let isAttemptCountValid = moveAttemptCount == 1 || moveAttemptCount > invalidAttemptStop;
    if (canMove && isAttemptCountValid) fallingPiece.x += movementXDir;
    DrawBoard(true);
}

function OnUpdate() {
    if (!gameActive || isPaused || isGameOver) return;
    if (fallingPiece === null) {
        fallingPiece = GenerateTetromino();
        upcomingPiece = GenerateTetromino();
        return;
    }

    if (!willHardDrop && isSoftDropping) AwardForSoftDrop();
    if (willHardDrop) MakeHardDrop();
    else fallingPiece.y++;

    let canFall = fallingPiece.CanFall();
    movementXDir = 0;
    willHardDrop = false;

    if (canFall) return;
    fallingPiece.stoppedFalling = true;
    fallingPiece.y--;
    HandleRowClear();
    HandleGameOver();
}

function AwardForSoftDrop() {
    pointsCount++;
    UpdateHeaderText();
}

const hardDropInterval = 4000;
const maximumAwardedHardDrops = 5;

function MakeHardDrop() {
    let previousY = fallingPiece.y;
    fallingPiece.y = fallingPiece.GetFallStopY();
    let cellsFallen = fallingPiece.y - previousY;

    let timeSinceStart = Date.now() - gameStartTime;
    let hardDropsInInterval = 0;
    for (let i = hardDropTimes.length - 1; i >= 0; i--) {
        let droppedTime = hardDropTimes[i];
        if (timeSinceStart - droppedTime < hardDropInterval) hardDropsInInterval++;
    }
    let pointsMultiplier = 1 - Math.min(hardDropsInInterval / maximumAwardedHardDrops, 1);

    let pointsGained = Math.floor(cellsFallen * pointsMultiplier * 2);
    pointsCount += pointsGained;
    
    hardDropTimes.push(timeSinceStart);
    UpdateHeaderText();
}

function CanMovePiece() {
    for (let i = 0; i < fallingPiece.shape.length; i++) {
        let globalPos = fallingPiece.GetGlobalPos(i);
        let inShape = fallingPiece.HasCoord(globalPos.x, globalPos.y);
        if (!inShape) continue;

        let updatedPos = {x: globalPos.x + movementXDir, y: globalPos.y};
        let hitWall = updatedPos.x < 1 || updatedPos.x > boardSize.x;
        if (hitWall) return false;

        let posAsStr = `(${updatedPos.x}, ${updatedPos.y})`;
        let hitPiece = posAsStr in gameBoard;
        if (hitPiece) return false;
    }

    return true;
}

function HandleFall() {
    if (fallingPiece == null || !fallingPiece.stoppedFalling) return;

    for (let i = 0; i < fallingPiece.shape.length; i++) {
        let isShape = fallingPiece.shape[i];
        let tilePosition = {x: i % fallingPiece.width, y: Math.floor(i / fallingPiece.width)};
        let actualPos = {x: tilePosition.x + fallingPiece.x, y: tilePosition.y + fallingPiece.y};
        let tileInShape = fallingPiece.HasCoord(actualPos.x, actualPos.y);
        if (!tileInShape) continue;

        let posAsStr = `(${actualPos.x}, ${actualPos.y})`;
        gameBoard[posAsStr] = fallingPiece.shapeColor;
    }

    if (isGameOver) return;
    HandleRowClear();

    fallingPiece = upcomingPiece;
    upcomingPiece = GenerateTetromino();
    fallingPiece.stoppedFalling = false;
    DrawBoard(true);
}

function HandleGameOver() {
    let stoppedBeforeShowing = fallingPiece.y <= 0;
    if (!stoppedBeforeShowing) return;
    isGameOver = true;
    headerLabel.textContent = "Game Over! (Score: " + String(pointsCount) + ")";
    pauseGameButton.classList.add("hidden");
}

const maximumRowClears = 4;
const pointsRewardsPerClear = {
    1: 100,
    2: 300,
    3: 500,
    4: 800
};

function HandleRowClear() {
    let rowsCleared = 0;
    for (let rowNumber = fallingPiece.y + fallingPiece.width; rowNumber >= fallingPiece.y; rowNumber--) {
        while (true) {
            let clearedRow = true;
            for (let x = 1; x <= boardSize.x; x++) {
                let strPos = GetStrFromPos(x, rowNumber);
                let isStationaryPiece = strPos in gameBoard;
                if (!isStationaryPiece) { clearedRow = false; break; }
            }
            if (!clearedRow) break;
            ClearRow(rowNumber);
            rowsCleared++;
        }
    }

    if (rowsCleared == 0) return;
    let actualRowsCleared = rowsCleared > maximumRowClears ? maximumRowClears : rowsCleared;
    let pointsGained = pointsRewardsPerClear[actualRowsCleared]
    pointsCount += pointsGained;
    UpdateHeaderText();
}

function GetVectorFromStr(posAsStr) {
    let posArray = posAsStr.replace("(", "").replace(")", "").replace(" ", "").split(",");
    return {x: +posArray[0], y: +posArray[1]};
}

function GetStrFromPos(x, y) {
    return `(${x}, ${y})`;
}

function ClearRow(rowNumber) {
    for (let x = 0; x <= boardSize.x; x++) {
        let posAsStr = GetStrFromPos(x, rowNumber);
        delete gameBoard[posAsStr];
    }

    for (let y = rowNumber - 1; y > 0; y--) {
        for (let x = 1; x <= boardSize.x; x++) {
            let posAsStr = GetStrFromPos(x, y);
            let hasTile = posAsStr in gameBoard;
            if (!hasTile) continue;

            let tileColor = gameBoard[posAsStr];
            delete gameBoard[posAsStr];
            let updatedPosStr = GetStrFromPos(x, y + 1);
            gameBoard[updatedPosStr] = tileColor;
        }
    }
}
