import { Board, SquarePosition } from "./types";
import Piece from "./piece";
import { DIRECTIONS, Player, King } from "./index";
import Square from "./square";

export default class MoveManager {
  private board: Board;
  private king!: King;
  private checkPaths: Square[] = [];
  private attackedSquares: SquarePosition[] = [];
  private isCalculatingAttackAreas = false;

  constructor(board: Board) {
    this.board = board;
  }

  public calculateLegalMoves(
    squarePosition: SquarePosition,
    friendlyColor: Player,
    king: King,
    checkPaths: Square[],
    attackedSquares: SquarePosition[],
    isCalculatingAttackAreas = false
  ) {
    if (!king) return [];

    this.king = king;
    this.checkPaths = checkPaths;
    this.isCalculatingAttackAreas = isCalculatingAttackAreas;
    this.attackedSquares = attackedSquares;

    let legalMoves: SquarePosition[] = [];

    const square = this.board[squarePosition.y][squarePosition.x];
    // console.log("sheesh");

    // check if we are dragging a piece
    if (square.isEmpty) {
      return [];
    }

    const piece = square.piece;

    if (piece) {
      switch (piece.type) {
        case "B":
        case "b":
          legalMoves = this.calculateBishopMoves(square, friendlyColor);
          break;
        case "R":
        case "r":
          legalMoves = this.calculateRookMoves(square, friendlyColor);
          break;
        case "Q":
        case "q":
          legalMoves = this.calculateQueenMoves(square, friendlyColor);
          break;
        case "K":
        case "k":
          legalMoves = this.calculateKingMoves(square, friendlyColor);
          break;
        case "P":
        case "p":
          legalMoves = this.calculatePawnMoves(square, friendlyColor);
          break;
        case "N":
        case "n":
          legalMoves = this.calculateKnightMoves(square, friendlyColor);
      }
    }

    return legalMoves;
  }

  public calculateRookMoves(square: Square, friendlyColor: Player) {
    return this.generateSlidingMoves(square, 0, 4, friendlyColor);
  }
  public calculateBishopMoves(square: Square, friendlyColor: Player) {
    return this.generateSlidingMoves(square, 4, 8, friendlyColor);
  }
  public calculateQueenMoves(square: Square, friendlyColor: Player) {
    return this.generateSlidingMoves(square, 0, 8, friendlyColor);
  }
  public calculatePawnMoves(square: Square, friendlyColor: Player) {
    const legalMoves = [];
    const legalAttackMoves = [];
    const piece = square.piece;

    // white pawn can only go north
    // black can go south
    let direction = friendlyColor === "w" ? -1 : 1;

    const posX = square.position.x;
    const posY = square.position.y + direction;

    if (this.checkInBound(posX, posY)) {
      const square = this.board[posY][posX];

      if (square.isEmpty) {
        legalMoves.push({
          x: posX,
          y: posY,
        });

        if (piece && !piece.hasMoved) {
          // direction = friendlyColor === "w" ? 2 : -2;
          // console.log(posX, square.position.y, posY, posY - direction);
          if (this.checkInBound(posX, posY + direction)) {
            // console.log("hi");
            const _square = this.board[posY + direction][posX];

            if (_square.isEmpty) {
              legalMoves.push({
                x: posX,
                y: posY + direction,
              });
            }
          }
        }
      }
    }

    const leftDiagonalX = posX - 1;
    const leftDiagonalY = posY;

    if (this.checkInBound(leftDiagonalX, leftDiagonalY)) {
      const _square = this.board[leftDiagonalY][leftDiagonalX];

      if (_square.piece && _square.piece.color !== friendlyColor) {
        legalMoves.push({
          x: leftDiagonalX,
          y: leftDiagonalY,
        });
      }

      if (_square.isEmpty) {
        legalAttackMoves.push({
          x: leftDiagonalX,
          y: leftDiagonalY,
        });
      }
    }

    const rightDiagonalX = posX + 1;
    const rightDiagonalY = posY;

    if (this.checkInBound(rightDiagonalX, rightDiagonalY)) {
      const _square = this.board[rightDiagonalY][rightDiagonalX];

      if (_square.piece && _square.piece.color !== friendlyColor) {
        legalMoves.push({
          x: rightDiagonalX,
          y: rightDiagonalY,
        });
      }

      if (_square.isEmpty) {
        legalAttackMoves.push({
          x: rightDiagonalX,
          y: rightDiagonalY,
        });
      }
    }

    if (this.isCalculatingAttackAreas) {
      // console.log(legalAttackMoves);
      return this.filterLegalMoves(legalAttackMoves, piece);
    }

    return this.filterLegalMoves([...legalMoves], piece);
  }

  public calculateKnightMoves(square: Square, friendlyColor: Player) {
    const legalMoves = [];
    const { position } = square;
    const piece = square.piece;

    // first top right
    const posX = position.x + 1;
    const posY = position.y - 2;

    if (this.checkInBound(posX, posY)) {
      if (
        this.board[posY][posX].isEmpty ||
        this.board[posY][posX].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX,
          y: posY,
        });
      }
    }

    // second top right
    const posX1 = position.x + 2;
    const posY1 = position.y - 1;

    if (this.checkInBound(posX1, posY1)) {
      if (
        this.board[posY1][posX1].isEmpty ||
        this.board[posY1][posX1].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX1,
          y: posY1,
        });
      }
    }

    // first bottom right
    const posX2 = position.x + 2;
    const posY2 = position.y + 1;

    if (this.checkInBound(posX2, posY2)) {
      if (
        this.board[posY2][posX2].isEmpty ||
        this.board[posY2][posX2].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX2,
          y: posY2,
        });
      }
    }

    // second bottom right
    const posX3 = position.x + 1;
    const posY3 = position.y + 2;

    if (this.checkInBound(posX3, posY3)) {
      if (
        this.board[posY3][posX3].isEmpty ||
        this.board[posY3][posX3].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX3,
          y: posY3,
        });
      }
    }

    // first bottom left
    const posX4 = position.x - 1;
    const posY4 = position.y + 2;

    if (this.checkInBound(posX4, posY4)) {
      if (
        this.board[posY4][posX4].isEmpty ||
        this.board[posY4][posX4].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX4,
          y: posY4,
        });
      }
    }

    // second bottom left
    const posX5 = position.x - 2;
    const posY5 = position.y + 1;

    if (this.checkInBound(posX5, posY5)) {
      if (
        this.board[posY5][posX5].isEmpty ||
        this.board[posY5][posX5].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX5,
          y: posY5,
        });
      }
    }

    // first top left
    const posX6 = position.x - 2;
    const posY6 = position.y - 1;

    if (this.checkInBound(posX6, posY6)) {
      if (
        this.board[posY6][posX6].isEmpty ||
        this.board[posY6][posX6].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX6,
          y: posY6,
        });
      }
    }

    // second top left
    const posX7 = position.x - 1;
    const posY7 = position.y - 2;

    if (this.checkInBound(posX7, posY7)) {
      if (
        this.board[posY7][posX7].isEmpty ||
        this.board[posY7][posX7].piece?.color !== friendlyColor
      ) {
        legalMoves.push({
          x: posX7,
          y: posY7,
        });
      }
    }

    // console.log("legal", legalMoves);
    if (this.isCalculatingAttackAreas) {
      return legalMoves;
    }

    return this.filterLegalMoves(legalMoves, piece);
  }

  public calculateKingMoves(square: Square, friendlyColor: Player) {
    const legalMoves = [];
    const piece = square.piece;

    for (let i = 0; i < DIRECTIONS.length; i++) {
      const direction = DIRECTIONS[i];

      const [x, y] = direction;

      const posX = square.position.x + x;
      const posY = square.position.y - y;

      // Check if these squares dont exceed the edges
      if (this.checkInBound(posX, posY)) {
        const square = this.board[posY][posX];

        if (square.isEmpty || square.piece?.color !== friendlyColor) {
          let isLegalMove = true;
          // If this move is not in one of the attacked square, it is legal, otherwise it is illegal to go there
          for (const attackedSquare of this.attackedSquares) {
            if (attackedSquare.x === posX && attackedSquare.y === posY) {
              isLegalMove = false;
            }
          }

          if (isLegalMove) {
            legalMoves.push({
              x: posX,
              y: posY,
            });
          }
        }
      }
    }

    return this.filterLegalMoves(legalMoves, piece, true);
  }

  private generateSlidingMoves(
    square: Square,
    startDirIndex: number,
    endDirIndex: number,
    friendlyColor: Player
  ) {
    const legalMoves = [];
    const piece = square.piece;

    // If the king is in check, check if this piece can move into the path
    // that can block the check and mark this piece as pinned

    for (let i = startDirIndex; i < endDirIndex; i++) {
      const direction = DIRECTIONS[i];

      const [x, y] = direction;

      let isOpponentPieceStandingInPath = false;

      for (let n = 0; n < square.numbOfSquaresToEdge[i]; n++) {
        if (isOpponentPieceStandingInPath && !this.isCalculatingAttackAreas)
          break;

        const posX = square.position.x + x * (n + 1);
        const posY = square.position.y + y * (n + 1);

        const targetSquare = this.board[posY][posX];

        // Check if there is a friendly piece blocking the path
        if (
          !targetSquare.isEmpty &&
          targetSquare.piece?.color === friendlyColor
        ) {
          break;
        } else {
          if (
            !targetSquare.isEmpty &&
            targetSquare.piece?.color !== friendlyColor
          ) {
            isOpponentPieceStandingInPath = true;
          }

          legalMoves.push({
            x: posX,
            y: posY,
          });
        }
      }
    }

    // console.log("rook", legalMoves);

    return this.filterLegalMoves(legalMoves, piece);
  }

  private checkInBound(posX: number, posY: number) {
    return posX <= 7 && posX >= 0 && posY >= 0 && posY <= 7;
  }

  private filterLegalMoves(
    legalMoves: SquarePosition[],
    piece: Piece | undefined,
    isKing = false
  ) {
    // console.log("filter");
    if (!piece) return [];

    const isKingInCheck = this.king?.isChecked;

    // console.log(this.king);

    if (isKingInCheck) {
      const legalMovesIfKingInCheck = [];
      const illegalMoves = [];

      // TODO handle scenario where the king can take the checking piece
      // but also in that checking path, check if there are "supporting pieces" that would prevent the king to capture the checking piece
      for (const move of legalMoves) {
        for (const path of this.checkPaths) {
          if (isKing) {
            // If the king is trying to move out of check, that square must not be the one in checkPaths
            // except it can attack the attacker if that attacker is not supported by other pieces
            if (
              move.x === path.position.x &&
              move.y === path.position.y &&
              path.isEmpty
            ) {
              illegalMoves.push(move);
              continue;
            }

            // Check if this move is not one of the illegal move
            if (
              illegalMoves.filter((m) => m.x === move.x && m.y === move.y)
                .length === 0
            ) {
              legalMovesIfKingInCheck.push(move);
            }
          } else {
            if (move.x === path.position.x && move.y === path.position.y) {
              const pathSquare = this.board[path.position.y][path.position.x];
              const square = this.board[move.y][move.x];

              if (pathSquare.isEmpty && !pathSquare.piece && square.piece) {
                square.piece.isPinned = true;
              }

              legalMovesIfKingInCheck.push(move);
            }
          }
        }
      }

      console.log("king is in check", legalMovesIfKingInCheck);

      return legalMovesIfKingInCheck;
    }

    // console.log("siked");

    if (piece.isPinned) {
      const legalMovesIfPinned = [];

      for (const move of legalMoves) {
        for (const path of this.checkPaths) {
          if (move.x === path.position.x && move.y === path.position.y) {
            legalMovesIfPinned.push(move);
          }
        }
      }

      return legalMovesIfPinned;
    }

    if (!isKingInCheck && !piece.isPinned) {
      // console.log("not pinned nor checked", this.king, piece);
      return legalMoves;
    }

    return [];
  }
}
