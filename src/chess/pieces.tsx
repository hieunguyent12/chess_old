interface Props {
  children: JSX.Element;
}

function BlackPiece({ children }: Props) {
  return <span style={{ color: "black" }}>{children}</span>;
}
function WhitePiece({ children }: Props) {
  return <span style={{ color: "white" }}>{children}</span>;
}

const pieces = {
  r: {
    component: (
      <BlackPiece>
        <i className="fas fa-chess-rook" />
      </BlackPiece>
    ),
    type: "rook",
  },
  n: {
    component: (
      <BlackPiece>
        <i className="fas fa-chess-knight" />
      </BlackPiece>
    ),
    type: "knight",
  },
  b: {
    component: (
      <BlackPiece>
        <i className="fas fa-chess-bishop" />
      </BlackPiece>
    ),
    type: "bishop",
  },
  q: {
    component: (
      <BlackPiece>
        <i className="fas fa-chess-queen" />
      </BlackPiece>
    ),
    type: "queen",
  },
  k: {
    component: (
      <BlackPiece>
        <i className="fas fa-chess-king" />
      </BlackPiece>
    ),
    type: "king",
  },
  p: {
    component: (
      <BlackPiece>
        <i className="fas fa-chess-pawn" />
      </BlackPiece>
    ),
    type: "pawn",
  },
  R: {
    component: (
      <WhitePiece>
        <i className="fas fa-chess-rook" />
      </WhitePiece>
    ),
    type: "rook",
  },
  N: {
    component: (
      <WhitePiece>
        <i className="fas fa-chess-knight" />
      </WhitePiece>
    ),
    type: "knight",
  },
  B: {
    component: (
      <WhitePiece>
        <i className="fas fa-chess-bishop" />
      </WhitePiece>
    ),
    type: "bishop",
  },
  Q: {
    component: (
      <WhitePiece>
        <i className="fas fa-chess-queen" />
      </WhitePiece>
    ),
    type: "queen",
  },
  K: {
    component: (
      <WhitePiece>
        <i className="fas fa-chess-king" />
      </WhitePiece>
    ),
    type: "king",
  },
  P: {
    component: (
      <WhitePiece>
        <i className="fas fa-chess-pawn" />
      </WhitePiece>
    ),
    type: "pawn",
  },
};

export type PiecesType = keyof typeof pieces;

export default pieces;
