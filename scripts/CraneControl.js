//  Hack the Port — crane control rig [hold-to-drive]
//  Reload the page (F5) FIRST so old consts clear, then paste this whole
//  file in the console (port 9000, logged in), then:  drive()
//  HOLD a key to keep moving, RELEASE to stop.  Click the PAGE first.

const DIRS = {
  ArrowUp:    "forwards",
  ArrowDown:  "backwards",
  ArrowLeft:  "left",
  ArrowRight: "right",
  q: "up",   Q: "up",       
  e: "down", E: "down",     
};
const isHook = (dir) => dir === "up" || dir === "down";
let HOLD_MS = 10000;        

const api = (url, body) =>
  fetch(url, {
    method: "POST", credentials: "include",
    ...(body && { headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body) }),
  }).then((r) => r.status).catch(() => "ERR");

const controls  = () => fetch("/api/controls", { credentials: "include" }).then(r => r.json()).then(d => (console.log("CONTROLS:", d), d));
const move      = (dir, ms = HOLD_MS) => api("/api/actions/crane/move", { direction: dir, duration_ms: ms });
const bigMove   = (dir, ms) => move(dir, ms);
const craneStop = () => api("/api/actions/crane/stop");
const hookStop  = () => api("/api/actions/crane/hook/stop");
const magnetOn  = () => api("/api/actions/crane/magnet/on");
const magnetOff = () => api("/api/actions/crane/magnet/off");
const camReset  = () => api("/api/actions/cameras/reset-temporarily").then(s => (console.log("cam:", s), s));
const gateOpen  = () => api("/api/actions/gate/open-temporarily").then(s => (console.log("gate:", s), s));

let _magnetOn = false;
const _held = new Set();

function _down(e) {
  const dir = DIRS[e.key];
  if (dir) {
    e.preventDefault();
    if (e.repeat || _held.has(e.key)) return;  
    _held.add(e.key);
    move(dir);                                  
    return;
  }
  switch (e.key) {
    case "m": case "M": if (e.repeat) return; _magnetOn = !_magnetOn; (_magnetOn ? magnetOn() : magnetOff()); console.log("magnet", _magnetOn ? "ON" : "OFF"); break;
    case "c": case "C": if (!e.repeat) camReset(); break;
    case "g": case "G": if (!e.repeat) gateOpen(); break;
    case " ": e.preventDefault(); craneStop(); hookStop(); break;   
  }
}
function _up(e) {
  const dir = DIRS[e.key];
  if (!dir) return;
  e.preventDefault();
  _held.delete(e.key);
  if (isHook(dir)) hookStop(); else craneStop();   
}

function drive(on = true) {
  if (on) {
    window.addEventListener("keydown", _down);
    window.addEventListener("keyup", _up);
    console.log("%cDRIVING ON — HOLD to move, RELEASE to stop","color:green;font-weight:bold",
      "\n  ↑ ↓   hold = crane forwards / backwards" +
      "\n  ← →   hold = crane left / right" +
      "\n  Q / E hold = hook up / down" +
      "\n  M     magnet on/off     C  cameras     G  gate" +
      "\n  Space = STOP everything   drive(false) = off");
  } else {
    window.removeEventListener("keydown", _down);
    window.removeEventListener("keyup", _up);
    _held.clear(); craneStop(); hookStop();
    console.log("DRIVING OFF");
  }
}

console.log("%cv3 loaded. Run drive(), then CLICK THE PAGE, then hold a key.","color:#09f;font-weight:bold");