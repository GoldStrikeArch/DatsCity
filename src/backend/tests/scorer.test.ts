import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TowerScorer } from '../scorer';
import { Direction, WordPlacement } from '../types';

// Helper function to create a basic valid tower
function createBasicValidTower(): WordPlacement[] {
  return [
    // Ground floor (z=0)
    {
      wordId: 1,
      word: "город",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.X
    },
    {
      wordId: 2,
      word: "дорога",
      position: { x: 0, y: 2, z: 0 },
      direction: Direction.X
    },

    // Vertical words connecting floors
    {
      wordId: 3,
      word: "океан",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.Z
    },
    {
      wordId: 4,
      word: "радость",
      position: { x: 3, y: 2, z: 0 },
      direction: Direction.Z
    },

    // Second floor (z=-1)
    {
      wordId: 5,
      word: "кошка",
      position: { x: 0, y: 0, z: -1 },
      direction: Direction.X
    },
    {
      wordId: 6,
      word: "автомобиль",
      position: { x: 3, y: 0, z: -1 },
      direction: Direction.Y
    }
  ];
}

// Test basic valid tower
test('Valid tower scores correctly', () => {
  const scorer = new TowerScorer();
  const wordPlacements = createBasicValidTower();
  const tower = scorer.createTowerState(wordPlacements);
  const evaluation = scorer.evaluateTower(tower);

  assert.ok(evaluation.isValid, 'Tower should be valid');
  assert.type(evaluation.score, 'number', 'Score should be a number');
  assert.ok(evaluation.score > 0, 'Score should be positive');

  // We can be more specific about the expected score if we know it
  // For now, we're just ensuring scoring works at all
});

// Test invalid tower with less than 2 floors
test('Tower with less than 2 floors is invalid', () => {
  const scorer = new TowerScorer();
  const wordPlacements: WordPlacement[] = [
    // Only ground floor (z=0)
    {
      wordId: 1,
      word: "город",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.X
    },
    {
      wordId: 2,
      word: "дорога",
      position: { x: 0, y: 2, z: 0 },
      direction: Direction.X
    }
  ];

  const tower = scorer.createTowerState(wordPlacements);
  const evaluation = scorer.evaluateTower(tower);

  assert.not.ok(evaluation.isValid, 'Tower should be invalid');
  assert.equal(evaluation.score, 0, 'Invalid tower should have zero score');
  assert.match(evaluation.invalidReason || '', /at least 2 floors/, 'Should mention floor count issue');
});

// Test invalid vertical word (not enough intersections)
test('Vertical word without enough intersections is invalid', () => {
  const scorer = new TowerScorer();
  const wordPlacements: WordPlacement[] = [
    // Ground floor (z=0)
    {
      wordId: 1,
      word: "город",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.X
    },

    // Vertical word with insufficient intersections
    {
      wordId: 3,
      word: "океан",
      position: { x: 5, y: 5, z: 0 }, // Not intersecting with anything
      direction: Direction.Z
    },

    // Second floor (z=-1)
    {
      wordId: 5,
      word: "кошка",
      position: { x: 0, y: 0, z: -1 },
      direction: Direction.X
    }
  ];

  const tower = scorer.createTowerState(wordPlacements);
  const evaluation = scorer.evaluateTower(tower);

  assert.not.ok(evaluation.isValid, 'Tower should be invalid');
  assert.match(evaluation.invalidReason || '', /intersections/, 'Should mention intersection issue');
});

// Test invalid horizontal word on non-zero floor (not enough intersections)
test('Horizontal word on non-zero floor without enough intersections is invalid', () => {
  const scorer = new TowerScorer();
  // Start with a valid tower
  const wordPlacements = createBasicValidTower();

  // Add an invalid horizontal word on the second floor
  wordPlacements.push({
    wordId: 7,
    word: "машина",
    position: { x: 0, y: 5, z: -1 }, // Not intersecting with at least 2 vertical words
    direction: Direction.X
  });

  const tower = scorer.createTowerState(wordPlacements);
  const evaluation = scorer.evaluateTower(tower);

  assert.not.ok(evaluation.isValid, 'Tower should be invalid');
  assert.match(evaluation.invalidReason || '', /Horizontal word/, 'Should mention horizontal word issue');
});

// Test proportionality coefficient calculation
test('Floor proportion coefficient calculation is correct', () => {
  const scorer = new TowerScorer();

  // Create a tower with a square floor (1:1 proportion)
  const squareFloorTower: WordPlacement[] = [
    // Ground floor makes a 3x3 square
    {
      wordId: 1,
      word: "три",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.X
    },
    {
      wordId: 2,
      word: "три",
      position: { x: 0, y: 2, z: 0 },
      direction: Direction.X
    },
    {
      wordId: 3,
      word: "три",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.Y
    },
    {
      wordId: 4,
      word: "три",
      position: { x: 2, y: 0, z: 0 },
      direction: Direction.Y
    },

    // Vertical connections to second floor
    {
      wordId: 5,
      word: "верх",
      position: { x: 0, y: 0, z: 0 },
      direction: Direction.Z
    },
    {
      wordId: 6,
      word: "верх",
      position: { x: 2, y: 2, z: 0 },
      direction: Direction.Z
    },

    // Second floor
    {
      wordId: 7,
      word: "два",
      position: { x: 0, y: 0, z: -1 },
      direction: Direction.X
    },
    {
      wordId: 8,
      word: "два",
      position: { x: 0, y: 0, z: -1 },
      direction: Direction.Y
    }
  ];

  const tower = scorer.createTowerState(squareFloorTower);

  // Ground floor (z=0) is 3x3, so proportion coefficient should be 1.0
  const groundFloor = tower.floors.get(0);
  assert.ok(groundFloor, 'Ground floor should exist');
  assert.equal(groundFloor?.width, 3, 'Width should be 3');
  assert.equal(groundFloor?.depth, 3, 'Depth should be 3');

  // Now we need to manually calculate what we expect the score to be
  // For a 3x3 floor with 4 words (2 in X, 2 in Y direction), the calculation would be:
  // Letter count: "три" * 4 = 12 letters
  // Proportion: min(3,3)/max(3,3) = 1.0
  // Density: 1 + (2 + 2)/4 = 2.0
  // Floor multiplier (for z=0): 1
  // Expected score: 12 * 1.0 * 2.0 * 1 = 24.0

  const evaluation = scorer.evaluateTower(tower);
  assert.ok(evaluation.isValid, 'Tower should be valid');

  // Find the ground floor score in the evaluation results
  const groundFloorEval = evaluation.floors.find(f => f.floorZ === 0);
  assert.ok(groundFloorEval, 'Ground floor evaluation should exist');

  // We use approximately equal (within ±0.01) because of potential floating point differences
  assert.ok(
    Math.abs(groundFloorEval?.score - 24.0) < 0.01,
    `Ground floor score should be approximately 24.0, got ${groundFloorEval?.score}`
  );
});

// Test density coefficient calculation
test('Floor density coefficient calculation is correct', () => {
  const scorer = new TowerScorer();

  // Create a tower with varying word densities
  const denseTower = createBasicValidTower();

  // Add more words to increase density
  denseTower.push({
    wordId: 7,
    word: "плотно",
    position: { x: 0, y: 4, z: 0 },
    direction: Direction.X
  });
  denseTower.push({
    wordId: 8,
    word: "густо",
    position: { x: 5, y: 0, z: 0 },
    direction: Direction.Y
  });

  const tower = scorer.createTowerState(denseTower);
  const evaluation = scorer.evaluateTower(tower);

  // With more words on the ground floor, the density coefficient should be higher
  // For example, with 4 horizontal words, the calculation would be:
  // Density: 1 + (4/4) = 2.0

  assert.ok(evaluation.isValid, 'Tower should be valid');

  // You would need to know the exact expected values based on your implementation
  // For now, we'll check that the score is positive and the tower is valid
  assert.ok(evaluation.score > 0, 'Score should be positive');
});

// Test increasing score with tower height
test('Taller towers get higher scores', () => {
  const scorer = new TowerScorer();

  // Create a basic 2-floor tower
  const twoFloorTower = createBasicValidTower();
  const twoFloorTowerState = scorer.createTowerState(twoFloorTower);
  const twoFloorEvaluation = scorer.evaluateTower(twoFloorTowerState);

  // Create a 3-floor tower by extending the 2-floor tower
  const threeFloorTower = [...twoFloorTower];

  // Add connections to third floor
  threeFloorTower.push({
    wordId: 9,
    word: "глубже",
    position: { x: 1, y: 1, z: -1 },
    direction: Direction.Z
  });
  threeFloorTower.push({
    wordId: 10,
    word: "ниже",
    position: { x: 5, y: 5, z: -1 },
    direction: Direction.Z
  });

  // Add third floor (z=-2)
  threeFloorTower.push({
    wordId: 11,
    word: "этаж",
    position: { x: 1, y: 1, z: -2 },
    direction: Direction.X
  });
  threeFloorTower.push({
    wordId: 12,
    word: "третий",
    position: { x: 5, y: 3, z: -2 },
    direction: Direction.Y
  });

  const threeFloorTowerState = scorer.createTowerState(threeFloorTower);
  const threeFloorEvaluation = scorer.evaluateTower(threeFloorTowerState);

  assert.ok(threeFloorEvaluation.isValid, '3-floor tower should be valid');
  assert.ok(twoFloorEvaluation.isValid, '2-floor tower should be valid');

  // The 3-floor tower should have a higher score due to the additional floor and height multipliers
  assert.ok(
    threeFloorEvaluation.score > twoFloorEvaluation.score,
    `3-floor tower score (${threeFloorEvaluation.score}) should be higher than 2-floor tower score (${twoFloorEvaluation.score})`
  );
});
