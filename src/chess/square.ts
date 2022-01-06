import Piece from "./piece";
import { SquarePosition } from "./types";

export default class Square {
  public position: SquarePosition;
  public coordinate: string;
  public isEmpty: boolean = true;
  public piece: Piece | undefined;
  public numbOfSquaresToEdge: number[];
  public makeEmpty: () => void;
  public movePieceHere: (piece: Piece) => void;

  constructor(
    position: SquarePosition,
    numbOfSquaresToEdge: number[],
    piece?: Piece | undefined
  ) {
    this.position = position;

    this.coordinate = `${String.fromCharCode(97 + position.x)}${
      8 - position.y
    }`;

    this.numbOfSquaresToEdge = numbOfSquaresToEdge;

    if (piece) {
      this.isEmpty = false;
      this.piece = piece;
    }

    /* eslint-disable */
    this.makeEmpty = this._makeEmpty;
    this.movePieceHere = this._movePieceHere;
  }

  public _makeEmpty() {
    this.piece = undefined;
    this.isEmpty = true;
  }

  public _movePieceHere(piece: Piece) {
    this.piece = piece;
    this.isEmpty = false;
  }
}
