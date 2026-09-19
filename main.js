const { Plugin, Notice } = require("obsidian");

module.exports = class PointixSheetNavigation extends Plugin {
  async onload() {
    this._gesture=null; this._mousePan=null; this._lastTap=null; this._blockedPointerId=null; this._lastHandledTouchAt=0;
    this._doubleTapMs=430; this._doubleTapDistance=34; this._panThreshold=8;
    this._wheelFrame=0; this._pendingWheelX=0; this._pendingWheelY=0; this._wheelTarget=null;
    this._pd=this._onPointerDown.bind(this); this._pm=this._onPointerMove.bind(this);
    this._pu=this._onPointerUp.bind(this); this._pc=this._onPointerCancel.bind(this);
    this._cg=this._onClickGuard.bind(this); this._dg=this._onDoubleClickGuard.bind(this);
    document.addEventListener("pointerdown",this._pd,true);
    document.addEventListener("pointermove",this._pm,true);
    document.addEventListener("pointerup",this._pu,true);
    document.addEventListener("pointercancel",this._pc,true);
    document.addEventListener("click",this._cg,true);
    document.addEventListener("dblclick",this._dg,true);
    new Notice("Pointix Sheet Navigation activo");
  }
  onunload(){
    document.removeEventListener("pointerdown",this._pd,true);
    document.removeEventListener("pointermove",this._pm,true);
    document.removeEventListener("pointerup",this._pu,true);
    document.removeEventListener("pointercancel",this._pc,true);
    document.removeEventListener("click",this._cg,true);
    document.removeEventListener("dblclick",this._dg,true);
    if(this._wheelFrame) cancelAnimationFrame(this._wheelFrame);
  }
  _isTouchLike(e){const p=String(e?.pointerType||"").toLowerCase();return p==="touch"||p==="pen"}\n  _isMouse(e){const p=String(e?.pointerType||"").toLowerCase();return p==="mouse"||p===""}
  _consume(e){try{e.preventDefault()}catch(_){} try{e.stopPropagation()}catch(_){} try{e.stopImmediatePropagation?.()}catch(_){}}
  _isGridCanvasEvent(e){try{return (typeof e.composedPath==="function"?e.composedPath():[]).some(n=>String(n?.tagName||"").toUpperCase()==="CANVAS")}catch(_){return String(e?.target?.tagName||"").toUpperCase()==="CANVAS"}}
  _looksLikeSheetEvent(e){const t=e?.target;if(!t)return false;try{for(const n of(typeof e.composedPath==="function"?e.composedPath():[])){if(!n||n===document||n===window)continue;const c=String(n.className||"").toLowerCase(),id=String(n.id||"").toLowerCase();if(c.includes("univer")||id.includes("univer"))return true}}catch(_){} return this._isGridCanvasEvent(e)}
  _onPointerDown(e){
    if(!this._isTouchLike(e)||!this._looksLikeSheetEvent(e)||!this._isGridCanvasEvent(e))return;
    const now=Date.now(),x=Number(e.clientX||0),y=Number(e.clientY||0);
    this._consume(e); this._lastHandledTouchAt=now;
    const p=this._lastTap;
    if(p){
      const dt=now-p.time,dist=Math.hypot(x-p.x,y-p.y);
      if(dt>0&&dt<=this._doubleTapMs&&dist<=this._doubleTapDistance){
        this._blockedPointerId=e.pointerId; this._gesture=null; this._lastTap=null;
        try{document.dispatchEvent(new CustomEvent("pointix-sheet-copy-request",{detail:{x,y,time:now}}))}catch(_){}
        return;
      }
    }
    this._gesture={pointerId:e.pointerId,target:e.target,startX:x,startY:y,lastX:x,lastY:y,panning:false};
  }
  _onPointerMove(e){
    if(!this._isTouchLike(e))return;
    if(this._blockedPointerId!==null&&e.pointerId===this._blockedPointerId){this._consume(e);return}
    const g=this._gesture;if(!g||g.pointerId!==e.pointerId)return;
    this._consume(e); this._lastHandledTouchAt=Date.now();
    const x=Number(e.clientX||0),y=Number(e.clientY||0),dx0=x-g.startX,dy0=y-g.startY;
    if(!g.panning&&Math.hypot(dx0,dy0)>=this._panThreshold){g.panning=true;this._lastTap=null}
    if(!g.panning){g.lastX=x;g.lastY=y;return}
    const dx=x-g.lastX,dy=y-g.lastY;g.lastX=x;g.lastY=y;
    if(dx||dy)this._queueWheelPan(g.target,-dx,-dy);
  }
  _onPointerUp(e){
    if(!this._isTouchLike(e))return;
    if(this._blockedPointerId!==null&&e.pointerId===this._blockedPointerId){this._consume(e);this._blockedPointerId=null;this._lastHandledTouchAt=Date.now();return}
    const g=this._gesture;if(!g||g.pointerId!==e.pointerId)return;this._gesture=null;
    this._consume(e);this._lastHandledTouchAt=Date.now();
    if(g.panning){this._flushWheelPan();this._lastTap=null;return}
    const x=Number(e.clientX||g.startX||0),y=Number(e.clientY||g.startY||0);
    this._dispatchSyntheticTap(g.target,x,y); this._lastTap={time:Date.now(),x,y};
  }
  _onPointerCancel(e){if(this._mousePan?.pointerId===e.pointerId){this._mousePan=null;this._flushWheelPan()}if(this._blockedPointerId!==null&&e.pointerId===this._blockedPointerId)this._blockedPointerId=null;if(this._gesture?.pointerId===e.pointerId){this._gesture=null;this._lastTap=null;this._flushWheelPan()}}
  _onClickGuard(e){if(!e?.isTrusted)return;if(Date.now()-this._lastHandledTouchAt>550)return;if(!this._looksLikeSheetEvent(e))return;this._consume(e)}
  _onDoubleClickGuard(e){if(Date.now()-this._lastHandledTouchAt>900)return;if(!this._looksLikeSheetEvent(e))return;this._consume(e)}
  _queueWheelPan(target,dx,dy){this._wheelTarget=target||this._wheelTarget;this._pendingWheelX+=Number(dx||0);this._pendingWheelY+=Number(dy||0);if(this._wheelFrame)return;this._wheelFrame=requestAnimationFrame(()=>{this._wheelFrame=0;this._dispatchQueuedWheel()})}
  _flushWheelPan(){if(this._wheelFrame){cancelAnimationFrame(this._wheelFrame);this._wheelFrame=0}this._dispatchQueuedWheel()}
  _dispatchQueuedWheel(){
    const dx=this._pendingWheelX,dy=this._pendingWheelY;this._pendingWheelX=0;this._pendingWheelY=0;if(!dx&&!dy)return false;
    const target=this._wheelTarget||document.querySelector('[class*="univer"] canvas')||document.querySelector("canvas");this._wheelTarget=null;if(!target?.dispatchEvent)return false;
    try{target.dispatchEvent(new WheelEvent("wheel",{bubbles:true,cancelable:true,composed:true,deltaX:dx,deltaY:dy,deltaMode:WheelEvent.DOM_DELTA_PIXEL}));return true}catch(_){return false}
  }
  _dispatchSyntheticTap(target,x,y){
    try{
      if(!target?.dispatchEvent)return false;
      const c={bubbles:true,cancelable:true,composed:true,view:window,clientX:Number(x||0),clientY:Number(y||0),screenX:Number(x||0),screenY:Number(y||0),button:0};
      if(typeof PointerEvent==="function")target.dispatchEvent(new PointerEvent("pointerdown",{...c,pointerId:8707,pointerType:"mouse",isPrimary:true,buttons:1,pressure:.5}));
      target.dispatchEvent(new MouseEvent("mousedown",{...c,buttons:1,detail:1}));
      if(typeof PointerEvent==="function")target.dispatchEvent(new PointerEvent("pointerup",{...c,pointerId:8707,pointerType:"mouse",isPrimary:true,buttons:0,pressure:0}));
      target.dispatchEvent(new MouseEvent("mouseup",{...c,buttons:0,detail:1}));
      target.dispatchEvent(new MouseEvent("click",{...c,buttons:0,detail:1}));
      return true;
    }catch(_){return false}
  }
};