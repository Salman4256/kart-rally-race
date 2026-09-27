// Time Trial Ghost Recording and Playback System
import * as THREE from 'three';

const SAMPLE_INTERVAL = 0.05; // 20 Hz recording rate
const GHOST_STORAGE_PREFIX = 'tkr-ghost-';
const PB_STORAGE_PREFIX = 'tkr-pb-';

export class GhostSystem {
  constructor({ scene, trackId }) {
    this.scene = scene;
    this.trackId = trackId;
    this.recording = [];
    this.lastSampleTime = 0;
    this.currentLapTime = 0;
    this.ghostData = this.loadGhost(trackId);
    this.ghostMesh = null;
    this.ghostWheels = [];
    this.playbackIndex = 0;
    this.enabled = true;

    if (this.ghostData && this.ghostData.frames?.length > 10) {
      this.createGhostMesh();
    }
  }

  createGhostMesh() {
    if (!this.scene) return;
    const group = new THREE.Group();
    group.name = 'ghost-kart';

    const ghostMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00838f,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1.0,
      side: THREE.DoubleSide,
    });

    const ghostDarkMat = new THREE.MeshStandardMaterial({
      color: 0x004d40,
      transparent: true,
      opacity: 0.35,
    });

    // Sleek holographic body shape
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 2.2), ghostMat);
    body.position.y = 0.4;
    group.add(body);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.9, 4), ghostMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.position.set(0, 0.35, 1.25);
    group.add(nose);

    // Rear wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.4), ghostMat);
    wing.position.set(0, 0.9, -1.05);
    group.add(wing);

    const wingPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), ghostDarkMat);
    wingPillarL.position.set(0.45, 0.65, -1.05);
    group.add(wingPillarL);

    const wingPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), ghostDarkMat);
    wingPillarR.position.set(-0.45, 0.65, -1.05);
    group.add(wingPillarR);

    // Wheels
    this.ghostWheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.26, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelPositions = [
      [0.72, 0.3, 0.75],
      [-0.72, 0.3, 0.75],
      [0.75, 0.35, -0.75],
      [-0.75, 0.35, -0.75],
    ];

    for (const [x, y, z] of wheelPositions) {
      const w = new THREE.Mesh(wheelGeo, ghostDarkMat);
      w.position.set(x, y, z);
      group.add(w);
      this.ghostWheels.push(w);
    }

    this.scene.add(group);
    this.ghostMesh = group;
    this.ghostMesh.visible = false;
  }

  startLap() {
    this.recording = [];
    this.lastSampleTime = 0;
    this.currentLapTime = 0;
    this.playbackIndex = 0;
    if (this.ghostMesh) {
      this.ghostMesh.visible = this.enabled && !!(this.ghostData?.frames?.length);
    }
  }

  recordFrame(playerKart, dt) {
    if (!playerKart) return;
    this.currentLapTime += dt;

    if (this.currentLapTime - this.lastSampleTime >= SAMPLE_INTERVAL) {
      this.lastSampleTime = this.currentLapTime;
      const pos = playerKart.position;
      const rot = playerKart.object3D.quaternion;
      this.recording.push({
        t: this.currentLapTime,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        qx: rot.x,
        qy: rot.y,
        qz: rot.z,
        qw: rot.w,
        speed: playerKart.speed || 0,
      });
    }

    this.updateGhostPlayback(this.currentLapTime);
  }

  updateGhostPlayback(lapTime) {
    if (!this.ghostMesh || !this.ghostData?.frames?.length || !this.enabled) return;
    const frames = this.ghostData.frames;

    // Find bounding frames for current lapTime
    while (this.playbackIndex < frames.length - 2 && frames[this.playbackIndex + 1].t < lapTime) {
      this.playbackIndex++;
    }

    const f0 = frames[this.playbackIndex];
    const f1 = frames[this.playbackIndex + 1];

    if (!f0) return;
    if (!f1) {
      this.ghostMesh.position.set(f0.x, f0.y, f0.z);
      this.ghostMesh.quaternion.set(f0.qx, f0.qy, f0.qz, f0.qw);
      return;
    }

    // Interpolate
    const span = Math.max(1e-4, f1.t - f0.t);
    const alpha = Math.min(1, Math.max(0, (lapTime - f0.t) / span));

    this.ghostMesh.position.set(
      f0.x + (f1.x - f0.x) * alpha,
      f0.y + (f1.y - f0.y) * alpha,
      f0.z + (f1.z - f0.z) * alpha
    );

    this.ghostMesh.quaternion.slerpQuaternions(
      new THREE.Quaternion(f0.qx, f0.qy, f0.qz, f0.qw),
      new THREE.Quaternion(f1.qx, f1.qy, f1.qz, f1.qw),
      alpha
    );

    // Wheel spin
    const spin = (lapTime * 25) % (Math.PI * 2);
    for (const w of this.ghostWheels) {
      w.rotation.x = spin;
    }
  }

  finishLap(lapTime) {
    const currentPB = this.getPB(this.trackId);
    let isNewRecord = false;

    if (currentPB === null || lapTime < currentPB) {
      isNewRecord = true;
      this.savePB(this.trackId, lapTime);
      this.saveGhost(this.trackId, {
        time: lapTime,
        frames: this.recording,
      });
      this.ghostData = { time: lapTime, frames: this.recording };
      if (!this.ghostMesh) {
        this.createGhostMesh();
      }
    }

    return {
      isNewRecord,
      time: lapTime,
      previousPB: currentPB,
    };
  }

  loadGhost(trackId) {
    try {
      const data = localStorage.getItem(GHOST_STORAGE_PREFIX + trackId);
      if (data) return JSON.parse(data);
    } catch (e) { /* ignore */ }
    return null;
  }

  saveGhost(trackId, data) {
    try {
      // Subsample if too dense to save storage
      localStorage.setItem(GHOST_STORAGE_PREFIX + trackId, JSON.stringify(data));
    } catch (e) { console.warn('[ghost] save failed', e); }
  }

  getPB(trackId) {
    try {
      const val = localStorage.getItem(PB_STORAGE_PREFIX + trackId);
      if (val !== null) return parseFloat(val);
    } catch (e) { /* ignore */ }
    return null;
  }

  savePB(trackId, time) {
    try {
      localStorage.setItem(PB_STORAGE_PREFIX + trackId, time.toString());
    } catch (e) { /* ignore */ }
  }

  dispose() {
    if (this.ghostMesh) {
      try {
        this.scene?.remove(this.ghostMesh);
        this.ghostMesh.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      } catch (e) { /* ignore */ }
      this.ghostMesh = null;
    }
  }
}
