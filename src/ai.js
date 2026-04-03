import * as THREE from 'three';
import { CarPhysics } from './physics.js';

export class AIDriver {
  constructor(carDef, trackDef, trackCurve) {
    this.physics = new CarPhysics(carDef, {
      x: trackDef.startPos.x + 4, // Offset from player
      z: trackDef.startPos.z + 3
    }, trackDef.startAngle);

    this.trackCurve = trackCurve;
    this.speedFactor = trackDef.aiSpeedFactor;
    this.lookAheadDist = 0.04; // How far ahead on the track to look
    this.targetT = 0;
    this.racingLine = 0; // -1 to 1, offset from center of track
    this.reactionTime = 0.1;
    this.reactionTimer = 0;
    this.currentThrottle = 0;
    this.currentSteer = 0;
    this.difficulty = trackDef.difficulty;

    // Variation - makes AI less robotic
    this.speedVariation = 0;
    this.variationTimer = 0;
    this.lineVariation = 0;

    // Rubber banding
    this.rubberBand = 1.0;
  }

  update(dt, playerProgress, playerLap) {
    this.reactionTimer += dt;

    // Update variation periodically
    this.variationTimer += dt;
    if (this.variationTimer > 2) {
      this.variationTimer = 0;
      this.speedVariation = (Math.random() - 0.5) * 0.1;
      this.lineVariation = (Math.random() - 0.5) * 2;
    }

    // Rubber banding - speed up if behind, slow down if too far ahead
    const progressDiff = this.getEffectiveProgress() - (playerLap + playerProgress);
    if (progressDiff < -0.5) {
      this.rubberBand = THREE.MathUtils.lerp(this.rubberBand, 1.15, 0.01);
    } else if (progressDiff > 0.5) {
      this.rubberBand = THREE.MathUtils.lerp(this.rubberBand, 0.85, 0.01);
    } else {
      this.rubberBand = THREE.MathUtils.lerp(this.rubberBand, 1.0, 0.02);
    }

    if (this.reactionTimer >= this.reactionTime) {
      this.reactionTimer = 0;
      this.calculateControls();
    }

    this.physics.setControls(this.currentThrottle, this.currentBrake || 0, this.currentSteer);
    return this.physics.update(dt, this.trackCurve, null);
  }

  calculateControls() {
    const pos = this.physics.position;

    // Find current position on track
    let minDist = Infinity;
    let currentT = this.physics.trackProgress;
    const steps = 40;
    const range = 0.06;

    for (let i = 0; i < steps; i++) {
      let t = (currentT - range + (i / steps) * range * 2) % 1;
      if (t < 0) t += 1;
      const p = this.trackCurve.getPoint(t);
      const dist = pos.distanceTo(new THREE.Vector3(p.x, 0, p.z));
      if (dist < minDist) {
        minDist = dist;
        currentT = t;
      }
    }

    // Look ahead on the track
    const lookAhead = this.difficulty === 'Hard' ? 0.03 : this.difficulty === 'Medium' ? 0.04 : 0.05;
    this.targetT = (currentT + lookAhead) % 1;

    const targetPoint = this.trackCurve.getPoint(this.targetT);

    // Add racing line offset
    const tangent = this.trackCurve.getTangent(this.targetT).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const offset = this.lineVariation * 2;
    targetPoint.x += normal.x * offset;
    targetPoint.z += normal.z * offset;

    // Calculate direction to target
    const toTarget = new THREE.Vector3(
      targetPoint.x - pos.x,
      0,
      targetPoint.z - pos.z
    ).normalize();

    // Current forward direction
    const forward = new THREE.Vector3(
      -Math.sin(this.physics.rotation),
      0,
      -Math.cos(this.physics.rotation)
    );

    // Calculate steering
    const cross = forward.x * toTarget.z - forward.z * toTarget.x;
    const dot = forward.dot(toTarget);

    // Steer towards target
    this.currentSteer = THREE.MathUtils.clamp(-cross * 3, -1, 1);

    // Speed control
    const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));
    const speedKmh = this.physics.getSpeedKmh();

    // Look further ahead for speed planning
    const farLookT = (currentT + lookAhead * 3) % 1;
    const farPoint = this.trackCurve.getPoint(farLookT);
    const farTangent = this.trackCurve.getTangent(farLookT).normalize();
    const currentTangent = this.trackCurve.getTangent(currentT).normalize();
    const upcomingAngle = Math.acos(THREE.MathUtils.clamp(currentTangent.dot(farTangent), -1, 1));

    // Throttle control
    const maxAISpeed = this.physics.maxSpeed * 3.6 * this.speedFactor * this.rubberBand *
                       (1 + this.speedVariation);

    this.currentBrake = 0;

    if (angle > 0.5) {
      // Sharp turn - brake and steer
      this.currentThrottle = 0.3;
      if (speedKmh > maxAISpeed * 0.5) {
        this.currentBrake = 0.5;
        this.currentThrottle = 0;
      }
    } else if (upcomingAngle > 0.3) {
      // Upcoming turn - ease off
      this.currentThrottle = 0.5;
      if (speedKmh > maxAISpeed * 0.7) {
        this.currentBrake = 0.3;
        this.currentThrottle = 0.2;
      }
    } else if (speedKmh < maxAISpeed) {
      // Straight or gentle - full throttle
      this.currentThrottle = 1.0;
    } else {
      this.currentThrottle = 0.3;
    }

    // Off track recovery
    if (minDist > 15) {
      this.currentSteer = THREE.MathUtils.clamp(-cross * 5, -1, 1);
      this.currentThrottle = 0.4;
    }
  }

  getEffectiveProgress() {
    return this.physics.lap + this.physics.trackProgress;
  }
}
