import Square from "./square";

export interface SquarePosition {
  x: number;
  y: number;
}

export type Board = Square[][];
