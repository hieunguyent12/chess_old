import { useEffect, useState } from "react";

import Chess from "../chess";
import Square from "./Square";
import { isSquareBlack } from "../utils";
import PieceType from "../chess/piece";
import SquareType from "../chess/square";
import { SquarePosition } from "../chess/types";
import { Player } from "../chess";

interface Props {
  orientation: Player;
}

export default function Board({ orientation }: Props) {
  const [chess, setChess] = useState<Chess | null>(null);
  const [board, setBoard] = useState<SquareType[][] | null>(null);
  const [FEN, setFEN] = useState("");
  const [_, rerender] = useState({});

  useEffect(() => {
    const chess = new Chess(FEN);

    const unsubscribe = chess.subscribeToUpdates((_board) => {
      if (orientation === "w") {
        setBoard(_board);
      } else {
        const newBoard = [..._board].reverse();

        for (let i = 0; i < newBoard.length; i++) {
          newBoard[i] = [...newBoard[i]].reverse();
        }

        setBoard(newBoard);
      }
    });

    setChess(chess);

    if (orientation === "w") {
      setBoard(chess.board);
    } else {
      const newBoard = [...chess.board].reverse();

      for (let i = 0; i < newBoard.length; i++) {
        newBoard[i] = [...newBoard[i]].reverse();
      }

      setBoard(newBoard);
    }

    return () => {
      unsubscribe();
    };
  }, [_, orientation]);

  const loadFen = () => {
    rerender({});
  };

  const movePiece = (
    item: PieceType,
    fromSquare: SquarePosition,
    toSquare: SquarePosition
  ) => {
    if (!chess) {
      console.log("Chess board is not setup");
    } else {
      chess.movePiece(item, fromSquare, toSquare);
    }
  };

  if (chess && board) {
    return (
      <>
        <div
          className="boardContainer"
          style={{
            width: `${50 * 8}px`,
            height: `${50 * 8}px`,
          }}
        >
          {board.map((row, rankIndex) => {
            return row.map((square, fileIndex) => {
              const color = isSquareBlack(rankIndex, fileIndex)
                ? "#B58862"
                : "#F0D9B5";

              return (
                <Square
                  square={square}
                  key={square.coordinate}
                  color={color}
                  movePiece={movePiece}
                  chess={chess}
                  orientation={orientation}
                />
              );
            });
          })}
        </div>
        <input
          type="text"
          value={FEN}
          onChange={(e) => setFEN(e.target.value)}
        />
        <button onClick={loadFen}>Load FEN</button>
        <button onClick={() => console.log(board, chess.kings)}>
          Load Board
        </button>
      </>
    );
  } else {
    return <p>Loading...</p>;
  }
}
