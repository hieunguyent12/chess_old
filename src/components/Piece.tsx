import { useDrag } from "react-dnd";

import Square from "../chess/square";
import pieces, { PiecesType } from "../chess/pieces";
import { ITEM_TYPES } from "../constants";
import Chess, { Player } from "../chess";

interface Props {
  square: Square;
  chess: Chess;
  orientation: Player;
}

export default function Piece({ square, chess, orientation }: Props) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: ITEM_TYPES.PIECE,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      // NOTE: "item" must be a function for it to work properly. If we just use an object here, then it will result in a closure bug when moving pieces
      item: () => {
        const currentTurn = chess.getCurrentPlayerTurn();

        if (square.piece) {
          if (square.piece.color === currentTurn) {
            return {
              piece: square.piece,
              position: square.position,
              legalMoves: chess.calculateLegalMoves({ ...square.position }),
            };
          } else {
            return null;
          }
        }
      },
    }),
    [square, chess]
  );

  if (square.piece) {
    return (
      <div
        style={{
          fontSize: "20px",
          opacity: isDragging ? 0.5 : 1,
        }}
        ref={dragRef}
      >
        {pieces[square.piece.type].component}
      </div>
    );
  } else {
    return null;
  }
}
