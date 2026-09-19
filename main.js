const { Plugin, Notice } = require("obsidian");

/**
 * Pointix Sheet Navigation 1.1.1
 *
 * This plugin owns touch/pen gestures on the Sheet Plus canvas.
 * It is intentionally focused on ONE job: navigation.
 *
 * - Touch/pen drag -> pan using Univer's existing wheel/trackpad path.
 * - Touch/pen tap -> one synthetic mouse click so Sheet Plus can select a cell.
 * - Touch/pen double tap -> emit a copy request event for the companion Copy plugin.
 * - Mouse/desktop -> native, except Alt + left-drag pans the sheet.
 * - Copy remains completely separate in Pointix Sheet Copy.
 *
 * Formula bar, menus, toolbar and non-canvas controls remain native.
 */
module.exports = class PointixSheetNavigation extends Plugin {
  async onload() {
    this._gesture = null;
    this._mousePan = null;
    this._lastTap = null;
    this._blockedPointerId = null;
    this._lastHandledTouchAt = 0;

    this._doubleTapMs = 430;
    this._doubleTapDistance = 34;
    this._panThreshold = 8;

    this._wheelFrame = 0;
    this._pendingWheelX = 0;
    this._pendingWheelY = 0;
    this._wheelTarget = null;

    this._pointerDownHandler = this._onPointerDown.bind(this);
    this._pointerMoveHandler = this._onPointerMove.bind(this);
    this._pointerUpHandler = this._onPointerUp.bind(this);
    this._pointerCancelHandler = this._onPointerCancel.bind(this);
    this._clickGuardHandler = this._onClickGuard.bind(this);
    this._dblClickGuardHandler = this._onDoubleClickGuard.bind(this);

    document.addEventListener("pointerdown", this._pointerDownHandler, true);
    document.addEventListener("pointermove", this._pointerMoveHandler, true);
    document.addEventListener("pointerup", this._pointerUpHandler, true);
    document.addEventListener("pointercancel", this._pointerCancelHandler, true);
    document.addEventListener("click", this._clickGuardHandler, true);
    document.addEventListener("dblclick", this._dblClickGuardHandler, true);

    new Notice("Pointix Sheet Navigation activo");
  }

  onunload() {
    document.removeEventListener("pointerdown", this._pointerDownHandler, true);
    document.removeEventListener("pointermove", this._pointerMoveHandler, true);
    document.removeEventListener("pointerup", this._pointerUpHandler, true);
    document.removeEventListener("pointercancel", this._pointerCancelHandler, true);
    document.removeEventListener("click", this._clickGuardHandler, true);
    document.removeEventListener("dblclick", this._dblClickGuardHandler, true);
    if (this._wheelFrame) cancelAnimationFrame(this._wheelFrame);
  }

  _isTouchLike(ev) {
    const p = String(ev?.pointerType || "").toLowerCase();
    return p === "touch" || p === "pen";
  }

  _isMouse(ev) {
    const p = String(ev?.pointerType || "").toLowerCase();
    return p === "mouse" || p === "";
  }

  _consume(ev) {
    try { ev.preventDefault(); } catch (_) {}
    try { ev.stopPropagation(); } catch (_) {}
    try { ev.stopImmediatePropagation?.(); } catch (_) {}
  }

  _isGridCanvasEvent(ev) {
    const t = ev?.target;
    if (!t) return false;
    try {
      const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
      return path.some((n) => String(n?.tagName || "").toUpperCase() === "CANVAS");
    } catch (_) {
      return String(t.tagName || "").toUpperCase() === "CANVAS";
    }
  }

  _looksLikeSheetEvent(ev) {
    const t = ev?.target;
    if (!t) return false;
    try {
      const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
      for (const node of path) {
        if (!node || node === document || node === window) continue;
        const cls = String(node.className || "").toLowerCase();
        const id = String(node.id || "").toLowerCase();
        if (cls.includes("univer") || id.includes("univer")) return true;
      }
    } catch (_) {}
    return this._isGridCanvasEvent(ev);
  }

  _onPointerDown(ev) {
    try {
      if (this._isMouse(ev)) {
        if (!ev.altKey || ev.button !== 0) return;
        if (!this._looksLikeSheetEvent(ev) || !this._isGridCanvasEvent(ev)) return;

        const x = Number(ev.clientX || 0);
        const y = Number(ev.clientY || 0);
        this._consume(ev);
        this._mousePan = {
          pointerId: ev.pointerId,
          target: ev.target,
          startX: x,
          startY: y,
          lastX: x,
          lastY: y,
          panning: false,
        };
        return;
      }

      if (!this._isTouchLike(ev)) return;
      if (!this._looksLikeSheetEvent(ev) || !this._isGridCanvasEvent(ev)) return;

      const now = Date.now();
      const x = Number(ev.clientX || 0);
      const y = Number(ev.clientY || 0);

      this._consume(ev);
      this._lastHandledTouchAt = now;

      const previous = this._lastTap;
      if (previous) {
        const dt = now - previous.time;
        const dist = Math.hypot(x - previous.x, y - previous.y);
        if (dt > 0 && dt <= this._doubleTapMs && dist <= this._doubleTapDistance) {
          this._blockedPointerId = ev.pointerId;
          this._gesture = null;
          this._lastTap = null;

          try {
            document.dispatchEvent(new CustomEvent("pointix-sheet-copy-request", {
              detail: { x, y, time: now }
            }));
          } catch (_) {}
          return;
        }
      }

      this._gesture = {
        pointerId: ev.pointerId,
        target: ev.target,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        panning: false,
      };
    } catch (e) {
      console.error("Pointix navigation pointerdown", e);
    }
  }

  _onPointerMove(ev) {
    try {
      if (this._isMouse(ev)) {
        const m = this._mousePan;
        if (!m || m.pointerId !== ev.pointerId) return;
        this._consume(ev);

        const x = Number(ev.clientX || 0);
        const y = Number(ev.clientY || 0);
        const totalDx = x - m.startX;
        const totalDy = y - m.startY;
        if (!m.panning && Math.hypot(totalDx, totalDy) >= 3) m.panning = true;

        const dx = x - m.lastX;
        const dy = y - m.lastY;
        m.lastX = x;
        m.lastY = y;
        if (m.panning && (dx || dy)) this._queueWheelPan(m.target, -dx, -dy);
        return;
      }

      if (!this._isTouchLike(ev)) return;

      if (this._blockedPointerId !== null && ev.pointerId === this._blockedPointerId) {
        this._consume(ev);
        return;
      }

      const g = this._gesture;
      if (!g || g.pointerId !== ev.pointerId) return;

      this._consume(ev);
      this._lastHandledTouchAt = Date.now();

      const x = Number(ev.clientX || 0);
      const y = Number(ev.clientY || 0);
      const totalDx = x - g.startX;
      const totalDy = y - g.startY;

      if (!g.panning && Math.hypot(totalDx, totalDy) >= this._panThreshold) {
        g.panning = true;
        this._lastTap = null;
      }

      if (!g.panning) {
        g.lastX = x;
        g.lastY = y;
        return;
      }

      const dx = x - g.lastX;
      const dy = y - g.lastY;
      g.lastX = x;
      g.lastY = y;

      if (dx || dy) this._queueWheelPan(g.target, -dx, -dy);
    } catch (e) {
      console.error("Pointix navigation pointermove", e);
    }
  }

  _onPointerUp(ev) {
    try {
      if (this._isMouse(ev)) {
        const m = this._mousePan;
        if (!m || m.pointerId !== ev.pointerId) return;
        this._consume(ev);
        this._mousePan = null;
        if (m.panning) this._flushWheelPan();
        return;
      }

      if (!this._isTouchLike(ev)) return;

      if (this._blockedPointerId !== null && ev.pointerId === this._blockedPointerId) {
        this._consume(ev);
        this._blockedPointerId = null;
        this._lastHandledTouchAt = Date.now();
        return;
      }

      const g = this._gesture;
      if (!g || g.pointerId !== ev.pointerId) return;
      this._gesture = null;

      this._consume(ev);
      this._lastHandledTouchAt = Date.now();

      if (g.panning) {
        this._flushWheelPan();
        this._lastTap = null;
        return;
      }

      const x = Number(ev.clientX || g.startX || 0);
      const y = Number(ev.clientY || g.startY || 0);
      this._dispatchSyntheticTap(g.target, x, y);
      this._lastTap = { time: Date.now(), x, y };
    } catch (e) {
      console.error("Pointix navigation pointerup", e);
    }
  }

  _onPointerCancel(ev) {
    if (this._mousePan?.pointerId === ev.pointerId) {
      this._mousePan = null;
      this._flushWheelPan();
    }
    if (this._blockedPointerId !== null && ev.pointerId === this._blockedPointerId) {
      this._blockedPointerId = null;
    }
    if (this._gesture?.pointerId === ev.pointerId) {
      this._gesture = null;
      this._lastTap = null;
      this._flushWheelPan();
    }
  }

  _onClickGuard(ev) {
    if (!ev?.isTrusted) return;
    if (Date.now() - this._lastHandledTouchAt > 550) return;
    if (!this._looksLikeSheetEvent(ev)) return;
    this._consume(ev);
  }

  _onDoubleClickGuard(ev) {
    if (Date.now() - this._lastHandledTouchAt > 900) return;
    if (!this._looksLikeSheetEvent(ev)) return;
    this._consume(ev);
  }

  _queueWheelPan(target, deltaX, deltaY) {
    this._wheelTarget = target || this._wheelTarget;
    this._pendingWheelX += Number(deltaX || 0);
    this._pendingWheelY += Number(deltaY || 0);
    if (this._wheelFrame) return;

    this._wheelFrame = requestAnimationFrame(() => {
      this._wheelFrame = 0;
      this._dispatchQueuedWheel();
    });
  }

  _flushWheelPan() {
    if (this._wheelFrame) {
      cancelAnimationFrame(this._wheelFrame);
      this._wheelFrame = 0;
    }
    this._dispatchQueuedWheel();
  }

  _dispatchQueuedWheel() {
    const dx = this._pendingWheelX;
    const dy = this._pendingWheelY;
    this._pendingWheelX = 0;
    this._pendingWheelY = 0;
    if (!dx && !dy) return false;

    const target = this._wheelTarget || document.querySelector('[class*="univer"] canvas') || document.querySelector("canvas");
    this._wheelTarget = null;
    if (!target?.dispatchEvent) return false;

    try {
      target.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        composed: true,
        deltaX: dx,
        deltaY: dy,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
      }));
      return true;
    } catch (e) {
      console.debug("Pointix wheel dispatch failed", e);
      return false;
    }
  }

  _dispatchSyntheticTap(target, x, y) {
    try {
      if (!target?.dispatchEvent) return false;
      const common = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX: Number(x || 0),
        clientY: Number(y || 0),
        screenX: Number(x || 0),
        screenY: Number(y || 0),
        button: 0,
      };

      if (typeof PointerEvent === "function") {
        target.dispatchEvent(new PointerEvent("pointerdown", {
          ...common, pointerId: 8707, pointerType: "mouse", isPrimary: true, buttons: 1, pressure: 0.5,
        }));
      }
      target.dispatchEvent(new MouseEvent("mousedown", { ...common, buttons: 1, detail: 1 }));

      if (typeof PointerEvent === "function") {
        target.dispatchEvent(new PointerEvent("pointerup", {
          ...common, pointerId: 8707, pointerType: "mouse", isPrimary: true, buttons: 0, pressure: 0,
        }));
      }
      target.dispatchEvent(new MouseEvent("mouseup", { ...common, buttons: 0, detail: 1 }));
      target.dispatchEvent(new MouseEvent("click", { ...common, buttons: 0, detail: 1 }));
      return true;
    } catch (e) {
      console.warn("Pointix synthetic tap failed", e);
      return false;
    }
  }
};