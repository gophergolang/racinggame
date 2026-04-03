import * as THREE from 'three';

export function buildTown(scene, texFactory) {
  const town = new THREE.Group();

  // === GROUND ===
  const groundGeo = new THREE.PlaneGeometry(500, 500);
  const groundMat = new THREE.MeshStandardMaterial({ map: texFactory.getTexture('grass'), roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  town.add(ground);

  // === ROAD NETWORK ===
  buildRoads(town, texFactory);

  // === BUILDINGS ===
  buildBuildings(town, texFactory);

  // === DECORATIONS ===
  buildDecorations(town, texFactory);

  // === PARK AREA ===
  buildPark(town, texFactory);

  scene.add(town);
  return town;
}

function buildRoads(town, tf) {
  const asphaltTex = tf.getTexture('asphalt');
  const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.85 });
  const sidewalkTex = tf.getTexture('sidewalk');
  const sidewalkMat = new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.8 });

  // Main roads forming a grid
  const roadWidth = 12;
  const sidewalkWidth = 3;

  // Horizontal roads
  const hRoadPositions = [-60, -20, 20, 60];
  for (const z of hRoadPositions) {
    // Road surface
    const roadGeo = new THREE.PlaneGeometry(250, roadWidth);
    const road = new THREE.Mesh(roadGeo, roadMat.clone());
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, z);
    road.receiveShadow = true;
    town.add(road);

    // Center line
    const lineGeo = new THREE.PlaneGeometry(250, 0.3);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf0e060 });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.04, z);
    town.add(centerLine);

    // Dashed lines
    for (let x = -120; x < 120; x += 6) {
      const dashGeo = new THREE.PlaneGeometry(3, 0.15);
      const dash = new THREE.Mesh(dashGeo, lineMat.clone());
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.04, z);
      town.add(dash);
    }

    // Sidewalks on both sides
    for (const side of [-1, 1]) {
      const swGeo = new THREE.BoxGeometry(250, 0.15, sidewalkWidth);
      const sw = new THREE.Mesh(swGeo, sidewalkMat.clone());
      sw.position.set(0, 0.08, z + side * (roadWidth / 2 + sidewalkWidth / 2));
      sw.receiveShadow = true;
      town.add(sw);
      // Curb
      const curbGeo = new THREE.BoxGeometry(250, 0.15, 0.3);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x999988 });
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(0, 0.1, z + side * (roadWidth / 2 + 0.15));
      town.add(curb);
    }
  }

  // Vertical roads
  const vRoadPositions = [-60, -20, 20, 60];
  for (const x of vRoadPositions) {
    const roadGeo = new THREE.PlaneGeometry(roadWidth, 250);
    const road = new THREE.Mesh(roadGeo, roadMat.clone());
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.03, 0);
    road.receiveShadow = true;
    town.add(road);

    // Center line
    const lineGeo = new THREE.PlaneGeometry(0.3, 250);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xf0e060 });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(x, 0.05, 0);
    town.add(centerLine);

    for (const side of [-1, 1]) {
      const swGeo = new THREE.BoxGeometry(sidewalkWidth, 0.15, 250);
      const sw = new THREE.Mesh(swGeo, sidewalkMat.clone());
      sw.position.set(x + side * (roadWidth / 2 + sidewalkWidth / 2), 0.08, 0);
      sw.receiveShadow = true;
      town.add(sw);
      const curbGeo = new THREE.BoxGeometry(0.3, 0.15, 250);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x999988 });
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(x + side * (roadWidth / 2 + 0.15), 0.1, 0);
      town.add(curb);
    }
  }

  // Outer ring road
  const ringRadius = 100;
  const ringSegments = 64;
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, ringRadius + roadWidth / 2, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, ringRadius - roadWidth / 2, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);
  const ringGeo = new THREE.ShapeGeometry(ringShape, ringSegments);
  const ringRoad = new THREE.Mesh(ringGeo, roadMat.clone());
  ringRoad.rotation.x = -Math.PI / 2;
  ringRoad.position.y = 0.025;
  ringRoad.receiveShadow = true;
  town.add(ringRoad);
}

function buildBuildings(town, tf) {
  const brickTex = tf.getTexture('brick');
  const windowTex = tf.getTexture('windowGrid');
  const roofTex = tf.getTexture('roof');
  const concreteTex = tf.getTexture('concrete');

  const buildingConfigs = [
    // Downtown tall buildings
    { x: -40, z: -40, w: 14, h: 30, d: 14, color: '#667788', type: 'office' },
    { x: -40, z: 0, w: 12, h: 25, d: 12, color: '#778899', type: 'office' },
    { x: -40, z: 40, w: 16, h: 35, d: 14, color: '#556677', type: 'office' },
    { x: 0, z: -40, w: 14, h: 28, d: 16, color: '#607080', type: 'office' },
    { x: 0, z: 0, w: 18, h: 40, d: 18, color: '#505868', type: 'office' },
    { x: 0, z: 40, w: 12, h: 22, d: 12, color: '#687888', type: 'office' },
    { x: 40, z: -40, w: 14, h: 20, d: 14, color: '#708090', type: 'office' },
    { x: 40, z: 0, w: 16, h: 32, d: 14, color: '#5a6a7a', type: 'office' },
    { x: 40, z: 40, w: 14, h: 26, d: 16, color: '#6a7a8a', type: 'office' },

    // Residential blocks
    { x: -80, z: -40, w: 10, h: 10, d: 12, color: '#aa6644', type: 'residential' },
    { x: -80, z: 0, w: 12, h: 8, d: 10, color: '#bb7755', type: 'residential' },
    { x: -80, z: 40, w: 10, h: 12, d: 14, color: '#996644', type: 'residential' },
    { x: 80, z: -40, w: 12, h: 9, d: 10, color: '#aa7755', type: 'residential' },
    { x: 80, z: 0, w: 10, h: 11, d: 12, color: '#bb8866', type: 'residential' },
    { x: 80, z: 40, w: 14, h: 8, d: 10, color: '#aa6655', type: 'residential' },

    // Shops along main roads
    { x: -10, z: -12, w: 8, h: 5, d: 8, color: '#ddccaa', type: 'shop', sign: 'CAFE' },
    { x: 10, z: -12, w: 8, h: 5, d: 8, color: '#ccbbaa', type: 'shop', sign: 'PIZZA' },
    { x: -10, z: 12, w: 8, h: 6, d: 8, color: '#bbaa99', type: 'shop', sign: 'BOOKS' },
    { x: 10, z: 12, w: 8, h: 5, d: 8, color: '#ddbb99', type: 'shop', sign: 'RECORDS' },

    // More buildings for density
    { x: -40, z: -80, w: 12, h: 15, d: 12, color: '#8899aa', type: 'office' },
    { x: 0, z: -80, w: 10, h: 12, d: 10, color: '#7788aa', type: 'office' },
    { x: 40, z: -80, w: 14, h: 18, d: 12, color: '#6688aa', type: 'office' },
    { x: -40, z: 80, w: 10, h: 14, d: 14, color: '#887766', type: 'residential' },
    { x: 0, z: 80, w: 12, h: 10, d: 10, color: '#998877', type: 'residential' },
    { x: 40, z: 80, w: 14, h: 12, d: 12, color: '#aa9988', type: 'residential' },
  ];

  for (const cfg of buildingConfigs) {
    const building = createBuilding(cfg, tf, brickTex, windowTex, roofTex, concreteTex);
    building.position.set(cfg.x, 0, cfg.z);
    town.add(building);
  }
}

function createBuilding(cfg, tf, brickTex, windowTex, roofTex, concreteTex) {
  const group = new THREE.Group();
  const { w, h, d, color, type } = cfg;

  // Main structure
  const mainGeo = new THREE.BoxGeometry(w, h, d);
  let mainMat;

  if (type === 'office') {
    // Glass and steel office buildings
    const mats = [];
    const wallMat = new THREE.MeshStandardMaterial({ map: windowTex.clone(), color: new THREE.Color(color), metalness: 0.4, roughness: 0.5 });
    const sideMat = new THREE.MeshStandardMaterial({ map: windowTex.clone(), color: new THREE.Color(color), metalness: 0.4, roughness: 0.5 });
    const topMat = new THREE.MeshStandardMaterial({ map: roofTex, color: 0x555555, roughness: 0.7 });
    // right, left, top, bottom, front, back
    mats.push(sideMat, sideMat.clone(), topMat, topMat.clone(), wallMat, wallMat.clone());
    const main = new THREE.Mesh(mainGeo, mats);
    main.position.y = h / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);

    // Roof detail
    const roofBoxGeo = new THREE.BoxGeometry(w * 0.6, 1.5, d * 0.4);
    const roofBoxMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
    const roofBox = new THREE.Mesh(roofBoxGeo, roofBoxMat);
    roofBox.position.y = h + 0.75;
    roofBox.castShadow = true;
    group.add(roofBox);

    // AC units on roof
    for (let i = 0; i < 3; i++) {
      const acGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
      const acMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
      const ac = new THREE.Mesh(acGeo, acMat);
      ac.position.set(-w * 0.3 + i * w * 0.3, h + 0.5, d * 0.3);
      ac.castShadow = true;
      group.add(ac);
    }

    // Ground floor entrance
    const doorGeo = new THREE.BoxGeometry(2.5, 3.5, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x88aacc, transparent: true, opacity: 0.6, metalness: 0.8, roughness: 0.1
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.75, d / 2 + 0.1);
    group.add(door);

  } else if (type === 'residential') {
    mainMat = new THREE.MeshStandardMaterial({ map: brickTex.clone(), color: new THREE.Color(color), roughness: 0.75 });
    const main = new THREE.Mesh(mainGeo, mainMat);
    main.position.y = h / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);

    // Pitched roof
    const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, 3, 4);
    const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, color: 0x884422, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 1.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Windows on residential
    addResidentialWindows(group, w, h, d);

    // Front door
    const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.15);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.8 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.1, d / 2 + 0.08);
    group.add(door);

    // Chimney
    const chimGeo = new THREE.BoxGeometry(1, 3, 1);
    const chimMat = new THREE.MeshStandardMaterial({ map: brickTex, color: 0x885544, roughness: 0.8 });
    const chim = new THREE.Mesh(chimGeo, chimMat);
    chim.position.set(w * 0.3, h + 2, 0);
    chim.castShadow = true;
    group.add(chim);

  } else if (type === 'shop') {
    mainMat = new THREE.MeshStandardMaterial({ map: concreteTex, color: new THREE.Color(color), roughness: 0.7 });
    const main = new THREE.Mesh(mainGeo, mainMat);
    main.position.y = h / 2;
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);

    // Shop front window
    const shopWindowGeo = new THREE.BoxGeometry(w * 0.7, h * 0.5, 0.15);
    const shopWindowMat = new THREE.MeshStandardMaterial({
      color: 0x88bbcc, transparent: true, opacity: 0.5, metalness: 0.7, roughness: 0.2
    });
    const shopWindow = new THREE.Mesh(shopWindowGeo, shopWindowMat);
    shopWindow.position.set(0, h * 0.35, d / 2 + 0.08);
    group.add(shopWindow);

    // Awning
    const awningGeo = new THREE.BoxGeometry(w * 0.8, 0.1, 1.5);
    const awningColors = [0xcc3333, 0x3366cc, 0x33aa33, 0xcc9933];
    const awningMat = new THREE.MeshStandardMaterial({ color: awningColors[Math.floor(Math.random() * awningColors.length)] });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(0, h * 0.65, d / 2 + 0.75);
    awning.castShadow = true;
    group.add(awning);

    // Sign
    if (cfg.sign) {
      const signTex = tf._storeSign(cfg.sign, awningMat.color.getStyle());
      const signGeo = new THREE.PlaneGeometry(w * 0.6, 1.2);
      const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x222222, emissiveIntensity: 0.3 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, h * 0.85, d / 2 + 0.1);
      group.add(sign);
    }

    // Flat roof with edge
    const edgeGeo = new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.y = h + 0.15;
    group.add(edge);
  }

  return group;
}

function addResidentialWindows(group, w, h, d) {
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88aacc, transparent: true, opacity: 0.5, metalness: 0.6, roughness: 0.3
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });

  const cols = Math.max(2, Math.floor(w / 3.5));
  const rows = Math.max(1, Math.floor(h / 3.5));
  const winW = 1.2, winH = 1.6;

  for (const face of ['front', 'back', 'left', 'right']) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat.clone());
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(winW + 0.2, winH + 0.2), frameMat.clone());

        const yPos = 2.5 + row * 3.2;
        if (yPos > h - 1) continue;

        if (face === 'front' || face === 'back') {
          const xPos = -w / 2 + (col + 1) * (w / (cols + 1));
          const zPos = (face === 'front' ? d / 2 : -d / 2) + (face === 'front' ? 0.12 : -0.12);
          frame.position.set(xPos, yPos, zPos);
          win.position.set(xPos, yPos, zPos + (face === 'front' ? 0.01 : -0.01));
          if (face === 'back') { win.rotation.y = Math.PI; frame.rotation.y = Math.PI; }
        } else {
          const actualCols = Math.max(2, Math.floor(d / 3.5));
          if (col >= actualCols) continue;
          const zPos = -d / 2 + (col + 1) * (d / (actualCols + 1));
          const xPos = (face === 'right' ? w / 2 : -w / 2) + (face === 'right' ? 0.12 : -0.12);
          frame.position.set(xPos, yPos, zPos);
          win.position.set(xPos, yPos, zPos);
          frame.rotation.y = face === 'right' ? Math.PI / 2 : -Math.PI / 2;
          win.rotation.y = face === 'right' ? Math.PI / 2 : -Math.PI / 2;
        }

        // Random lit/unlit
        if (Math.random() > 0.4) {
          win.material = win.material.clone();
          win.material.emissive = new THREE.Color(Math.random() > 0.5 ? 0xffe8a0 : 0xaaccee);
          win.material.emissiveIntensity = 0.3;
        }

        group.add(frame);
        group.add(win);
      }
    }
  }
}

function buildDecorations(town, tf) {
  // Street lights along roads
  const lampPositions = [];
  for (const z of [-60, -20, 20, 60]) {
    for (let x = -100; x <= 100; x += 20) {
      lampPositions.push({ x, z: z + 9 });
      lampPositions.push({ x, z: z - 9 });
    }
  }
  for (const z of [-80, -50, -30, -10, 10, 30, 50, 80]) {
    for (const x of [-60, 60]) {
      lampPositions.push({ x: x + 9, z });
      lampPositions.push({ x: x - 9, z });
    }
  }

  for (const pos of lampPositions) {
    const lamp = createStreetLight();
    lamp.position.set(pos.x, 0, pos.z);
    town.add(lamp);
  }

  // Trees scattered around
  const treePositions = [];
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * 90;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    // Avoid roads
    const onRoad = [-60, -20, 20, 60].some(rz => Math.abs(z - rz) < 10) ||
                   [-60, -20, 20, 60].some(rx => Math.abs(x - rx) < 10);
    if (!onRoad) {
      treePositions.push({ x, z });
    }
  }

  for (const pos of treePositions) {
    const tree = createTree();
    tree.position.set(pos.x, 0, pos.z);
    town.add(tree);
  }

  // Benches near parks
  for (let i = 0; i < 12; i++) {
    const bench = createBench();
    const angle = Math.random() * Math.PI * 2;
    bench.position.set(
      Math.cos(angle) * (25 + Math.random() * 10),
      0,
      Math.sin(angle) * (25 + Math.random() * 10)
    );
    bench.rotation.y = angle + Math.PI / 2;
    town.add(bench);
  }

  // Fire hydrants
  for (let i = 0; i < 20; i++) {
    const hydrant = createFireHydrant();
    const angle = Math.random() * Math.PI * 2;
    const r = 20 + Math.random() * 80;
    hydrant.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    town.add(hydrant);
  }

  // Trash cans
  for (let i = 0; i < 15; i++) {
    const trash = createTrashCan();
    const angle = Math.random() * Math.PI * 2;
    const r = 15 + Math.random() * 80;
    trash.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    town.add(trash);
  }
}

function createStreetLight() {
  const group = new THREE.Group();

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 3;
  pole.castShadow = true;
  group.add(pole);

  // Arm
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 2, 6);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(1, 5.8, 0);
  group.add(arm);

  // Light housing
  const housingGeo = new THREE.BoxGeometry(0.8, 0.15, 0.4);
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
  const housing = new THREE.Mesh(housingGeo, housingMat);
  housing.position.set(1.8, 5.7, 0);
  group.add(housing);

  // Light bulb
  const bulbGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffeeaa, emissiveIntensity: 0.8 });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(1.8, 5.55, 0);
  group.add(bulb);

  // Base
  const baseGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.3, 8);
  const base = new THREE.Mesh(baseGeo, poleMat);
  base.position.y = 0.15;
  group.add(base);

  return group;
}

function createTree() {
  const group = new THREE.Group();
  const height = 4 + Math.random() * 6;

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, height * 0.5, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = height * 0.25;
  trunk.castShadow = true;
  group.add(trunk);

  // Foliage layers
  const foliageColors = [0x2d5a1e, 0x3a7a2e, 0x2a6a20];
  for (let i = 0; i < 3; i++) {
    const r = (3 - i) * 0.8 + Math.random() * 0.5;
    const fGeo = new THREE.SphereGeometry(r, 8, 8);
    const fMat = new THREE.MeshStandardMaterial({ color: foliageColors[i % 3], roughness: 0.85 });
    const foliage = new THREE.Mesh(fGeo, fMat);
    foliage.position.y = height * 0.45 + i * 1.2;
    foliage.castShadow = true;
    group.add(foliage);
  }

  return group;
}

function createBench() {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.8 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });

  // Seat
  const seatGeo = new THREE.BoxGeometry(1.5, 0.08, 0.5);
  const seat = new THREE.Mesh(seatGeo, woodMat);
  seat.position.y = 0.5;
  group.add(seat);

  // Back
  const backGeo = new THREE.BoxGeometry(1.5, 0.5, 0.08);
  const back = new THREE.Mesh(backGeo, woodMat);
  back.position.set(0, 0.75, -0.22);
  back.rotation.x = -0.1;
  group.add(back);

  // Legs
  for (const x of [-0.6, 0.6]) {
    const legGeo = new THREE.BoxGeometry(0.06, 0.5, 0.5);
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(x, 0.25, 0);
    group.add(leg);
  }

  return group;
}

function createFireHydrant() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 });

  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.6, 8);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = 0.3;
  group.add(body);

  const topGeo = new THREE.SphereGeometry(0.16, 8, 8);
  const top = new THREE.Mesh(topGeo, mat);
  top.position.y = 0.65;
  group.add(top);

  // Side nozzles
  for (const side of [-1, 1]) {
    const nozGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6);
    const noz = new THREE.Mesh(nozGeo, mat);
    noz.rotation.z = Math.PI / 2;
    noz.position.set(side * 0.2, 0.4, 0);
    group.add(noz);
  }

  return group;
}

function createTrashCan() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x336633, roughness: 0.7 });

  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 8);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = 0.4;
  group.add(body);

  const lidGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 8);
  const lid = new THREE.Mesh(lidGeo, mat);
  lid.position.y = 0.83;
  group.add(lid);

  return group;
}

function buildPark(town, tf) {
  // Central park area
  const parkGeo = new THREE.CircleGeometry(15, 32);
  const parkMat = new THREE.MeshStandardMaterial({ map: tf.getTexture('grass'), color: 0x44aa44 });
  const park = new THREE.Mesh(parkGeo, parkMat);
  park.rotation.x = -Math.PI / 2;
  park.position.set(0, 0.02, 0);
  town.add(park);

  // Fountain in center
  const fountain = createFountain(tf);
  fountain.position.set(0, 0, 0);
  town.add(fountain);

  // Park path
  const pathGeo = new THREE.RingGeometry(5, 6, 32);
  const pathMat = new THREE.MeshStandardMaterial({ map: tf.getTexture('sidewalk'), roughness: 0.8 });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.03;
  town.add(path);
}

function createFountain(tf) {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.6 });

  // Base pool
  const poolGeo = new THREE.CylinderGeometry(3, 3.5, 0.6, 16);
  const pool = new THREE.Mesh(poolGeo, stoneMat);
  pool.position.y = 0.3;
  group.add(pool);

  // Water surface
  const waterGeo = new THREE.CircleGeometry(2.8, 16);
  const waterMat = new THREE.MeshStandardMaterial({
    map: tf.getTexture('water'), color: 0x4488aa, transparent: true, opacity: 0.7
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.55;
  group.add(water);

  // Center column
  const colGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
  const col = new THREE.Mesh(colGeo, stoneMat);
  col.position.y = 1.5;
  group.add(col);

  // Top bowl
  const bowlGeo = new THREE.CylinderGeometry(1, 0.6, 0.4, 8);
  const bowl = new THREE.Mesh(bowlGeo, stoneMat);
  bowl.position.y = 2.7;
  group.add(bowl);

  return group;
}
