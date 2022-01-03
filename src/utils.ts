export function isSquareBlack(rankIndex: number, fileIndex: number) {
  // check if rank is even
  if (rankIndex % 2 === 0) {
    return fileIndex % 2 !== 0;
  } else {
    return fileIndex % 2 === 0;
  }
}

export function isNumeric(expectedValue: any) {
  return (
    typeof expectedValue === "string" && !Number.isNaN(Number(expectedValue))
  );
}
