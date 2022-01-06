import { useDrop } from "react-dnd";

import SquareType from "../chess/square";
import Piece from "./Piece";
import PieceType from "../chess/piece";
import { ITEM_TYPES } from "../constants";
import { SquarePosition } from "../chess/types";
import Chess, { Player } from "../chess";
import Overlay from "./MoveOverlay";

interface Props {
  square: SquareType;
  color: string;
  chess: Chess;
  orientation: Player;
  movePiece: (
    item: PieceType,
    fromSquare: SquarePosition,
    toSquare: SquarePosition
  ) => void;
}

interface Item {
  piece: PieceType;
  position: SquarePosition;
  legalMoves: SquarePosition[];
}

export default function Square({
  square,
  color,
  movePiece,
  chess,
  orientation,
}: Props) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: ITEM_TYPES.PIECE,
      drop: (item: Item) => {
        movePiece(item.piece, item.position, square.position);
      },
      canDrop: (item) => {
        for (let i = 0; i < item.legalMoves.length; i++) {
          const currentMove = item.legalMoves[i];

          if (
            currentMove.x === square.position.x &&
            currentMove.y === square.position.y
          ) {
            return true;
          }
        }

        return false;
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [square, chess]
  );

  return (
    <div
      className="square"
      style={{
        backgroundColor: isOver ? "yellow" : color,
      }}
      onClick={() => console.log(square)}
      ref={dropRef}
    >
      {!square.isEmpty ? (
        <Piece square={square} chess={chess} orientation={orientation} />
      ) : null}
      {!isOver && canDrop && <Overlay color="yellow" />}
      {isOver && canDrop && <Overlay color="green" />}
    </div>
  );
}
