import * as THREE from 'three';

// Track definitions - progressively harder paths around the town
export const TRACK_DEFS = [
  {
    id: 'city_loop',
    name: 'City Loop',
    difficulty: 'Easy',
    laps: 3,
    desc: 'Wide streets, gentle turns',
    // Waypoints define the track path (x, z coordinates)
    waypoints: [
      { x: 0, z: -90 },
      { x: 40, z: -90 },
      { x: 80, z: -70 },
      { x: 90, z: -40 },
      { x: 90, z: 0 },
      { x: 90, z: 40 },
      { x: 80, z: 70 },
      { x: 40, z: 90 },
      { x: 0, z: 90 },
      { x: -40, z: 90 },
      { x: -80, z: 70 },
      { x: -90, z: 40 },
      { x: -90, z: 0 },
      { x: -90, z: -40 },
      { x: -80, z: -70 },
      { x: -40, z: -90 },
    ],
    roadWidth: 14,
    aiSpeedFactor: 0.85,
    startPos: { x: -20, z: -90 },
    startAngle: 0,
  },
  {
    id: 'downtown_dash',
    name: 'Downtown Dash',
    difficulty: 'Medium',
    laps: 3,
    desc: 'Tight city blocks, sharp corners',
    waypoints: [
      { x: -60, z: -60 },
      { x: -20, z: -60 },
      { x: 20, z: -60 },
      { x: 60, z: -60 },
      { x: 60, z: -20 },
      { x: 60, z: 20 },
      { x: 20, z: 20 },
      { x: -20, z: 20 },
      { x: -20, z: 60 },
      { x: -60, z: 60 },
      { x: -60, z: 20 },
      { x: -60, z: -20 },
    ],
    roadWidth: 11,
    aiSpeedFactor: 0.9,
    startPos: { x: -60, z: -70 },
    startAngle: 0,
  },
  {
    id: 'serpentine',
    name: 'Serpentine Sprint',
    difficulty: 'Hard',
    laps: 3,
    desc: 'Winding path, narrow roads, no margin for error',
    waypoints: [
      { x: -80, z: -60 },
      { x: -50, z: -80 },
      { x: -20, z: -50 },
      { x: 10, z: -80 },
      { x: 40, z: -50 },
      { x: 70, z: -70 },
      { x: 85, z: -30 },
      { x: 60, z: 0 },
      { x: 80, z: 30 },
      { x: 60, z: 60 },
      { x: 30, z: 40 },
      { x: 0, z: 70 },
      { x: -30, z: 50 },
      { x: -60, z: 70 },
      { x: -80, z: 40 },
      { x: -70, z: 10 },
      { x: -85, z: -20 },
    ],
    roadWidth: 9,
    aiSpeedFactor: 0.95,
    startPos: { x: -85, z: -45 },
    startAngle: Math.PI / 4,
  }
];

export function buildTrackVisuals(scene, trackDef, texFactory) {
  const trackGroup = new THREE.Group();
  const wp = trackDef.waypoints;

  // Create smooth track curve using Catmull-Rom
  const curvePoints = wp.map(p => new THREE.Vector3(p.x, 0.06, p.z));
  const curve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);

  // Track surface
  const numSamples = 300;
  const halfWidth = trackDef.roadWidth / 2;
  const asphaltTex = texFactory.getTexture('asphalt');

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

    const left = point.clone().add(normal.clone().multiplyScalar(halfWidth));
    const right = point.clone().add(normal.clone().multiplyScalar(-halfWidth));

    positions.push(left.x, left.y, left.z);
    positions.push(right.x, right.y, right.z);
    uvs.push(0, t * 20);
    uvs.push(1, t * 20);

    if (i < numSamples) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  const trackGeo = new THREE.BufferGeometry();
  trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  trackGeo.setIndex(indices);
  trackGeo.computeVertexNormals();

  const trackMat = new THREE.MeshStandardMaterial({
    map: asphaltTex.clone(),
    roughness: 0.8,
    color: 0x444444,
  });
  const trackMesh = new THREE.Mesh(trackGeo, trackMat);
  trackMesh.receiveShadow = true;
  trackGroup.add(trackMesh);

  // Center dashed line
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf0e060 });
  const dashCount = 150;
  for (let i = 0; i < dashCount; i++) {
    const t1 = i / dashCount;
    const t2 = (i + 0.4) / dashCount;
    const p1 = curve.getPoint(t1);
    const p2 = curve.getPoint(t2);
    const dir = p2.clone().sub(p1);
    const len = dir.length();
    const mid = p1.clone().add(p2).multiplyScalar(0.5);

    const dashGeo = new THREE.PlaneGeometry(0.2, len);
    const dash = new THREE.Mesh(dashGeo, lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.copy(mid);
    dash.position.y = 0.08;
    dash.rotation.z = -Math.atan2(dir.z, dir.x) + Math.PI / 2;
    trackGroup.add(dash);
  }

  // Edge lines (white)
  const edgeLineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  for (const side of [-1, 1]) {
    for (let i = 0; i < numSamples; i++) {
      const t = i / numSamples;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
      const edgePos = point.clone().add(normal.clone().multiplyScalar(side * (halfWidth - 0.3)));

      if (i % 3 === 0) {
        const tNext = (i + 1) / numSamples;
        const nextPoint = curve.getPoint(tNext);
        const dist = edgePos.distanceTo(nextPoint);

        const edgeGeo = new THREE.PlaneGeometry(0.3, dist * 0.8);
        const edge = new THREE.Mesh(edgeGeo, edgeLineMat);
        edge.rotation.x = -Math.PI / 2;
        edge.position.copy(edgePos);
        edge.position.y = 0.075;
        const dir = nextPoint.clone().sub(point);
        edge.rotation.z = -Math.atan2(dir.z, dir.x) + Math.PI / 2;
        trackGroup.add(edge);
      }
    }
  }

  // Barriers/cones along track edges
  for (let i = 0; i < numSamples; i += 8) {
    const t = i / numSamples;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

    for (const side of [-1, 1]) {
      const barrierPos = point.clone().add(normal.clone().multiplyScalar(side * (halfWidth + 0.5)));

      if (trackDef.difficulty === 'Hard') {
        // Concrete barriers for hard track
        const barrierGeo = new THREE.BoxGeometry(0.4, 0.6, 1.5);
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.copy(barrierPos);
        barrier.position.y = 0.3;
        const dir = tangent;
        barrier.rotation.y = Math.atan2(dir.x, dir.z);
        barrier.castShadow = true;
        trackGroup.add(barrier);
      } else {
        // Traffic cones
        const coneGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.copy(barrierPos);
        cone.position.y = 0.25;
        cone.castShadow = true;
        trackGroup.add(cone);
      }
    }
  }

  // Start/finish line
  const startT = 0;
  const startPoint = curve.getPoint(startT);
  const startTangent = curve.getTangent(startT).normalize();
  const startNormal = new THREE.Vector3(-startTangent.z, 0, startTangent.x);

  const checkeredTex = texFactory.getTexture('checkered');
  const finishGeo = new THREE.PlaneGeometry(trackDef.roadWidth, 3);
  const finishMat = new THREE.MeshStandardMaterial({ map: checkeredTex });
  const finishLine = new THREE.Mesh(finishGeo, finishMat);
  finishLine.rotation.x = -Math.PI / 2;
  finishLine.position.copy(startPoint);
  finishLine.position.y = 0.09;
  finishLine.rotation.z = -Math.atan2(startTangent.z, startTangent.x) + Math.PI / 2;
  trackGroup.add(finishLine);

  // Start/finish arch
  const archGroup = new THREE.Group();
  const archMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.3 });

  for (const side of [-1, 1]) {
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 7, 8);
    const pillar = new THREE.Mesh(pillarGeo, archMat);
    const pillarPos = startPoint.clone().add(startNormal.clone().multiplyScalar(side * halfWidth));
    pillar.position.copy(pillarPos);
    pillar.position.y = 3.5;
    pillar.castShadow = true;
    trackGroup.add(pillar);
  }

  const archBarGeo = new THREE.BoxGeometry(trackDef.roadWidth + 1, 0.5, 1);
  const archBar = new THREE.Mesh(archBarGeo, new THREE.MeshStandardMaterial({ color: 0xe94560, metalness: 0.5, roughness: 0.3 }));
  archBar.position.copy(startPoint);
  archBar.position.y = 7;
  archBar.rotation.y = Math.atan2(startTangent.x, startTangent.z);
  archBar.castShadow = true;
  trackGroup.add(archBar);

  scene.add(trackGroup);

  return { curve, trackGroup };
}

// Get smooth track curve for physics/AI
export function getTrackCurve(trackDef) {
  const curvePoints = trackDef.waypoints.map(p => new THREE.Vector3(p.x, 0, p.z));
  return new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);
}
