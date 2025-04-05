import { beforeEach, describe, expect, it } from "vitest";
import { TowerScorer } from "../scorer";
import { Direction, type Point3D, type WordPlacement } from "../types";

// Helper to create basic Point3D
const p = (x: number, y: number, z: number): Point3D => ({ x, y, z });

describe("TowerScorer", () => {
  let scorer: TowerScorer;

  beforeEach(() => {
    scorer = new TowerScorer();
  });

  it("should invalidate a tower with less than 2 floors", () => {
    const placements: WordPlacement[] = [{ wordId: 0, word: "BASE", position: p(0, 0, 0), direction: Direction.X }];
    const towerState = scorer.createTowerState(placements);
    const result = scorer.evaluateTower(towerState);

    expect(result.isValid).toBe(false);
    expect(result.score).toBe(0);
    expect(result.invalidReason).toContain("at least 2 floors");
  });

  it("should invalidate a tower with a vertical word having less than 2 valid intersections", () => {
    // Z=0:  BASE (X)
    // Z=-1: LEG (X)
    // V: BL (Z @ 0,0,0). Intersects BASE@B(invalid), LEG@L(valid). Needs 2 valid.
    const placements: WordPlacement[] = [
      { wordId: 0, word: "BASE", position: p(0, 0, 0), direction: Direction.X }, // Z=0
      { wordId: 1, word: "LEG", position: p(0, 0, -1), direction: Direction.X }, // Z=-1
      { wordId: 2, word: "BL", position: p(0, 0, 0), direction: Direction.Z }, // Vertical fails
    ];
    const towerState = scorer.createTowerState(placements);
    const result = scorer.evaluateTower(towerState);

    expect(result.isValid).toBe(false);
    expect(result.score).toBe(0);
    expect(result.invalidReason).toContain('Vertical word "BL"');
    expect(result.invalidReason).toContain("only 1 valid intersections");
  });

  it("should invalidate a tower with a horizontal word (Z < 0) having less than 2 valid intersections", () => {
    const placements: WordPlacement[] = [
      { wordId: 0, word: "FOO", position: p(0, 0, 0), direction: Direction.X }, // Z=0
      { wordId: 1, word: "BAR", position: p(0, 0, -1), direction: Direction.X }, // Z=-1 <-- Target
      { wordId: 2, word: "BAZ", position: p(0, 0, -2), direction: Direction.X }, // Z=-2
      { wordId: 3, word: "FBB", position: p(0, 0, 0), direction: Direction.Z }, // Int FOO@F(inv), BAR@B(val), BAZ@B(val). OK
      { wordId: 4, word: "OAR", position: p(1, 0, 0), direction: Direction.Z }, // Int FOO@O(val), BAR@A(val), BAZ@A(val). OK
    ];
    // Tower has only 2 verticals now.
    const towerState = scorer.createTowerState(placements);
    const result = scorer.evaluateTower(towerState);

    expect(result.isValid).toBe(false);
    expect(result.score).toBe(0);
    expect(result.invalidReason).toContain('Horizontal word "BAR"'); // Should fail here now
    expect(result.invalidReason).toContain("only 1 valid intersections");
  });
});
