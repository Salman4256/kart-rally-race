// Mobile Touch Controls: On-screen virtual buttons for steering, throttle, brake, drift, item, pause
import { bus } from './events.js';

export class TouchControls {
  constructor(uiRoot, inputController) {
    this.uiRoot = uiRoot;
    this.input = inputController;
    this.container = null;
    this.visible = false;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this.touches = {
      steerLeft: false,
      steerRight: false,
      throttle: false,
      brake: false,
      drift: false,
      item: false,
    };

    this._build();
    this._attachEvents();

    // Auto-enable if touch device is detected
    if (this.isTouchDevice) {
      this.show();
    }
  }

  _build() {
    const c = this.container = document.createElement('div');
    c.id = 'touch-controls';
    c.className = 'touch-controls hidden';
    c.innerHTML = `
      <div class="touch-zone touch-left">
        <button class="touch-btn touch-steer-left" data-action="steerLeft" aria-label="Steer Left">◀</button>
        <button class="touch-btn touch-steer-right" data-action="steerRight" aria-label="Steer Right">▶</button>
      </div>

      <div class="touch-zone touch-top">
        <button class="touch-btn-sm touch-pause" data-action="pause" aria-label="Pause">⏸</button>
        <button class="touch-btn-sm touch-fs" data-action="fullscreen" aria-label="Fullscreen">⛶</button>
      </div>

      <div class="touch-zone touch-right">
        <div class="touch-cluster-top">
          <button class="touch-btn touch-btn-action touch-item" data-action="item" aria-label="Item">USE ITEM</button>
          <button class="touch-btn touch-btn-action touch-drift" data-action="drift" aria-label="Drift">DRIFT</button>
        </div>
        <div class="touch-cluster-bottom">
          <button class="touch-btn touch-btn-action touch-brake" data-action="brake" aria-label="Brake">BRAKE</button>
          <button class="touch-btn touch-btn-action touch-gas" data-action="throttle" aria-label="Gas">GAS</button>
        </div>
      </div>
    `;

    this.uiRoot.appendChild(c);
  }

  _attachEvents() {
    const handleTouch = (e, isDown) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      e.preventDefault();
      const act = target.dataset.action;

      if (act === 'fullscreen' && isDown) {
        this.toggleFullscreen();
        return;
      }

      if (act === 'pause' && isDown) {
        if (this.input) this.input.injectPress('pause');
        return;
      }

      if (act === 'item') {
        if (isDown && this.input) {
          this.input.injectPress('item');
        }
        this.touches.item = isDown;
        target.classList.toggle('active', isDown);
        return;
      }

      if (this.touches[act] !== undefined) {
        this.touches[act] = isDown;
        target.classList.toggle('active', isDown);
        this._updateInputState();
      }
    };

    this.container.addEventListener('touchstart', (e) => handleTouch(e, true), { passive: false });
    this.container.addEventListener('touchend', (e) => handleTouch(e, false), { passive: false });
    this.container.addEventListener('touchcancel', (e) => handleTouch(e, false), { passive: false });

    // Pointer events fallback for desktop testing
    this.container.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') handleTouch(e, true);
    });
    window.addEventListener('pointerup', (e) => {
      if (this.visible) {
        for (const k of Object.keys(this.touches)) this.touches[k] = false;
        const activeBtns = this.container.querySelectorAll('.active');
        activeBtns.forEach((b) => b.classList.remove('active'));
        this._updateInputState();
      }
    });
  }

  _updateInputState() {
    if (!this.input) return;
    const steer = (this.touches.steerRight ? 1 : 0) - (this.touches.steerLeft ? 1 : 0);
    this.input.virtualSteer = steer;
    this.input.virtualThrottle = this.touches.throttle ? 1 : 0;
    this.input.virtualBrake = this.touches.brake ? 1 : 0;
    this.input.virtualDrift = this.touches.drift;
  }

  show() {
    this.visible = true;
    this.container.classList.remove('hidden');
  }

  hide() {
    this.visible = false;
    this.container.classList.add('hidden');
    for (const k of Object.keys(this.touches)) this.touches[k] = false;
    this._updateInputState();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}
