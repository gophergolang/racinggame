import * as THREE from 'three';

// Car definitions and 3D model builder
export const CAR_DEFS = [
  {
    id: 'sedan',
    name: 'Apex Sedan',
    color: '#cc2222',
    stats: { speed: 160, accel: 7.5, handling: 7 },
    desc: 'Balanced all-rounder'
  },
  {
    id: 'hatchback',
    name: 'Zippy GTi',
    color: '#2266cc',
    stats: { speed: 140, accel: 8.5, handling: 9 },
    desc: 'Nimble and quick'
  },
  {
    id: 'sports',
    name: 'Venom RS',
    color: '#ccaa00',
    stats: { speed: 200, accel: 9, handling: 6 },
    desc: 'Raw speed machine'
  }
];

export function buildCarModel(carDef, texFactory) {
  const group = new THREE.Group();
  const paintTex = texFactory._carPaint(carDef.color);
  const paintColor = new THREE.Color(carDef.color);

  if (carDef.id === 'sedan') {
    return buildSedan(group, paintColor, paintTex, texFactory);
  } else if (carDef.id === 'hatchback') {
    return buildHatchback(group, paintColor, paintTex, texFactory);
  } else {
    return buildSports(group, paintColor, paintTex, texFactory);
  }
}

function buildSedan(group, color, paintTex, tf) {
  // --- Body (lower) ---
  const bodyGeo = new THREE.BoxGeometry(2.0, 0.6, 4.4);
  const bodyMat = new THREE.MeshStandardMaterial({ color, map: paintTex, metalness: 0.6, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);

  // Rounded front
  const frontGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.0, 8, 1, false, 0, Math.PI);
  const front = new THREE.Mesh(frontGeo, bodyMat);
  front.rotation.z = Math.PI / 2;
  front.rotation.y = Math.PI / 2;
  front.position.set(0, 0.45, -2.2);
  group.add(front);

  // --- Cabin ---
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.85, 0);
  cabinShape.lineTo(-0.7, 0.55);
  cabinShape.lineTo(0.7, 0.55);
  cabinShape.lineTo(0.85, 0);
  cabinShape.lineTo(-0.85, 0);
  const cabinSettings = { depth: 2.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 };
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, cabinSettings);
  const cabinMat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.75, -1.1);
  cabin.castShadow = true;
  group.add(cabin);

  // --- Windows ---
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd, transparent: true, opacity: 0.5, metalness: 0.9, roughness: 0.1
  });

  // Windshield
  const wsGeo = new THREE.PlaneGeometry(1.5, 0.6);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(0, 1.05, -1.08);
  ws.rotation.x = -0.25;
  group.add(ws);

  // Rear window
  const rwGeo = new THREE.PlaneGeometry(1.4, 0.5);
  const rw = new THREE.Mesh(rwGeo, glassMat);
  rw.position.set(0, 1.05, 1.08);
  rw.rotation.x = 0.25;
  rw.rotation.y = Math.PI;
  group.add(rw);

  // Side windows
  for (const side of [-1, 1]) {
    const swGeo = new THREE.PlaneGeometry(2.0, 0.45);
    const sw = new THREE.Mesh(swGeo, glassMat);
    sw.position.set(side * 0.88, 1.0, 0);
    sw.rotation.y = side * Math.PI / 2;
    group.add(sw);
  }

  // --- Headlights ---
  addHeadlights(group, 0.7, 0.5, -2.18, 0.2, 0.15);

  // --- Taillights ---
  addTaillights(group, 0.75, 0.5, 2.18, 0.25, 0.12);

  // --- Wheels ---
  addWheels(group, tf, 0.82, 0.3, [-1.5, 1.4], 0.3);

  // --- Grille ---
  const grilleGeo = new THREE.PlaneGeometry(1.2, 0.3);
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(0, 0.4, -2.21);
  group.add(grille);

  // --- Side mirrors ---
  for (const side of [-1, 1]) {
    const mirrorGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
    const mirror = new THREE.Mesh(mirrorGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
    mirror.position.set(side * 1.1, 0.95, -0.8);
    group.add(mirror);
  }

  // --- Bumpers ---
  addBumpers(group, color, 2.0, 0.12, 2.22);

  // --- Exhaust pipe ---
  const exhaustGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8);
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
  const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(-0.5, 0.22, 2.3);
  group.add(exhaust);

  // --- License plate ---
  addLicensePlate(group, 0, 0.35, 2.22);

  group.castShadow = true;
  return group;
}

function buildHatchback(group, color, paintTex, tf) {
  // --- Body (lower, shorter) ---
  const bodyGeo = new THREE.BoxGeometry(1.8, 0.55, 3.6);
  const bodyMat = new THREE.MeshStandardMaterial({ color, map: paintTex, metalness: 0.5, roughness: 0.35 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.42;
  body.castShadow = true;
  group.add(body);

  // Rounded front
  const frontGeo = new THREE.SphereGeometry(0.28, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const frontL = new THREE.Mesh(frontGeo, bodyMat);
  frontL.position.set(-0.6, 0.42, -1.8);
  frontL.rotation.x = -Math.PI / 2;
  group.add(frontL);
  const frontR = frontL.clone();
  frontR.position.x = 0.6;
  group.add(frontR);

  // --- Cabin (taller, shorter rear) ---
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.78, 0);
  cabinShape.lineTo(-0.65, 0.6);
  cabinShape.lineTo(0.65, 0.6);
  cabinShape.lineTo(0.78, 0);
  cabinShape.lineTo(-0.78, 0);
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, { depth: 1.8, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
  const cabinMat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.4 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.7, -0.8);
  cabin.castShadow = true;
  group.add(cabin);

  // --- Windows ---
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd, transparent: true, opacity: 0.5, metalness: 0.9, roughness: 0.1
  });

  const wsGeo = new THREE.PlaneGeometry(1.35, 0.55);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(0, 1.0, -0.78);
  ws.rotation.x = -0.3;
  group.add(ws);

  const rwGeo = new THREE.PlaneGeometry(1.3, 0.5);
  const rw = new THREE.Mesh(rwGeo, glassMat);
  rw.position.set(0, 1.0, 0.98);
  rw.rotation.x = 0.15;
  rw.rotation.y = Math.PI;
  group.add(rw);

  for (const side of [-1, 1]) {
    const swGeo = new THREE.PlaneGeometry(1.6, 0.45);
    const sw = new THREE.Mesh(swGeo, glassMat);
    sw.position.set(side * 0.8, 0.97, 0.1);
    sw.rotation.y = side * Math.PI / 2;
    group.add(sw);
  }

  // --- Headlights ---
  addHeadlights(group, 0.65, 0.45, -1.81, 0.18, 0.13);

  // --- Taillights ---
  addTaillights(group, 0.65, 0.5, 1.81, 0.22, 0.15);

  // --- Wheels ---
  addWheels(group, tf, 0.72, 0.28, [-1.2, 1.1], 0.28);

  // --- Grille ---
  const grilleGeo = new THREE.PlaneGeometry(1.0, 0.25);
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.3 });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(0, 0.38, -1.81);
  group.add(grille);

  // --- Roof rails ---
  for (const side of [-1, 1]) {
    const railGeo = new THREE.BoxGeometry(0.04, 0.04, 1.6);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(side * 0.6, 1.32, 0);
    group.add(rail);
  }

  addBumpers(group, color, 1.8, 0.1, 1.82);
  addLicensePlate(group, 0, 0.3, 1.82);

  group.castShadow = true;
  return group;
}

function buildSports(group, color, paintTex, tf) {
  // --- Body (low, wide, long) ---
  const bodyGeo = new THREE.BoxGeometry(2.1, 0.45, 4.6);
  const bodyMat = new THREE.MeshStandardMaterial({ color, map: paintTex, metalness: 0.7, roughness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);

  // Aerodynamic front wedge
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-1.05, 0);
  noseShape.lineTo(-0.8, -0.5);
  noseShape.lineTo(0.8, -0.5);
  noseShape.lineTo(1.05, 0);
  noseShape.lineTo(-1.05, 0);
  const noseGeo = new THREE.ExtrudeGeometry(noseShape, { depth: 0.45, bevelEnabled: false });
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.57, -2.3);
  group.add(nose);

  // --- Cabin (very low, set back) ---
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.85, 0);
  cabinShape.lineTo(-0.7, 0.4);
  cabinShape.lineTo(0.7, 0.4);
  cabinShape.lineTo(0.85, 0);
  cabinShape.lineTo(-0.85, 0);
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
  const cabinMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.25 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.57, -0.6);
  cabin.castShadow = true;
  group.add(cabin);

  // --- Windows ---
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd, transparent: true, opacity: 0.45, metalness: 0.9, roughness: 0.1
  });

  const wsGeo = new THREE.PlaneGeometry(1.45, 0.45);
  const ws = new THREE.Mesh(wsGeo, glassMat);
  ws.position.set(0, 0.78, -0.58);
  ws.rotation.x = -0.35;
  group.add(ws);

  const rwGeo = new THREE.PlaneGeometry(1.35, 0.35);
  const rw = new THREE.Mesh(rwGeo, glassMat);
  rw.position.set(0, 0.78, 0.98);
  rw.rotation.x = 0.2;
  rw.rotation.y = Math.PI;
  group.add(rw);

  for (const side of [-1, 1]) {
    const swGeo = new THREE.PlaneGeometry(1.4, 0.35);
    const sw = new THREE.Mesh(swGeo, glassMat);
    sw.position.set(side * 0.88, 0.78, 0.2);
    sw.rotation.y = side * Math.PI / 2;
    group.add(sw);
  }

  // --- Headlights (aggressive, angular) ---
  for (const side of [-1, 1]) {
    const hlGeo = new THREE.BoxGeometry(0.35, 0.08, 0.12);
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffcc, emissiveIntensity: 0.8 });
    const hl = new THREE.Mesh(hlGeo, hlMat);
    hl.position.set(side * 0.7, 0.4, -2.31);
    group.add(hl);
  }

  // --- Taillights (wide strip) ---
  const tlGeo = new THREE.BoxGeometry(1.8, 0.06, 0.08);
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 });
  const tl = new THREE.Mesh(tlGeo, tlMat);
  tl.position.set(0, 0.45, 2.31);
  group.add(tl);

  // --- Wheels (wider) ---
  addWheels(group, tf, 0.88, 0.3, [-1.5, 1.5], 0.32);

  // --- Air intakes ---
  for (const side of [-1, 1]) {
    const intakeGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const intakeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const intake = new THREE.Mesh(intakeGeo, intakeMat);
    intake.position.set(side * 0.6, 0.3, -2.32);
    group.add(intake);
  }

  // --- Rear spoiler ---
  const spoilerGeo = new THREE.BoxGeometry(1.8, 0.04, 0.3);
  const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
  const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
  spoiler.position.set(0, 0.85, 2.1);
  group.add(spoiler);
  // Spoiler supports
  for (const side of [-1, 1]) {
    const supGeo = new THREE.BoxGeometry(0.05, 0.25, 0.08);
    const sup = new THREE.Mesh(supGeo, spoilerMat);
    sup.position.set(side * 0.7, 0.72, 2.1);
    group.add(sup);
  }

  // --- Side skirts ---
  for (const side of [-1, 1]) {
    const skirtGeo = new THREE.BoxGeometry(0.08, 0.12, 4.2);
    const skirt = new THREE.Mesh(skirtGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
    skirt.position.set(side * 1.08, 0.2, 0);
    group.add(skirt);
  }

  // --- Dual exhaust ---
  for (const side of [-1, 1]) {
    const exGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.2, 8);
    const exMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9, roughness: 0.2 });
    const ex = new THREE.Mesh(exGeo, exMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(side * 0.4, 0.22, 2.4);
    group.add(ex);
  }

  addBumpers(group, color, 2.1, 0.1, 2.32);
  addLicensePlate(group, 0, 0.28, 2.33);

  group.castShadow = true;
  return group;
}

function addHeadlights(group, xOff, y, z, w, h) {
  for (const side of [-1, 1]) {
    // Housing
    const housingGeo = new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.08);
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.set(side * xOff, y, z);
    group.add(housing);
    // Lens
    const lensGeo = new THREE.BoxGeometry(w, h, 0.06);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffdd, emissiveIntensity: 0.7,
      transparent: true, opacity: 0.9
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(side * xOff, y, z - 0.02);
    group.add(lens);
  }
}

function addTaillights(group, xOff, y, z, w, h) {
  for (const side of [-1, 1]) {
    const tlGeo = new THREE.BoxGeometry(w, h, 0.06);
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.9
    });
    const tl = new THREE.Mesh(tlGeo, tlMat);
    tl.position.set(side * xOff, y, z);
    group.add(tl);
  }
}

function addWheels(group, tf, xOff, y, zPositions, radius) {
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });

  const wheelWidth = 0.18;

  for (const z of zPositions) {
    for (const side of [-1, 1]) {
      const wheelGroup = new THREE.Group();

      // Tire
      const tireGeo = new THREE.TorusGeometry(radius, radius * 0.35, 12, 24);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.y = Math.PI / 2;
      wheelGroup.add(tire);

      // Rim
      const rimGeo = new THREE.CylinderGeometry(radius * 0.7, radius * 0.7, wheelWidth, 16);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Hub cap
      const hubGeo = new THREE.CylinderGeometry(radius * 0.2, radius * 0.2, wheelWidth + 0.02, 8);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      // Spokes
      for (let i = 0; i < 5; i++) {
        const spokeGeo = new THREE.BoxGeometry(wheelWidth * 0.6, radius * 0.06, radius * 0.9);
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        spoke.rotation.x = (i / 5) * Math.PI;
        wheelGroup.add(spoke);
      }

      // Brake disc visible through spokes
      const discGeo = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, 0.03, 16);
      const discMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.7, roughness: 0.4 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.z = Math.PI / 2;
      wheelGroup.add(disc);

      wheelGroup.position.set(side * xOff, y, z);
      wheelGroup.castShadow = true;
      group.add(wheelGroup);
    }
  }
}

function addBumpers(group, color, width, height, zAbs) {
  const bumpMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.5 });
  // Front
  const fbGeo = new THREE.BoxGeometry(width, height, 0.1);
  const fb = new THREE.Mesh(fbGeo, bumpMat);
  fb.position.set(0, 0.18, -zAbs);
  group.add(fb);
  // Rear
  const rb = fb.clone();
  rb.position.z = zAbs;
  group.add(rb);
}

function addLicensePlate(group, x, y, z) {
  const plateGeo = new THREE.BoxGeometry(0.45, 0.15, 0.02);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xeeeecc });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(x, y, z);
  group.add(plate);
}
