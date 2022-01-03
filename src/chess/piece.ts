import { PiecesType } from "./pieces";
import { Player } from ".";

export default class Piece {
  public color: Player;
  public type: PiecesType;
  public hasMoved: boolean;
  public isPinned: boolean;

  constructor(color: Player, type: PiecesType) {
    this.color = color;
    this.type = type;
    this.hasMoved = false;
    this.isPinned = false;
  }
}
