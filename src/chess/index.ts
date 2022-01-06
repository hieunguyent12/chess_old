import { isNumeric } from "../utils";
import MoveManager from "./moveManager";
import Piece from "./piece";
import { PiecesType } from "./pieces";
import Square from "./square";
import { Board, SquarePosition } from "./types";

export type Player = "w" | "b";
type SubscriberCallback<T> = (arg: T) => void;
export type King = {
  position: SquarePosition;
  isChecked: boolean;
} | null;
type Kings = Record<Player, King>;
export type CastleRights = {
  w: {
    short: boolean;
    long: boolean;
  };
  b: {
    short: boolean;
    long: boolean;
  };
};

export const DIRECTIONS = [
  [0, -1], // north
  [0, 1], // south
  [1, 0], // east
  [-1, 0], // west
  // Diagonals
  [1, -1], // northeast
  [-1, -1], // northwest
  [1, 1], // southeast
  [-1, 1], // southwest
];

class Chess {
  /*
    The chess board is represented by a two dimensional array

    White's persective
    [
      [],
      [],
      [],
      [],
      [],
      [],
      [a2, b2, c2, ...],
      [a1, b1, c1, ...]
    ]
  */
  public board: Board;

  /*
    These are the directions that a chess piece can move
    For example, a rook can move north, east, south, and west; pawn can move north
    A bishop can move northeast, northwest, southeast and southwest
  */
  private directions = DIRECTIONS;

  private moveManager: MoveManager;

  private playerTurn: Player = "w";
  // the friendly pieces are the ones that belongs to the current player who is making a move
  private friendlyColor = this.playerTurn;

  private castlingRights: CastleRights = {
    w: {
      short: true,
      long: true,
    },
    b: {
      short: true,
      long: true,
    },
  };

  // keep track of black and white's kings position on the board
  public kings: Kings = {
    b: null,
    w: null,
  };

  private enPassantSquares: (SquarePosition & { color: Player })[] = [];

  // A FEN string representing the starting position (viewed from white's perspective)
  // lowercase = black   uppercase = white
  // the number denotes the number of empty squares in a particular rank
  private startingPosition = "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR";

  private totalMovesCount = 1;
  // a ply = one move for EACH player
  private numberOfPliesUntilDraw = 0;

  private subscribers: SubscriberCallback<typeof this.board>[] = [];

  constructor(FEN?: string) {
    this.board = FEN ? this.init(FEN) : this.init();
    this.moveManager = new MoveManager(this.board, this.castlingRights);
  }

  private init(FEN?: string) {
    let board = [];
    this.notifyPlayerMove();

    const FEN_fields = FEN ? FEN.split(" ") : this.startingPosition.split(" ");
    const ranks = FEN_fields[0].split("/");

    if (FEN && FEN !== this.startingPosition) {
      if (FEN_fields[1]) {
        console.log(
          `${FEN_fields[1] === "b" ? "Black" : "White"}'s turn to move`
        );

        this.playerTurn = FEN_fields[1] as Player;
        this.friendlyColor = this.playerTurn;
      }

      const castleRights = FEN_fields[2];

      if (castleRights) {
        // this.castlingRights.
        // this.whiteCastlingRights.kingSide =
        //   castleRights.indexOf("K") !== -1 && castleRights !== "-";
        // this.whiteCastlingRights.queenSide =
        //   castleRights.indexOf("Q") !== -1 && castleRights !== "-";
        // this.blackCastlingRights.kingSide =
        //   castleRights.indexOf("k") !== -1 && castleRights !== "-";
        // this.blackCastlingRights.queenSide =
        //   castleRights.indexOf("q") !== -1 && castleRights !== "-";

        if (castleRights.indexOf("K") !== -1) {
          console.log("white can kingside castle");
        }
        if (castleRights.indexOf("Q") !== -1) {
          console.log("white can queenside castle");
        }

        if (castleRights.indexOf("k") !== -1) {
          console.log("black can kingside castle");
        }

        if (castleRights.indexOf("q") !== -1) {
          console.log("black can queenside castle");
        }

        if (castleRights === "-") {
          console.log("neither side can castle");
        }
      }

      if (FEN_fields[3]) {
        const enPassantSquare = FEN_fields[3];

        console.log(`en passant square: ${enPassantSquare}`);
      }

      if (FEN_fields[4]) {
        this.numberOfPliesUntilDraw = 100 - parseInt(FEN_fields[4]);
        console.log(`${100 - parseInt(FEN_fields[4])} moves until game draw`);
      }

      if (FEN_fields[5]) {
        this.totalMovesCount = parseInt(FEN_fields[5]);
        console.log(`total number of moves: ${FEN_fields[5]}`);
      }
    }

    for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
      const rank = ranks[rankIndex];
      board[rankIndex] = [] as Square[];

      let fileIndex = 0;

      // loop through each item in the string
      for (let i = 0; i < rank.length; i++) {
        const current: PiecesType | string = rank[i];

        let north = rankIndex;
        let west = fileIndex;
        let south = 8 - rankIndex - 1;
        let east = 8 - fileIndex - 1;
        let northwest = Math.min(north, west);
        let southeast = Math.min(south, east);
        let northeast = Math.min(north, east);
        let southwest = Math.min(south, west);

        // [0, -1], // north
        // [0, 1], // south
        // [1, 0], // east
        // [-1, 0], // west
        // // Diagonals
        // [1, -1], // northeast
        // [-1, -1], // northwest
        // [1, 1], // southeast
        // [-1, 1], // southwest

        // make sure these elements in the array corresponds to that of the directions array
        // they must have the same position
        let numbOfSquaresToEdge: number[] = [
          north,
          south,
          east,
          west,
          // Diagonals
          northeast,
          northwest,
          southeast,
          southwest,
        ];

        // If this is a letter, that means there is a piece at that index
        if (!isNumeric(current)) {
          const position = {
            x: fileIndex,
            y: rankIndex,
          };

          fileIndex++;

          // uppercase letter = white pieces
          const isWhite = current === current.toUpperCase();
          const color = isWhite ? "w" : "b";
          const piece = new Piece(color, current as PiecesType);

          if (piece.type === "k" || piece.type === "K") {
            this.kings[piece.color] = {
              isChecked: false,
              position,
            };
          }

          board[rankIndex].push(
            new Square(position, numbOfSquaresToEdge, piece)
          );
        } else {
          // Empty squares
          const temp = [];

          for (let n = 0; n < parseInt(current); n++) {
            const position = {
              x: fileIndex,
              y: rankIndex,
            };

            let north = rankIndex;
            let west = fileIndex;
            let south = 8 - rankIndex - 1;
            let east = 8 - fileIndex - 1;
            let northwest = Math.min(north, west);
            let southeast = Math.min(south, east);
            let northeast = Math.min(north, east);
            let southwest = Math.min(south, west);

            let numbOfSquaresToEdge: number[] = [
              north,
              south,
              east,
              west,
              // Diagonals
              northeast,
              northwest,
              southeast,
              southwest,
            ];

            fileIndex++;
            temp.push(new Square(position, numbOfSquaresToEdge));
          }

          board[rankIndex] = [...board[rankIndex], ...temp];
        }
      }
    }

    return board;
  }

  private updatePlayerTurn() {
    if (this.playerTurn === "w") {
      this.playerTurn = "b";
      this.friendlyColor = "b";
    } else {
      this.playerTurn = "w";
      this.friendlyColor = "w";
    }
  }

  private emitUpdate() {
    this.subscribers.forEach((cb) => cb(this.board));
  }

  public subscribeToUpdates(cb: SubscriberCallback<typeof this.board>) {
    this.subscribers.push(cb);

    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  public movePiece(
    piece: Piece,
    fromSquare: SquarePosition,
    toSquare: SquarePosition
  ) {
    // probably cache this because we're calling it twice from Square.tsx and here
    // when calculating legal moves, also take in to consideration whether or not the king is in check
    const legalMoves = this.calculateLegalMoves({ ...fromSquare });

    let isLegalMove = false;

    let chosenMove!: SquarePosition & {
      isCastling?: boolean | undefined;
    };

    for (const move of legalMoves) {
      if (move.x === toSquare.x && move.y === toSquare.y) {
        isLegalMove = true;
        chosenMove = move;
        break;
      }
    }

    if (!isLegalMove) {
      return;
    }

    // do nothing if we are moving to the same square where we started
    if (fromSquare.x === toSquare.x && fromSquare.y === toSquare.y) {
      return;
    }

    const newBoard = [...this.board];

    const from = newBoard[fromSquare.y][fromSquare.x];
    const to = newBoard[toSquare.y][toSquare.x];

    // Check whether or not this piece belongs to the current player
    if (from.piece?.color !== this.playerTurn) {
      return;
    }

    let capturedPiece: Piece | undefined;

    // capture the opponent pieces
    if (!to.isEmpty && to.piece && to.piece.color !== this.friendlyColor) {
      capturedPiece = to.piece;
    }

    to.movePieceHere(piece);
    from.makeEmpty();

    const myKing = this.kings[this.playerTurn];
    let oldPosition;
    if (myKing) {
      oldPosition = myKing?.position;
    }
    if (piece.type.toLowerCase() === "k") {
      // @ts-ignore
      this.kings[this.playerTurn] = {
        ...myKing,
        position: to.position,
      };
    }

    // IF THE KING IS IN CHECK AFTER MAKING A MOVE, THAT MOVE IS ILLEGAL
    this.calculateChecks(newBoard);

    // console.log(newBoard);
    // If the move results in a check of our own king, then it is illegal
    if (this.kings[this.playerTurn]?.isChecked) {
      // console.log(this.kings);
      // Undo everything here
      // TODO implement some sort of history to keep track of these moves so we can undo it easily
      from.movePieceHere(piece);

      if (capturedPiece) {
        to.movePieceHere(capturedPiece);
      } else {
        to.makeEmpty();
      }

      if (piece.type.toLowerCase() === "k" && oldPosition) {
        // @ts-ignore
        this.kings[this.playerTurn] = {
          ...myKing,
          position: oldPosition,
        };
      }
      // @ts-ignore
      // this.kings[this.playerTurn].isChecked = false;
    } else {
      if (piece.type.toLowerCase() === "p") {
        for (const enPassantSquare of this.enPassantSquares) {
          // If we make an en passant move, capture the pawn below the en passant square
          if (
            enPassantSquare.x === to.position.x &&
            enPassantSquare.y === to.position.y &&
            enPassantSquare.color !== this.playerTurn
          ) {
            const dir = this.playerTurn === "w" ? 1 : -1;
            const pawnSquare =
              newBoard[enPassantSquare.y + dir][enPassantSquare.x];

            if (pawnSquare.piece?.color !== this.playerTurn) {
              pawnSquare.makeEmpty();
            }
          }
        }

        this.calculateEnPassant(from, to, piece);
      }

      // update the kings position
      if (piece.type.toLowerCase() === "k") {
        // @ts-ignore
        this.kings[this.playerTurn] = {
          ...myKing,
          position: to.position,
        };

        if (chosenMove.isCastling) {
          // long castle
          if (chosenMove.x === from.position.x - 2) {
            const rook = this.board[chosenMove.y][from.position.x - 4];
            const rookPiece = rook.piece;

            if (rookPiece) {
              this.board[chosenMove.y][from.position.x - 1].movePieceHere(
                rookPiece
              );
              rook.makeEmpty();
            }

            // for (let i = 0; i < 4; i++) {
            //   const n = i + 1;
            //   // this.movePiece(piece, fromSquare, {
            //   //   x: from.position.x - n,
            //   //   y: from.position.y,
            //   // });
            // }
          } else {
            const rook = this.board[chosenMove.y][from.position.x + 3];
            const rookPiece = rook.piece;

            if (rookPiece) {
              this.board[chosenMove.y][from.position.x + 1].movePieceHere(
                rookPiece
              );
              rook.makeEmpty();
            }
            // for (let i = 0; i < 2; i++) {
            //   const n = i + 1;
            //   // this.movePiece(piece, fromSquare, {
            //   //   x: from.position.x + n,
            //   //   y: from.position.y,
            //   // });
            // }
          }
        }

        this.castlingRights[this.playerTurn].long = false;
        this.castlingRights[this.playerTurn].short = false;
      }

      if (piece.type.toLowerCase() === "r") {
        if (from.position.x === 0) {
          this.castlingRights[this.playerTurn].long = false;
        }

        if (from.position.x === 7) {
          this.castlingRights[this.playerTurn].short = false;
        }
      }

      this.board = newBoard;

      piece.hasMoved = true;

      // if (!chosenMove.isCastling) {
      this.updatePlayerTurn();
      // }
      this.calculateChecks(this.board);

      this.emitUpdate();
    }
  }

  // TODO
  // castling

  public calculateChecks(board: Board) {
    for (const color in this.kings) {
      const king = this.kings[color as Player];
      const friendlyColor = color;
      let isKingChecked = false;

      if (!king) {
        return;
      }

      const kingSquare = board[king.position.y][king.position.x];

      // Check all directions for any checks
      for (let i = 0; i < DIRECTIONS.length; i++) {
        const direction = DIRECTIONS[i];
        const [x, y] = direction;

        const isDiagonal = i >= 4;
        let isTherePieceBlockingCheck = false;

        for (let n = 0; n < kingSquare.numbOfSquaresToEdge[i]; n++) {
          const posX = kingSquare.position.x + x * (n + 1);
          const posY = kingSquare.position.y + y * (n + 1);
          const targetSquare = board[posY][posX];
          const targetPiece = targetSquare.piece;

          if (!targetPiece) {
            continue;
          }

          const targetPieceType = targetPiece.type.toLowerCase();

          // A friendly piece is standing in the way, so there would not be any check
          if (targetPiece.color === friendlyColor) {
            isTherePieceBlockingCheck = true;
          }

          // This is an opponent piece
          if (targetPiece?.color !== friendlyColor) {
            if (isTherePieceBlockingCheck) {
              break;
            }

            if (isDiagonal) {
              // Diagonal checks

              // Only a queen, pawn and bishops can check the king on diagonal lines
              if (targetPieceType === "b" || targetPieceType === "q") {
                isKingChecked = true;
                king.isChecked = true;
              }

              if (targetPieceType === "p" && n === 0) {
                if (
                  color === "b" &&
                  ((y === 1 && x === 1) || (y === 1 && x === -1))
                ) {
                  isKingChecked = true;
                  king.isChecked = true;
                }
                if (
                  color === "w" &&
                  ((y === -1 && x === 1) || (y === -1 && x === -1))
                ) {
                  isKingChecked = true;
                  king.isChecked = true;
                }
              }

              break;
            } else {
              // Orthogonal checks
              if (targetPieceType === "b" || targetPieceType === "q") {
                isKingChecked = true;
                king.isChecked = true;
              }

              break;
            }
          }
        }
      }

      let currentRank = king.position.y - 2;
      let currentFile = king.position.x - 2;

      // check for knights checks
      for (let i = 0; i < 5; i++) {
        if (!(currentRank <= 7 && currentRank >= 0)) {
          currentRank++;
          continue;
        }
        for (let j = 0; j < 5; j++) {
          if (!(currentFile <= 7 && currentFile >= 0)) {
            currentFile++;
            continue;
          }

          const square = this.board[currentRank][currentFile];

          if (
            square.piece?.type.toLowerCase() === "n" &&
            square.piece.color !== friendlyColor
          ) {
            const dx = Math.abs(currentFile - king.position.x);
            const dy = Math.abs(currentRank - king.position.y);

            const isChecked = (dx === 1 && dy === 2) || (dx === 2 && dy === 1);

            if (isChecked) {
              isKingChecked = true;
            }
          }

          currentFile++;
        }

        currentFile = king.position.x - 2;
        currentRank++;
      }

      if (!isKingChecked) {
        king.isChecked = false;
      }
    }
  }

  public calculateEnPassant(from: Square, to: Square, piece: Piece) {
    this.enPassantSquares = [];

    if (piece.hasMoved) return;

    const dir = this.playerTurn === "w" ? -2 : 2;
    const enPassantDir = this.playerTurn === "w" ? 1 : -1;

    if (
      to.position.y - dir === from.position.y &&
      to.position.x === from.position.x
    ) {
      this.enPassantSquares.push({
        x: to.position.x,
        y: to.position.y + enPassantDir,
        color: this.playerTurn,
      });
    }
  }

  // returns an array of the square positions that this piece can move into
  public calculateLegalMoves(
    squarePosition: SquarePosition,
    friendlyColor?: Player
  ) {
    return this.moveManager.calculateLegalMoves(
      squarePosition,
      friendlyColor ? friendlyColor : this.friendlyColor,
      this.kings[this.playerTurn],
      this.enPassantSquares
    );
  }

  public notifyPlayerMove() {
    console.log(`It is ${this.playerTurn === "w" ? "White" : "Black"} to move`);
  }

  public getCurrentPlayerTurn() {
    return this.playerTurn;
  }

  public loadPositionFromFEN() {}

  public generateFEN() {}
}

export default Chess;
