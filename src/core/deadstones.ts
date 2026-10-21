import { BOARD_SIZE, type Board } from "./board";

export type Vertex = readonly [x: number, y: number];
export type DeadStoneGuesser = (board: number[][], options: { finished: boolean; iterations: number }) => Promise<readonly Vertex[]>;
export type DeadStoneEstimate = {
  dead: readonly boolean[];
  vertices: readonly Vertex[];
  status: "estimated";
};

/** Converts go9's 0/1/2 row-major board to Sabaki's 0/1/-1 row arrays. */
export function toSabakiBoard(board: Board): number[][] {
  if (board.length !== BOARD_SIZE * BOARD_SIZE) throw new RangeError("Expected 9x9 board");
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => {
      const stone = board[y * BOARD_SIZE + x];
      if (stone !== 0 && stone !== 1 && stone !== 2) throw new RangeError("Invalid stone");
      return stone === 2 ? -1 : stone;
    }));
}

/** Converts Sabaki's [x,y] vertices to go9's row-major mask, validating every result. */
export function fromSabakiVertices(board: Board, vertices: readonly Vertex[]): DeadStoneEstimate {
  if (board.length !== BOARD_SIZE * BOARD_SIZE) throw new RangeError("Expected 9x9 board");
  const dead = Array<boolean>(BOARD_SIZE * BOARD_SIZE).fill(false);
  for (const vertex of vertices) {
    if (!Array.isArray(vertex) || vertex.length !== 2) throw new TypeError("Invalid vertex");
    const [x, y] = vertex;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE)
      throw new RangeError("Dead stone vertex out of bounds");
    const index = y * BOARD_SIZE + x;
    if (board[index] === 0) throw new RangeError("Estimator marked an empty vertex as dead");
    dead[index] = true;
  }
  return { dead, vertices, status: "estimated" };
}

/** Dependency injection keeps the scoring engine and UI independent of the WASM runtime. */
export async function estimateDeadStones(board: Board, guess: DeadStoneGuesser, iterations = 100): Promise<DeadStoneEstimate> {
  if (!Number.isInteger(iterations) || iterations <= 0) throw new RangeError("Invalid iteration count");
  const result = await guess(toSabakiBoard(board), { finished: true, iterations });
  return fromSabakiVertices(board, result);
}
