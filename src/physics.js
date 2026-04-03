import * as THREE from 'three';

export class CarPhysics {
  constructor(carDef, startPos, startAngle) {
    this.position = new THREE.Vector3(startPos.x, 0, startPos.z);
    this.rotation = startAngle || 0; // Y-axis rotation
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0; // scalar speed
    this.angularVelocity = 0;

    // Car properties based on stats
    const stats = carDef.stats;
    this.maxSpeed = stats.speed / 3.6; // Convert km/h to m/s (game units)
    this.acceleration = stats.accel * 1.8;
    this.brakeForce = 15;
    this.handling = stats.handling * 0.45;
    this.friction = 0.98;
    this.drag = 0.002;
    this.turnDamping = 0.92;

    // State
    this.throttle = 0;
    this.brake = 0;
    this.steer = 0;
    this.drifting = false;
    this.wheelAngle = 0;

    // Collision
    this.boundingRadius = 2.2;

    // Track progress
    this.trackProgress = 0;
    this.lap = 0;
    this.lastCheckpoint = 0;
    this.finishTime = 0;
    this.finished = false;
    this.lapTimes = [];
    this.lapStartTime = 0;
  }

  update(dt, trackCurve, colliders) {
    if (this.finished) return;

    dt = Math.min(dt, 0.05); // Cap delta time

    // Forward direction
    const forward = new THREE.Vector3(
      -Math.sin(this.rotation),
      0,
      -Math.cos(this.rotation)
    );

    // Acceleration
    if (this.throttle > 0) {
      this.speed += this.acceleration * this.throttle * dt;
    }
    if (this.brake > 0) {
      this.speed -= this.brakeForce * this.brake * dt;
    }

    // Natural deceleration
    this.speed *= (1 - this.drag * Math.abs(this.speed));

    // Clamp speed
    this.speed = THREE.MathUtils.clamp(this.speed, -this.maxSpeed * 0.3, this.maxSpeed);

    // Reverse
    if (this.throttle < 0) {
      this.speed += this.acceleration * 0.4 * this.throttle * dt;
    }

    // Steering
    const speedFactor = Math.min(Math.abs(this.speed) / 5, 1);
    const steerAmount = this.steer * this.handling * dt * speedFactor;

    // At higher speeds, reduce steering sensitivity
    const highSpeedFactor = 1 - (Math.abs(this.speed) / this.maxSpeed) * 0.4;
    this.rotation += steerAmount * highSpeedFactor * (this.speed >= 0 ? 1 : -1);

    // Update wheel visual angle
    this.wheelAngle = THREE.MathUtils.lerp(this.wheelAngle, this.steer * 0.5, 0.2);

    // Check for drift
    this.drifting = Math.abs(this.steer) > 0.5 && Math.abs(this.speed) > this.maxSpeed * 0.4;
    if (this.drifting) {
      this.speed *= 0.995; // Slight speed loss when drifting
    }

    // Apply velocity
    this.velocity.copy(forward).multiplyScalar(this.speed);
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Keep on ground
    this.position.y = 0;

    // Track boundary collision
    if (trackCurve) {
      this.updateTrackProgress(trackCurve);
      this.constrainToTrack(trackCurve, 20); // generous track width for gameplay
    }

    // Collider check
    if (colliders) {
      for (const other of colliders) {
        if (other === this) continue;
        const dist = this.position.distanceTo(other.position);
        if (dist < this.boundingRadius + other.boundingRadius) {
          this.handleCollision(other);
        }
      }
    }

    return {
      position: this.position.clone(),
      rotation: this.rotation,
      speed: this.speed,
      speedKmh: Math.abs(this.speed * 3.6),
      drifting: this.drifting,
      wheelAngle: this.wheelAngle,
    };
  }

  updateTrackProgress(curve) {
    // Find closest point on curve
    let minDist = Infinity;
    let bestT = this.trackProgress;
    const searchRange = 0.05;
    const steps = 50;

    for (let i = 0; i < steps; i++) {
      let t = (this.trackProgress - searchRange + (i / steps) * searchRange * 2) % 1;
      if (t < 0) t += 1;
      const point = curve.getPoint(t);
      const dist = this.position.distanceTo(new THREE.Vector3(point.x, 0, point.z));
      if (dist < minDist) {
        minDist = dist;
        bestT = t;
      }
    }

    const prevProgress = this.trackProgress;
    this.trackProgress = bestT;

    // Detect lap completion (crossing from ~1.0 to ~0.0)
    if (prevProgress > 0.9 && this.trackProgress < 0.1) {
      this.lap++;
    }
    // Detect going backwards (crossing from ~0.0 to ~1.0)
    if (prevProgress < 0.1 && this.trackProgress > 0.9) {
      this.lap = Math.max(0, this.lap - 1);
    }
  }

  constrainToTrack(curve, maxDist) {
    const point = curve.getPoint(this.trackProgress);
    const trackPoint = new THREE.Vector3(point.x, 0, point.z);
    const dist = this.position.distanceTo(trackPoint);

    if (dist > maxDist) {
      // Push back towards track
      const dir = trackPoint.clone().sub(this.position).normalize();
      this.position.add(dir.clone().multiplyScalar((dist - maxDist) * 0.5));
      this.speed *= 0.8; // Slow down when going off-track
    }

    // Also slow down when off the road surface (grass)
    if (dist > maxDist * 0.6) {
      this.speed *= 0.97; // Gradual slowdown on grass
    }
  }

  handleCollision(other) {
    const pushDir = this.position.clone().sub(other.position).normalize();
    const overlap = (this.boundingRadius + other.boundingRadius) -
      this.position.distanceTo(other.position);

    this.position.add(pushDir.clone().multiplyScalar(overlap * 0.5));
    other.position.add(pushDir.clone().multiplyScalar(-overlap * 0.5));

    // Exchange some momentum
    const relSpeed = this.speed - other.speed;
    this.speed -= relSpeed * 0.3;
    other.speed += relSpeed * 0.3;

    this.speed *= 0.85;
    other.speed *= 0.85;
  }

  setControls(throttle, brake, steer) {
    this.throttle = throttle;
    this.brake = brake;
    this.steer = steer;
  }

  getSpeedKmh() {
    return Math.abs(this.speed * 3.6);
  }
}
