<script>
import TowerVisualizer from "./TowerVisualizer.svelte";

function createMockLayer(width, height, fillValue = null) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid.push(Array(width).fill(fillValue));
  }
  return { width, height, grid };
}

let towerLayers = [];

const layer0 = createMockLayer(3, 3);
layer0.grid[0][0] = { char: "К", dir: 2 };
layer0.grid[0][1] = { char: "О", dir: 2 };
layer0.grid[0][2] = { char: "Т", dir: 2 };
layer0.grid[1][1] = { char: "О", dir: 3 };
layer0.grid[2][1] = { char: "М", dir: 3 };
towerLayers.push(layer0);

const layer1 = createMockLayer(7, 1);
layer1.grid[0][1] = { char: "С", dir: 2 };
layer1.grid[0][2] = { char: "О", dir: 2 };
layer1.grid[0][3] = { char: "С", dir: 2 };
layer1.grid[0][4] = { char: "А", dir: 2 };
layer1.grid[0][5] = { char: "Л", dir: 2 };
layer1.grid[0][6] = { char: "?", dir: 2 };
towerLayers.push(layer1);

const layer2 = createMockLayer(7, 1);
layer2.grid[0][1] = { char: "А", dir: 1 };
towerLayers.push(layer2);

function addWord() {
  if (towerLayers[0] && towerLayers[0].grid[0]) {
    const newCell = { char: "Л", dir: 3 };
    if (towerLayers[0].grid[0].length < 4) {
      towerLayers[0].grid[0].push(newCell);
      towerLayers[0].width = towerLayers[0].grid[0].length;
    } else {
      towerLayers[0].grid[0][3] = newCell;
    }
  }
  towerLayers = [...towerLayers];
  console.log("Layers updated", towerLayers);
}
</script>

<main>
  <div class="content">
    <div class="visualizer-section">
        <h2>Визуализация Башни</h2>
        <button on:click={addWord}>Добавить букву 'Л' (Y)</button>
        <div class="visualizer-wrapper">
            <TowerVisualizer layers={towerLayers} />
        </div>
    </div>
  </div>
</main>

<style>
.content {
  display: flex;
  line-height: 1.1;
  text-align: center;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.visualizer-section {
    width: 80%;
    max-width: 1000px;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.visualizer-section h2 {
    margin-bottom: 10px;
}

.visualizer-section button {
    margin-bottom: 15px;
    padding: 8px 15px;
    cursor: pointer;
}

.visualizer-wrapper {
    width: 100%;
}

</style>
