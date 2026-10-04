import * as THREE from "three";
import type { StatKey } from "@/core/types";
import { treeScaleForLevel, treeStageIndexForLevel } from "./growth";

export type GardenState = {
  levels: Record<StatKey, number>;
  neglect: Record<StatKey, boolean>;
  danger: boolean;
  streak: number;
};
export const TREE_POSITIONS: Record<StatKey, [number, number, number]> = {
  mind: [-1.35, .24, -.55], health: [1.35, .24, -.65], spirit: [.35, .24, 1.12],
};

function random(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const vector = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .93, metalness: 0 });

/** Geometry is deterministic; changing level never reshuffles the landscape. */
export function createGarden(state: GardenState) {
  const group = new THREE.Group();
  const rng = random(1781);
  const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
  const leafGeometry = new THREE.SphereGeometry(1, 7, 5);
  const twigGeometry = new THREE.CylinderGeometry(.55, 1, 1, 7);
  const brown = material("#725038");
  const rockMaterial = material("#b9ac91");
  const soilMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });

  function addMesh(geometry: THREE.BufferGeometry, mat: THREE.Material, parent = group) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  }
  function branch(parent: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, radius: number) {
    const mesh = addMesh(twigGeometry, brown, parent);
    mesh.position.copy(from).lerp(to, .5);
    mesh.scale.set(radius, from.distanceTo(to), radius);
    mesh.quaternion.setFromUnitVectors(vector(0, 1, 0), to.clone().sub(from).normalize());
  }
  function curvedBranch(parent: THREE.Group, points: THREE.Vector3[], radius: number) {
    const curve = new THREE.CatmullRomCurve3(points);
    return addMesh(new THREE.TubeGeometry(curve, 12, radius, 6, false), brown, parent);
  }
  function instances(geometry: THREE.BufferGeometry, mat: THREE.Material, count: number, parent = group) {
    const mesh = new THREE.InstancedMesh(geometry, mat, count);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  }
  const dummy = new THREE.Object3D();
  function instance(mesh: THREE.InstancedMesh, i: number, position: THREE.Vector3, scale: THREE.Vector3, rotation = vector(0, 0, 0), color?: THREE.Color) {
    dummy.position.copy(position); dummy.scale.copy(scale); dummy.rotation.set(rotation.x, rotation.y, rotation.z); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (color) mesh.setColorAt(i, color);
  }
  const colorVariation = (color: THREE.Color, rand: () => number) => color.clone().multiplyScalar(.72 + rand() * .5);

  // One rounded island, modeled as concentric rings, rather than disconnected floating pots.
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const segments = 112;
  const rings = [0, .2, .4, .6, .8, .95, 1, 1.02, 1.015, .98, .91];
  const heights = [.27, .27, .26, .24, .2, .15, .08, -.02, -.18, -.32, -.39];
  for (let j = 0; j < rings.length; j++) {
    for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2;
      const irregular = 1 + .035 * Math.sin(a * 5) + .023 * Math.sin(a * 9 + .6);
      positions.push(Math.cos(a) * 3.2 * rings[j] * irregular,
        heights[j] + (j > 3 ? Math.sin(a * 7 + rings[j] * 8) * .018 : 0),
        Math.sin(a) * 2.35 * rings[j] * irregular);
      const c = new THREE.Color(j < 6 ? "#8d9863" : "#967252").multiplyScalar(.94 + .05 * Math.sin(Math.cos(a) * rings[j] * 9) * Math.cos(Math.sin(a) * rings[j] * 7));
      colors.push(c.r, c.g, c.b);
      if (j) {
        const n = (i + 1) % segments, p = (j - 1) * segments, q = j * segments;
        indices.push(p + i, p + n, q + i, p + n, q + n, q + i);
      }
    }
  }
  const islandGeo = new THREE.BufferGeometry();
  islandGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  islandGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  islandGeo.setIndex(indices); islandGeo.computeVertexNormals();
  addMesh(islandGeo, soilMaterial);

  // Stepping stones wind between, never through, the three planting positions.
  const stones = instances(rockGeometry, rockMaterial, 11);
  for (let i = 0; i < 11; i++) {
    const z = 1.9 - i * .31;
    instance(stones, i, vector(-1 + Math.sin(i * .44) * .4, .27, z), vector(.25 + rng() * .09, .065, .17 + rng() * .06), vector(0, rng() * 3, 0), new THREE.Color("#d4c3a2").multiplyScalar(.8 + rng() * .3));
  }
  const rocks = instances(rockGeometry, rockMaterial, 55);
  for (let i = 0; i < 55; i++) {
    const a = rng() * Math.PI * 2, r = .8 + rng() * .15, s = .09 + rng() * .15;
    instance(rocks, i, vector(Math.cos(a) * 3.1 * r, .17, Math.sin(a) * 2.25 * r), vector(s * 1.3, s * .6, s), vector(rng(), rng() * 5, rng()), new THREE.Color("#a99a83").multiplyScalar(.8 + rng() * .4));
  }
  // Grass blades are batched into one draw call.
  const grass = instances(leafGeometry, material("#73884e"), 900);
  for (let i = 0; i < 900; i++) {
    const a = rng() * Math.PI * 2, r = .4 + rng() * .58;
    const x = Math.cos(a) * 3.05 * r, z = Math.sin(a) * 2.2 * r;
    const nearPlant = Object.values(TREE_POSITIONS).some(([px, , pz]) => Math.hypot(x - px, z - pz) < .48);
    instance(grass, i, vector(x, .25 + rng() * .025, z), nearPlant ? vector(0, 0, 0) : vector(.014, .065 + rng() * .10, .022), vector((rng() - .5) * .9, a, (rng() - .5) * .7));
  }
  // Flowers retain the existing streak meaning: one small cluster per day, capped at seven.
  const flowers = new THREE.Group(); group.add(flowers);
  for (let i = 0; i < Math.min(7, state.streak); i++) {
    const a = .15 + i * .42, x = Math.cos(a) * 2.65, z = Math.sin(a) * 1.85;
    branch(flowers, vector(x, .21, z), vector(x, .44, z), .013);
    for (let petal = 0; petal < 5; petal++) {
      const angle = petal / 5 * Math.PI * 2;
      const mesh = addMesh(leafGeometry, material(state.danger ? "#bda779" : "#f6edcc"), flowers);
      mesh.position.set(x + Math.cos(angle) * .055, .44, z + Math.sin(angle) * .055); mesh.scale.set(.046, .018, .046);
    }
    const center = addMesh(leafGeometry, material("#e7b640"), flowers);
    center.position.set(x, .452, z); center.scale.setScalar(.032);
  }

  for (const stat of ["mind", "health", "spirit"] as const) {
    const level = state.levels[stat], stage = treeStageIndexForLevel(level);
    const tree = new THREE.Group(); tree.position.set(...TREE_POSITIONS[stat]); group.add(tree);
    const rand = random(stat === "mind" ? 881 : stat === "health" ? 332 : 656);
    const leafColor = new THREE.Color(state.danger ? "#ba9b52" : state.neglect[stat] ? "#a08560" : { mind: "#648e9f", health: "#d8883f", spirit: "#88a463" }[stat]);
    const leafMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: .88 });

    if (stage === 0) {
      const mound = addMesh(rockGeometry, material("#a17b55"), tree); mound.position.y = .065; mound.scale.set(.31, .11, .25);
      const seed = addMesh(leafGeometry, material("#d3b58a"), tree); seed.position.y = .19; seed.scale.set(.10, .09, .14);
    } else if (stage === 1) {
      const height = .29 + level * .10;
      branch(tree, vector(0, 0, 0), vector(.04, height, 0), .028);
      const leaves = instances(leafGeometry, leafMat, 3, tree);
      for (let i = 0; i < 3; i++) instance(leaves, i, vector((i - 1) * .14, height - Math.abs(i - 1) * .07, 0), vector(.16, .042, .08), vector(0, i * .6, (i - 1) * .4), leafColor);
    } else {
      const growth = treeScaleForLevel(level);
      tree.scale.setScalar(growth);
      // Roots spread with maturity; the trunk stays flared and grounded at every size.
      const rootCount = stage >= 6 ? 8 : 5;
      for (let i = 0; i < rootCount; i++) {
        const a = i / rootCount * Math.PI * 2;
        curvedBranch(tree, [vector(0, .25, 0), vector(Math.cos(a) * .2, .08, Math.sin(a) * .2), vector(Math.cos(a) * .47, .015, Math.sin(a) * .47)], .05);
      }
      if (stat === "mind") {
        branch(tree, vector(0, 0, 0), vector(0, 4.3, 0), .16);
        const leaves = instances(leafGeometry, leafMat, 2350, tree);
        let cursor = 0;
        // Radial boughs taper towards the apex. Separate needles create a soft, irregular silhouette.
        for (let tier = 0; tier < 10; tier++) {
          const y = .9 + tier * .34, reach = 1.19 * (1 - tier / 11);
          for (let b = 0; b < 8; b++) {
            const a = b / 8 * Math.PI * 2 + tier * .62;
            const end = vector(Math.cos(a) * reach, y - .17, Math.sin(a) * reach);
            branch(tree, vector(0, y + .15, 0), end, .035 * (1 - tier / 13));
            const perBough = tier < 7 ? 32 : 23;
            for (let l = 0; l < perBough && cursor < 2350; l++) {
              const t = rand(), spread = (.035 + t * .22) * (1 - tier / 14);
              const p = vector(Math.cos(a) * reach * t + (rand() - .5) * spread * 2,
                y + .16 * (1 - t) - .19 * t + rand() * .14,
                Math.sin(a) * reach * t + (rand() - .5) * spread * 2);
              instance(leaves, cursor++, p, vector(.055 + rand() * .045, .04 + rand() * .025, .16 + rand() * .07), vector(.2 + rand() * .4, -a + Math.PI / 2 + (rand() - .5), (rand() - .5) * .6), colorVariation(leafColor, rand));
            }
          }
        }
        leaves.count = cursor;
      } else if (stat === "health") {
        curvedBranch(tree, [vector(0, 0, 0), vector(-.08, .9, 0), vector(.05, 1.65, .05), vector(-.12, 2.7, .06)], .13);
        const leaves = instances(leafGeometry, leafMat, 2200, tree);
        let cursor = 0;
        for (let b = 0; b < 17; b++) {
          const a = b * 2.399, r = .5 + rand() * .5;
          const center = vector(Math.cos(a) * r, 2.25 + rand() * .95, Math.sin(a) * r);
          curvedBranch(tree, [vector(0, .7 + rand() * .45, 0), vector(center.x * .45, 1.75, center.z * .4), center], .034 + rand() * .035);
          for (let l = 0; l < 128; l++) {
            const theta = rand() * Math.PI * 2, u = rand() * 2 - 1, radius = Math.cbrt(rand()) * .53;
            const p = center.clone().add(vector(Math.sqrt(1 - u * u) * Math.cos(theta) * radius, u * radius * .75, Math.sqrt(1 - u * u) * Math.sin(theta) * radius));
            instance(leaves, cursor++, p, vector(.075 + rand() * .025, .025, .11 + rand() * .025), vector(rand(), rand() * 6.28, rand() * 1.2), colorVariation(leafColor, rand));
          }
        }
        leaves.count = cursor;
      } else {
        curvedBranch(tree, [vector(0, 0, 0), vector(.13, .8, -.06), vector(-.13, 1.5, 0), vector(.04, 2.45, .06)], .14);
        const leaves = instances(leafGeometry, leafMat, 2450, tree);
        let cursor = 0;
        for (let b = 0; b < 65; b++) {
          const a = b * 2.399, r = .38 + rand() * .78;
          const top = 2.3 + rand() * .35, bottom = .45 + rand() * .7;
          const start = vector(.02, 1.65, 0), crest = vector(Math.cos(a) * r * .65, top, Math.sin(a) * r * .65);
          const end = vector(Math.cos(a) * r, bottom, Math.sin(a) * r);
          if (b % 5 === 0) curvedBranch(tree, [start, crest, end], .012);
          for (let l = 0; l < 36; l++) {
            const t = l / 35;
            const p = vector(Math.cos(a) * r * (.6 + .4 * Math.sin(t * Math.PI / 2)), top - t * (top - bottom), Math.sin(a) * r * (.6 + .4 * Math.sin(t * Math.PI / 2)));
            p.x += (rand() - .5) * .12; p.z += (rand() - .5) * .12;
            instance(leaves, cursor++, p, vector(.045, .13 + rand() * .05, .032), vector((rand() - .5) * .4, a, (rand() - .5) * .7), colorVariation(leafColor, rand));
          }
        }
        leaves.count = cursor;
      }
    }
    if (state.neglect[stat] || state.danger) {
      const fallen = instances(leafGeometry, material("#b58a56"), 18, tree);
      for (let i = 0; i < 18; i++) instance(fallen, i, vector((rand() - .5) * .85, .04, (rand() - .5) * .65), vector(.055, .01, .035), vector(0, rand() * 6, 0));
    }
  }

  return group;
}

export function disposeGarden(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
      if (object instanceof THREE.InstancedMesh) object.dispose();
    }
  });
  geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose());
}
