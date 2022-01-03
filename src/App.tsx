import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import "./App.css";

import Board from "./components/Board";
import { Player } from "./chess";

function App() {
  const [orientation, setOrientation] = useState<Player>("w");

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <Board orientation={orientation} />
        <select
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as Player)}
        >
          <option value="w">White</option>
          <option value="b">Black</option>
        </select>
      </div>
    </DndProvider>
  );
}

export default App;
