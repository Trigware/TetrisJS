const drawingCanvas = document.getElementById("game");
const drawingContext = drawingCanvas.getContext("2d");
const difficultySelector = document.getElementById("difficultySelector");

const tileSize = 32;
const outlineSize = 6;
const outlineMultiplier = 0.825;

const startGameButton = document.getElementById("startGameButton");
const pauseGameButton = document.getElementById("pauseGameButton");
const headerLabel = document.getElementById("header");

let keyStates = {};

UpdateDefaultTickSpeed();
GameLoop();

document.addEventListener("keydown", (event) => {keyStates[event.code] = true;});
document.addEventListener("keyup", (event) => {keyStates[event.code] = false;});
difficultySelector.addEventListener("change", UpdateDefaultTickSpeed);

function UpdateDefaultTickSpeed() {
    defaultTickSpeed = Number(difficultySelector.value);
}

function GameLoop() {
    DrawBoard();
    setTimeout(GameLoop, tickSpeed);
}

const inputUpdateRate = 35;

setInterval(UpdateInput, inputUpdateRate);

function DrawBoard(forceRedraw = false) {
    if (!forceRedraw) OnUpdate();
    drawingCanvas.width = boardWithPreview.x * tileSize;
    drawingCanvas.height = boardWithPreview.y * tileSize;

    for (let y = 0; y < wallsBoardSize.y; y++) {
        for (let x = 0; x < wallsBoardSize.x; x++) {
            let drawColor = GetDrawColor(x, y);
            DrawSquare(x, y, drawColor);
        }
    }

    let fallPredictions = [];
    if (fallingPiece != null) fallPredictions = fallingPiece.GetFallPrediction();
    for (let i = 0; i < fallPredictions.length; i++) {
        let fallPredictionPos = fallPredictions[i];
        DrawOutline(fallPredictionPos.x, fallPredictionPos.y, fallingPiece.shapeColor);
    }

    DrawUpcomingPreview();
    if (!forceRedraw) HandleFall();
}

function GetDrawColor(x, y) {
    let resultingColor = Color.air;

    let inFallingPiece = fallingPiece != null && fallingPiece.HasCoord(x, y);
    if (inFallingPiece) resultingColor = fallingPiece.shapeColor;

    let posAsStr = `(${x}, ${y})`;
    let hasStationaryPiece = posAsStr in gameBoard;
    if (hasStationaryPiece) resultingColor = gameBoard[posAsStr];
    
    let isWall = IsWall(x, y);
    if (isWall) resultingColor = Color.wall;

    return resultingColor;
}

function DrawSquare(x, y, color) {
    drawingContext.fillStyle = color;
    x += upcomingPreviewSize.x;
    drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    DrawStroke(x, y);
}

function DrawOutline(x, y, color) {
    let drawColor = color;
    x += upcomingPreviewSize.x;
    if (y <= 0) return;

    drawingContext.fillStyle = drawColor;
    drawingContext.fillRect(x * tileSize, y * tileSize, tileSize, outlineSize * outlineMultiplier);
    drawingContext.fillRect(x * tileSize, y * tileSize, outlineSize * outlineMultiplier, tileSize);
    drawingContext.fillRect(x * tileSize + tileSize - outlineSize, y * tileSize, outlineSize, tileSize);
    drawingContext.fillRect(x * tileSize, y * tileSize + tileSize - outlineSize, tileSize, outlineSize);

    DrawStroke(x, y);
}

function DrawStroke(x, y) {
    drawingContext.strokeStyle = "black";
    drawingContext.lineWidth = 2;
    drawingContext.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function ClickStartButton() {
    if (IsHoldingEnter()) return;

    if (!gameActive) { StartGame(); return; }
    
    gameActive = false;
    UpdateHeaderText();
    pauseGameButton.classList.add("hidden");
    startGameButton.textContent = "Start Game";
    difficultySelector.classList.remove("hidden");
    ResetState();
    DrawBoard(true);
}

function ResetState() {
    gameBoard = {};
    fallingPiece = null;
    upcomingPiece = null;
    isPaused = false;
    pointsCount = 0;
    isGameOver = false;
    keyStates = {};
    hardDropTimes = [];
    willHardDrop = false;
    previousShapeType = "";
}

function StartGame() {
    gameActive = true;
    startGameButton.textContent = "Quit Game";
    ResetState();
    
    pauseGameButton.classList.remove("hidden");
    difficultySelector.classList.add("hidden");

    UpdatePauseText();
    UpdateHeaderText();
    DrawBoard(true);
}

function ClickPauseButton() {
    if (IsHoldingEnter()) return;
    isPaused = !isPaused;
    UpdatePauseText();
}

function UpdatePauseText() {
    pauseGameButton.textContent = isPaused ? "Continue" : "Pause Game";
    UpdateHeaderText();
}

function UpdateHeaderText() {
    headerLabel.textContent = isPaused ? "Game Paused" : "Score: " + String(pointsCount);
    if (!gameActive) headerLabel.textContent = "Tetris";
}