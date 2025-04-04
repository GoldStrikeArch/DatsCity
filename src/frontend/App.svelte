<script>
  import TowerVisualizer from './TowerVisualizer.svelte';

  function createMockLayer(width, height, fillChar = ' ') {
      const grid = [];
      for (let y = 0; y < height; y++) {
          grid.push(Array(width).fill(fillChar));
      }
      return { width, height, grid };
  }

  let towerLayers = [];

  const layer0 = createMockLayer(3, 3);
  layer0.grid[0][0] = 'К'; layer0.grid[0][1] = 'О'; layer0.grid[0][2] = 'Т';
  layer0.grid[1][1] = 'О'; layer0.grid[2][1] = 'М';
  towerLayers.push(layer0);

  const layer1 = createMockLayer(4, 1);
  layer1.grid[0][1] = 'О'; layer1.grid[0][2] = 'С'; layer1.grid[0][3] = 'А';
  towerLayers.push(layer1);

  const layer2 = createMockLayer(2, 1);
  layer2.grid[0][1] = 'А';
  towerLayers.push(layer2);

  $: currentVoxelMap = convertWordsToVoxels(currentTowerWords);

  function addWord() {
    if (towerLayers[0] && towerLayers[0].grid[0]) {
        if (towerLayers[0].grid[0].length < 4) {
            towerLayers[0].grid[0].push('Л');
            towerLayers[0].width = towerLayers[0].grid[0].length;
        } else {
            towerLayers[0].grid[0][3] = 'Л';
        }
    }
    towerLayers = [...towerLayers];
    console.log("Layers updated", towerLayers);
  }
</script>

<main>
  <div class="content">
    <div class="visualizer-section">
        <h2>Визуализация Башни (Слоями)</h2>
        <button on:click={addWord}>Добавить букву 'Л'</button>
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

.content h1 {
  font-size: 3.6rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.content p {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.5;
   margin-bottom: 2rem;
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
