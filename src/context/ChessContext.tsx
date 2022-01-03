import { createContext, useState, useContext } from "react";

import Chess from "../chess";
import SquareType from "../chess/square";

interface Props {
  children: JSX.Element;
}

const ChessContext = createContext<{
  chess: Chess | null;
  board: SquareType[][] | null;
} | null>(null);

export function ChessProvider({ children }: Props) {
  const [chess, setChess] = useState<Chess | null>(null);
  const [board, setBoard] = useState<SquareType[][] | null>(null);

  const value = {
    chess,
    board,
  };
  return (
    <ChessContext.Provider value={value}>{children}</ChessContext.Provider>
  );
}

export function useChess() {
  const context = useContext(ChessContext);
  if (context === undefined) {
    throw new Error("useChess must be used within a ChessProvider");
  }
  return context;
}
