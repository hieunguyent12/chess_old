import { isNumeric } from "../utils";
import Piece from "./piece";
import { PiecesType } from "./pieces";
import Square from "./square";
import { SquarePosition } from "./types";
import MoveManager from "./moveManager";
import { Board } from "./types";

export type Player = "w" | "b";
type SubscriberCallback<T> = (arg: T) => void;
export type King = {
  position: SquarePosition;
  isChecked: boolean;
} | null;
type Kings = Record<Player, King>;

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

  private whiteCastlingRights = {
    kingSide: true,
    queenSide: true,
  };
  private blackCastlingRights = {
    kingSide: true,
    queenSide: true,
  };

  // keep track of black and white's kings position on the board
  public kings: Kings = {
    b: null,
    w: null,
  };

  private checkPaths: Square[] = [];
  private pinnedPieces: Piece[] = [];
  public attackedSquares: SquarePosition[] = [];

  // keep track of the pieces that can't move because they are pinned
  // private pinnedPieces: Piece[];

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
    this.moveManager = new MoveManager(this.board);

    this.calculateAttackAreas();

    console.log(this.attackedSquares);
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
        this.whiteCastlingRights.kingSide =
          castleRights.indexOf("K") !== -1 && castleRights !== "-";
        this.whiteCastlingRights.queenSide =
          castleRights.indexOf("Q") !== -1 && castleRights !== "-";
        this.blackCastlingRights.kingSide =
          castleRights.indexOf("k") !== -1 && castleRights !== "-";
        this.blackCastlingRights.queenSide =
          castleRights.indexOf("q") !== -1 && castleRights !== "-";

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
    // If the king is in check, then the current player can only block the check or move the king away

    // probably cache this because we're calling it twice from Square.tsx and here
    // when calculating legal moves, also take in to consideration whether or not the king is in check
    const legalMoves = this.calculateLegalMoves({ ...fromSquare });

    let isLegalMove = false;

    for (const move of legalMoves) {
      if (move.x === toSquare.x && move.y === toSquare.y) {
        isLegalMove = true;
        break;
      }
    }

    if (!isLegalMove) {
      return;
    }

    // If we make a move that will result in the king being checked, then it is not legal
    // const temp = this.board;

    // do nothing if we are moving to the same square where we started
    if (fromSquare.x === toSquare.x && fromSquare.y === toSquare.y) {
      return;
    }

    const newBoard = [...this.board];

    const from = newBoard[fromSquare.y][fromSquare.x];
    const to = newBoard[toSquare.y][toSquare.x];

    const fromColor = from.piece?.color;

    // Check whether or not this piece belongs to the current player
    if (from.piece?.color !== this.playerTurn) {
      return;
    }

    let capturedPiece: Piece | undefined;

    // capture the opponent pieces
    if (!to.isEmpty && to.piece && to.piece.color !== this.friendlyColor) {
      capturedPiece = to.piece;
    }

    from.makeEmpty();
    to.movePieceHere(piece);

    // update the kings position
    if (piece.type === "k" || piece.type === "K") {
      // @ts-ignore
      this.kings[piece.color] = {
        ...this.kings[piece.color],
        position: to.position,
      };
    }

    this.board = newBoard;

    this.attackedSquares = [];

    // console.log(this.kings);
    // this.calculateChecks();
    // if (this.kings[this.playerTurn]?.isChecked) {
    //   // this.attackedSquares = [];
    //   // this.updatePlayerTurn();
    //   // this.calculateAttackAreas();
    //   // this.calculateChecks();
    //   console.log("illegal move, revert the move");
    //   return;
    // }

    // this.updatePlayerTurn();
    // this.calculateAttackAreas();

    // // this.notifyPlayerMove();
    // this.emitUpdate();

    // return {
    //   color: fromColor,
    //   from: from.coordinate,
    //   to: to.coordinate,
    //   captured: capturedPiece,
    // };
  }

  // TODO
  // calculate all of the squares that are attacked so we know where the kings can't move into
  // en passant
  // castling

  // TODO move this to seperate file
  // Check for checks against the kings for both black and white in all directions
  public calculateChecks() {
    const colors: Record<0 | 1, Player> = {
      0: "w",
      1: "b",
    };

    // calculate checks for both kings
    for (let k = 0; k < 2; k++) {
      let checkCounter = 0; // impossible to get more than 2 checks at once
      const color = colors[k as keyof typeof colors];
      let isThisKingChecked = false;
      let isThereAnyPinnedPieces = false;

      // console.log(isThisKingChecked);

      const opponentColor = color === "w" ? "b" : "w";
      const king = this.kings[color];

      if (!king?.position.x && !king?.position.y) {
        return;
      } else {
        const kingSquare = this.board[king.position.y][king.position.x];

        // check all directions of the king for any checks
        for (let i = 0; i < DIRECTIONS.length; i++) {
          if (checkCounter >= 2) {
            break;
          }

          const direction = DIRECTIONS[i];
          const [x, y] = direction;

          const isDiagonal = i >= 4;
          const checkPaths = [];
          const possiblePinnedPieces = [];
          let isTherePieceBlockingCheck = false;

          for (let n = 0; n < kingSquare.numbOfSquaresToEdge[i]; n++) {
            if (checkCounter >= 2) {
              break;
            }

            const posX = kingSquare.position.x + x * (n + 1);
            const posY = kingSquare.position.y + y * (n + 1);

            const targetSquare = this.board[posY][posX];
            const squarePiece = targetSquare.piece;

            // check if this piece belong to opponent
            if (squarePiece && squarePiece.color === opponentColor) {
              // only a queen and a bishop can check on diagonal lines
              // so if for example, a pawn is standing between the king and the opponent queen, then there won't be a check
              if (isDiagonal) {
                if (
                  squarePiece.type.toLowerCase() === "b" ||
                  squarePiece.type.toLowerCase() === "q"
                ) {
                  checkPaths.push(targetSquare);
                  if (isTherePieceBlockingCheck) {
                    king.isChecked = false;
                    // If there is only one piece blocking the path, that piece is pinned
                    if (possiblePinnedPieces.length === 1) {
                      console.log("potential check", targetSquare);
                      console.log("pinned pieces", possiblePinnedPieces);
                      // TODO save this checkPaths, a pinned piece can only move in these checkPaths
                      console.log("check paths", checkPaths);
                      // TODO unpin these pieces
                      this.checkPaths = checkPaths;
                      possiblePinnedPieces[0].isPinned = true;
                      this.pinnedPieces.push(possiblePinnedPieces[0]);
                      checkCounter++;
                      isThereAnyPinnedPieces = true;
                    } else {
                      // if there are two or more pieces in the way of a potential check, then none of those pieces are pinned
                      for (const piece of this.pinnedPieces) {
                        for (const possiblyPinnedPiece of possiblePinnedPieces) {
                          if (piece === possiblyPinnedPiece) {
                            piece.isPinned = false;
                            this.pinnedPieces = this.pinnedPieces.filter(
                              (p) => p !== piece
                            );
                          }
                        }
                      }
                    }
                  } else {
                    console.log("diagonal check", targetSquare);
                    console.log("check rays", checkPaths);
                    // If there is not a friendly piece standing in the way, the king is checked
                    this.checkPaths = checkPaths;
                    king.isChecked = true;
                    isThisKingChecked = true;
                  }
                } else {
                  // If there is an opponent piece standing in this diagonal but can't move diagonally, the friendly pieces are no longer pinned
                  // and the king is not checked
                  // king.isChecked = false;
                  for (const piece of this.pinnedPieces) {
                    for (const possiblyPinnedPiece of possiblePinnedPieces) {
                      if (piece === possiblyPinnedPiece) {
                        piece.isPinned = false;
                        this.pinnedPieces = this.pinnedPieces.filter(
                          (p) => p !== piece
                        );
                      }
                    }
                  }
                }

                // TODO make sure the king is not checked if none of these cases apply
                if (squarePiece.type.toLowerCase() === "p" && n === 0) {
                  if (
                    color === "b" &&
                    ((y === 1 && x === 1) || (y === 1 && x === -1))
                  ) {
                    console.log("pawn check", targetSquare);
                    king.isChecked = true;
                    isThisKingChecked = true;
                  }
                  if (
                    color === "w" &&
                    ((y === -1 && x === 1) || (y === -1 && x === -1))
                  ) {
                    console.log("pawn check", targetSquare);
                    king.isChecked = true;
                    isThisKingChecked = true;
                  }
                }

                break;
              } else {
                // ORTHOGONAL CHECKS
                if (
                  squarePiece.type.toLowerCase() === "r" ||
                  squarePiece.type.toLowerCase() === "q"
                ) {
                  checkPaths.push(targetSquare);
                  if (isTherePieceBlockingCheck) {
                    king.isChecked = false;
                    if (possiblePinnedPieces.length === 1) {
                      console.log("potential check", targetSquare);
                      console.log("pinned pieces", possiblePinnedPieces);
                      possiblePinnedPieces[0].isPinned = true;
                      this.pinnedPieces.push(possiblePinnedPieces[0]);
                      checkCounter++;
                      this.checkPaths = checkPaths;
                      isThereAnyPinnedPieces = true;
                    } else {
                      // if there are two or more pieces in the way of a potential check, then none of those pieces are pinned
                      for (const piece of this.pinnedPieces) {
                        for (const possiblyPinnedPiece of possiblePinnedPieces) {
                          if (piece === possiblyPinnedPiece) {
                            piece.isPinned = false;
                            this.pinnedPieces = this.pinnedPieces.filter(
                              (p) => p !== piece
                            );
                          }
                        }
                      }
                    }
                  } else {
                    console.log("orthogonal check", targetSquare);
                    console.log("check rays", checkPaths);
                    this.checkPaths = checkPaths;
                    king.isChecked = true;
                    isThisKingChecked = true;
                    // console.log("king is checked", targetSquare);
                  }
                } else {
                  // console.log("SHOULD NOT RUNNNNNNNN");
                  // king.isChecked = false;
                  // if there are two or more pieces in the way of a potential check, then none of those pieces are pinned
                  for (const piece of this.pinnedPieces) {
                    for (const possiblyPinnedPiece of possiblePinnedPieces) {
                      if (piece === possiblyPinnedPiece) {
                        piece.isPinned = false;
                        this.pinnedPieces = this.pinnedPieces.filter(
                          (p) => p !== piece
                        );
                      }
                    }
                  }
                }

                break;
              }
            }

            // friendly piece blocking check
            if (squarePiece && squarePiece.color === color) {
              isTherePieceBlockingCheck = true;
              possiblePinnedPieces.push(squarePiece);
            }
          }

          // console.log("paths", color, direction, checkPaths);
        }

        // console.log(isThisKingChecked);

        let currentRank = king.position.y - 2;
        let currentFile = king.position.x - 2;
        // let checkCounter = 0; // impossible to get more than 3 checks at once

        // check for knights checks
        for (let i = 0; i < 5; i++) {
          if (checkCounter >= 2) {
            break;
          }
          if (!(currentRank <= 7 && currentRank >= 0)) {
            currentRank++;
            continue;
          }
          for (let j = 0; j < 5; j++) {
            if (!(currentFile <= 7 && currentFile >= 0)) {
              currentFile++;
              continue;
            }

            // console.log(currentRank, currentFile);
            const square = this.board[currentRank][currentFile];

            if (
              square.piece?.type.toLowerCase() === "n" &&
              square.piece.color === opponentColor
            ) {
              const dx = Math.abs(currentFile - king.position.x);
              const dy = Math.abs(currentRank - king.position.y);

              const isChecked =
                (dx === 1 && dy === 2) || (dx === 2 && dy === 1);

              if (isChecked) {
                console.log("knight check", square);
                king.isChecked = true;
                isThisKingChecked = true;
                checkCounter++;
              }
            }

            if (checkCounter >= 2) {
              break;
            }

            currentFile++;
          }

          currentFile = king.position.x - 2;
          currentRank++;
        }

        if (!isThereAnyPinnedPieces) {
          for (const piece of this.pinnedPieces) {
            if (piece.color === color) {
              piece.isPinned = false;
              this.pinnedPieces = this.pinnedPieces.filter((p) => p !== piece);
            }
          }
        }
      }

      if (!isThisKingChecked) {
        king.isChecked = false;
      }
    }
  }

  public calculateAttackAreas() {
    // calculate the squares that attacked by the opponent
    const friendlyColor = this.friendlyColor === "w" ? "b" : "w";

    for (let r = 0; r < this.board.length; r++) {
      const rank = this.board[r];
      for (let f = 0; f < rank.length; f++) {
        const square = rank[f];

        const piece = square.piece;

        if (piece && piece.color === friendlyColor) {
          const legalMoves = this.calculateLegalMoves(
            square.position,
            friendlyColor,
            true
          );

          this.attackedSquares = [...this.attackedSquares, ...legalMoves];
        }
      }
    }
  }

  // returns an array of the square positions that this piece can move into
  public calculateLegalMoves(
    squarePosition: SquarePosition,
    friendlyColor?: Player,
    isCalculatingAreas = false
  ) {
    // console.log(this.kings[this.playerTurn]);
    return this.moveManager.calculateLegalMoves(
      squarePosition,
      friendlyColor ? friendlyColor : this.friendlyColor,
      this.kings[this.playerTurn],
      this.checkPaths,
      this.attackedSquares,
      isCalculatingAreas
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
