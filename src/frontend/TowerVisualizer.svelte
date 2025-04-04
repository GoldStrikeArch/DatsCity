<script>
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

  export let layers = [];

  let canvasContainer;
  let renderer = null;
  let scene = null;
  let camera = null;
  let controls = null;
  let towerGroup = null;
  let animationFrameId = null;
  let resizeObserver = null;
  let gridHelper = null;

  let cubeGeometry = null;
  let materialOverlap = null;
  let materialDefault = null;
  const characterTextures = new Map();

  function createCharacterTexture(char, size = 64) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (!context) return null;

      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.fillRect(0, 0, size, size);

      context.fillStyle = '#000000';
      context.font = `Bold ${size * 0.7}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(char.toUpperCase(), size / 2, size / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
  }

  function updateTowerVisualization(currentLayers) {
    if (!scene || !towerGroup || !cubeGeometry || !materialDefault) {
        return;
    }

    while(towerGroup.children.length > 0){
        const mesh = towerGroup.children[0];
        towerGroup.remove(mesh);
        if (mesh.material.map) {
             mesh.material.map.dispose();
        }
         if (mesh.material !== materialDefault && mesh.material !== materialOverlap) {
              mesh.material.dispose();
         }
    }

    if (!currentLayers || currentLayers.length === 0) {
        if (gridHelper) {
            scene.remove(gridHelper);
            gridHelper = null;
        }
        return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    currentLayers.forEach((layer, layerIndex) => {
        if (!layer || !layer.grid) return;

        const gameZ = -layerIndex;
        const grid = layer.grid;
        const height = layer.height || grid.length;
        const width = layer.width || (grid[0] ? grid[0].length : 0);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = grid[y]?.[x];

                if (char && char.trim() !== '') {
                    const gameX = x;
                    const gameY = y;

                    minX = Math.min(minX, gameX);
                    maxX = Math.max(maxX, gameX);
                    minY = Math.min(minY, gameY);
                    maxY = Math.max(maxY, gameY);

                    let charTexture = characterTextures.get(char);
                    if (!charTexture) {
                        charTexture = createCharacterTexture(char);
                        if(charTexture) characterTextures.set(char, charTexture);
                    }

                    const baseMaterial = materialDefault;
                    const cubeMaterial = baseMaterial.clone();
                    if (charTexture) {
                        cubeMaterial.map = charTexture;
                        cubeMaterial.needsUpdate = true;
                    }

                    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

                    const threeY = 0.45 - 0.9 * gameZ;
                    cube.position.set(gameX + 0.5, threeY, gameY + 0.5);

                    towerGroup.add(cube);
                }
            }
        }
    });

    if (gridHelper) {
        scene.remove(gridHelper);
        gridHelper = null;
    }
    const sizeX = isFinite(minX) ? maxX - minX + 1 : 1;
    const sizeY = isFinite(minY) ? maxY - minY + 1 : 1;
    const gridSize = Math.max(sizeX, sizeY) + 2;
    const gridDivisions = Math.max(1, Math.floor(gridSize));
    const newGridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0xcccccc);
    const centerX = isFinite(minX) ? minX + sizeX / 2 : 0.5;
    const centerY = isFinite(minY) ? minY + sizeY / 2 : 0.5;
    newGridHelper.position.set(centerX, 0, centerY);
    scene.add(newGridHelper);
    gridHelper = newGridHelper;
  }

  $: if (towerGroup) {
       updateTowerVisualization(layers);
  }

  onMount(() => {
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    canvasContainer.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 2;
    controls.maxDistance = 50;

    cubeGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    materialOverlap = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.3, roughness: 0.6 });
    materialDefault = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.3, roughness: 0.6 });

    towerGroup = new THREE.Group();
    scene.add(towerGroup);

    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.setColors(new THREE.Color(0xff0000), new THREE.Color(0x0000ff), new THREE.Color(0x00ff00));
    scene.add(axesHelper);

    resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0 || !renderer || !camera) return;
      const { width, height } = entries[0].contentRect;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(canvasContainer);

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      controls?.update();
      if (renderer && scene && camera) {
         renderer.render(scene, camera);
      }
    }
    animate();

  });

  onDestroy(() => {
    characterTextures.forEach(texture => texture.dispose());
    characterTextures.clear();

     if (animationFrameId) cancelAnimationFrame(animationFrameId);
     if (resizeObserver && canvasContainer) resizeObserver.unobserve(canvasContainer);
     controls?.dispose();
     if (scene && gridHelper) scene.remove(gridHelper);
     renderer?.dispose();
     if (renderer?.domElement && canvasContainer?.contains(renderer.domElement)) {
         canvasContainer.removeChild(renderer.domElement);
     }

     cubeGeometry?.dispose();
     materialOverlap?.dispose();
     materialDefault?.dispose();

     scene?.traverse(object => {
        if (object instanceof THREE.Mesh) {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else if (object.material) {
                if (object.material instanceof THREE.Material) {
                     object.material.dispose();
                }
            }
        }
     });
     if(scene) {
        while(scene.children.length > 0){
            scene.remove(scene.children[0]);
        }
     }
    console.log("Three.js scene cleaned up");
  });

</script>

<div class="visualizer-container" bind:this={canvasContainer}>
</div>

<style>
  .visualizer-container {
    width: 100%;
    height: 500px;
    min-height: 300px;
    border: 1px solid #ccc;
    background-color: #f9f9f9;
    position: relative;
    overflow: hidden;
  }
</style>
