function DrawUpcomingPreview() {
    shapePreviewTilesDrawn = 0;
    for (let y = 0; y < upcomingPreviewSize.y; y++) {
        for (let x = 0; x < upcomingPreviewSize.x; x++) {
            DrawPreviewTile(x, y);
        }
    }
}

let shapePreviewTilesDrawn = 0;

function DrawPreviewTile(x, y) {
    let isWall = x === 0 || y === 0 || x + 1 === upcomingPreviewSize.x || y + 1 === upcomingPreviewSize.y;
    let tileColor = Color.air;
    if (isWall) tileColor = Color.wall;

    if (upcomingPiece != null) {
        let outsideBounds = x < 1 || y < 1 || x > upcomingPiece.width;
        let inShape = !outsideBounds && upcomingPiece.defaultShape[shapePreviewTilesDrawn];
        if (inShape) tileColor = upcomingPiece.shapeColor;
        if (!isWall && !outsideBounds) shapePreviewTilesDrawn++;
    }

    DrawSquare(wallsBoardSize.x + x + 1, y, tileColor)
}