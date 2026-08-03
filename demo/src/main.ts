import * as hp_prime from "hp_prime";

const UPS = 10;

const BLACK = hp_prime.COLOURS["#000000"];
const WHITE = hp_prime.COLOURS["#ffffff"];

const SCREEN_WIDTH_PX = 320;
const SCREEN_HEIGHT_PX = 240;

const MATRIX_WIDTH_MINOS = 10;
const MATRIX_HEIGHT_MINOS = 20;

const MINO_SIZE = hp_prime.MIN(
  (SCREEN_WIDTH_PX - 2) / MATRIX_WIDTH_MINOS,
  (SCREEN_HEIGHT_PX - 2) / MATRIX_HEIGHT_MINOS
);

const MATRIX_WIDTH_PX = MATRIX_WIDTH_MINOS * MINO_SIZE;
const MATRIX_HEIGHT_PX = MATRIX_HEIGHT_MINOS * MINO_SIZE;

const MATRIX_TOP_LEFT = [
  (SCREEN_WIDTH_PX - MATRIX_WIDTH_PX) / 2,
  (SCREEN_HEIGHT_PX - MATRIX_HEIGHT_PX) / 2,
];

const TETROMINOS = [
  // I
  [[-1, 0], [0, 0], [1, 0], [2, 0], hp_prime.COLOURS["#00FFFF"]],
  // T
  [[-1, 0], [0, 0], [1, 0], [0, -1], hp_prime.COLOURS["#FF00FF"]],
  // O
  [[0, 0], [1, 0], [0, -1], [1, -1], hp_prime.COLOURS["#FFFF00"]],
  // S
  [[-1, 0], [0, 0], [0, -1], [1, -1], hp_prime.COLOURS["#00FF00"]],
  // Z
  [[-1, -1], [0, -1], [0, 0], [1, 0], hp_prime.COLOURS["#FF0000"]],
  // L
  [[-1, 0], [0, 0], [1, 0], [1, -1], hp_prime.COLOURS["#FF8800"]],
  // J
  [[-1, -1], [-1, 0], [0, 0], [1, 0], hp_prime.COLOURS["#0000FF"]],
];

const PIECE_SPAWN_LOCATION = [4, 1];
const MATRIX: boolean[] = [];

let activePieceType = 1;
let activePieceLocation = PIECE_SPAWN_LOCATION;
// [type (1 - 7 for PIECES index, 0 for clear), x, y]
let deltas: number[][] = [];
let numDeltas = 0;

function addDelta(pieceType: number, x: number, y: number) {
  deltas[numDeltas + 1] = [pieceType, x, y];
  numDeltas += 1;
}

function renderDeltas() {
  let i = 1;

  while (i <= numDeltas) {
    const delta = deltas[i];

    const pieceType = delta[1];
    const x = MATRIX_TOP_LEFT[1] + MINO_SIZE * delta[2];
    const y = MATRIX_TOP_LEFT[2] + MINO_SIZE * delta[3];

    let colour: hp_prime.Colour;

    if (pieceType == 0) {
      colour = BLACK;
    } else {
      colour = TETROMINOS[pieceType][5] as hp_prime.Colour;
    }

    hp_prime.RECT_P(
      hp_prime.G0,
      x,
      y,
      x + MINO_SIZE,
      y + MINO_SIZE,
      colour,
      colour
    );
    i += 1;
  }

  deltas = [];
  numDeltas = 0;
}

function renderMatrixBorder() {
  // top
  hp_prime.RECT_P(
    hp_prime.G0,
    MATRIX_TOP_LEFT[1] - 1,
    MATRIX_TOP_LEFT[2] - 1,
    MATRIX_TOP_LEFT[1] + MATRIX_WIDTH_PX,
    MATRIX_TOP_LEFT[2] - 1,
    WHITE,
    WHITE
  );
  // bottom
  hp_prime.RECT_P(
    hp_prime.G0,
    MATRIX_TOP_LEFT[1] - 1,
    MATRIX_TOP_LEFT[2] + MATRIX_HEIGHT_PX,
    MATRIX_TOP_LEFT[1] + MATRIX_WIDTH_PX,
    MATRIX_TOP_LEFT[2] + MATRIX_HEIGHT_PX,
    WHITE,
    WHITE
  );
  // left
  hp_prime.RECT_P(
    hp_prime.G0,
    MATRIX_TOP_LEFT[1] - 1,
    MATRIX_TOP_LEFT[2],
    MATRIX_TOP_LEFT[1] - 1,
    MATRIX_TOP_LEFT[2] + MATRIX_HEIGHT_PX - 1,
    WHITE,
    WHITE
  );
  // right
  hp_prime.RECT_P(
    hp_prime.G0,
    MATRIX_TOP_LEFT[1] + MATRIX_WIDTH_PX,
    MATRIX_TOP_LEFT[2],
    MATRIX_TOP_LEFT[1] + MATRIX_WIDTH_PX,
    MATRIX_TOP_LEFT[2] + MATRIX_HEIGHT_PX - 1,
    WHITE,
    WHITE
  );
}

function spawnRandomPiece() {
  spawnPiece(hp_prime.RANDINT(1, 7));
}

/**
 * @param { number } pieceType 1-7
 */
function spawnPiece(pieceType: number): void {
  const tetromino = TETROMINOS[pieceType];
  activePieceType = pieceType;
  activePieceLocation = PIECE_SPAWN_LOCATION;

  let i = 1;
  while (i <= 4) {
    addDelta(
      pieceType,
      activePieceLocation[1] + (tetromino[i] as number[])[1],
      activePieceLocation[2] + (tetromino[i] as number[])[2]
    );

    i += 1;
  }
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < MATRIX_WIDTH_MINOS && y >= 0 && y < MATRIX_HEIGHT_MINOS;
}

function movePiece(x: number, y: number): void {
  const tetromino = TETROMINOS[activePieceType];

  let i = 1;
  while (i <= 4) {
    const newX = x + (tetromino[i] as number[])[1];
    const newY = y + (tetromino[i] as number[])[2];
    const oldX = activePieceLocation[1] + (tetromino[i] as number[])[1];
    const oldY = activePieceLocation[2] + (tetromino[i] as number[])[2];

    addDelta(0, oldX, oldY);

    if (!inBounds(newX, newY) || isMatrixLocationOccupied(newX, newY)) {
      numDeltas -= i;

      if (newY > oldY) {
        lockAndSpawnNewPiece();
      }

      return;
    }

    i += 1;
  }

  activePieceLocation[1] = x;
  activePieceLocation[2] = y;

  i = 1;
  while (i <= 4) {
    addDelta(
      activePieceType,
      x + (tetromino[i] as number[])[1],
      y + (tetromino[i] as number[])[2]
    );

    i += 1;
  }
}

function shiftPiece(dx: number, dy: number): void {
  movePiece(activePieceLocation[1] + dx, activePieceLocation[2] + dy);
}

function lockAndSpawnNewPiece(): void {
  const tetromino = TETROMINOS[activePieceType];

  let i = 1;
  while (i <= 4) {
    const x = activePieceLocation[1] + (tetromino[i] as number[])[1];
    const y = activePieceLocation[2] + (tetromino[i] as number[])[2];

    setMinoInMatrix(true, x, y);

    i += 1;
  }

  spawnRandomPiece();
}

function setMinoInMatrix(occupied: boolean, x: number, y: number): void {
  MATRIX[y * MATRIX_WIDTH_MINOS + x + 1] = occupied;
}

function isMatrixLocationOccupied(x: number, y: number): boolean {
  if (!inBounds(x, y)) {
    return false;
  }

  return MATRIX[y * MATRIX_WIDTH_MINOS + x + 1];
}

function INIT() {
  let i = 1;

  while (i <= MATRIX_WIDTH_MINOS * MATRIX_HEIGHT_MINOS) {
    MATRIX[i] = false;

    i += 1;
  }

  spawnRandomPiece();
}

function ON_TICK() {
  if (hp_prime.ISKEYDOWN(hp_prime.KEYS.Left)) {
    shiftPiece(-1, 0);
  }

  if (hp_prime.ISKEYDOWN(hp_prime.KEYS.Right)) {
    shiftPiece(1, 0);
  }

  if (hp_prime.ISKEYDOWN(hp_prime.KEYS.Down)) {
    shiftPiece(0, 1);
  }

  renderDeltas();
  renderMatrixBorder();
}
