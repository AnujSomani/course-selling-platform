import { useEffect, useState } from "react";

let count = 0;
let progress = 0;
let visible = false;
let trickleTimer = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn({ progress, visible }));
}

function startTrickle() {
  clearInterval(trickleTimer);
  trickleTimer = setInterval(() => {
    progress = Math.min(90, progress + Math.max(0.5, (90 - progress) * 0.08));
    emit();
  }, 200);
}

function stopTrickle() {
  clearInterval(trickleTimer);
  trickleTimer = null;
}

export const loader = {
  subscribe(fn) {
    listeners.add(fn);
    fn({ progress, visible }); 
    return () => listeners.delete(fn);
  },

  start() {
    count = Math.max(0, count) + 1;
    if (count === 1) {
      visible = true;
      progress = 10;
      emit();
      startTrickle();
    }
  },

  done() {
    if (count <= 0) {
      count = 0;
      return;
    }
    count -= 1;
    if (count === 0) {
      stopTrickle();
      progress = 100;
      emit();
      setTimeout(() => {
        if (count === 0) {
          visible = false;
          progress = 0;
          emit();
        }
      }, 400);
    }
  },

  async track(promise) {
    this.start();
    try {
      return await promise;
    } finally {
      this.done();
    }
  },
};

export default function Loader() {
  const [state, setState] = useState({ progress: 0, visible: false });

  useEffect(() => {
    return loader.subscribe(setState);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[9999] h-[3px] pointer-events-none"
      style={{
        opacity: state.visible ? 1 : 0,
        transition: "opacity 300ms ease",
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
        style={{
          width: `${state.progress}%`,
          transition: state.progress === 100
            ? "width 200ms ease-out"  
            : "width 180ms ease-out",  
        }}
      />
    </div>
  );
}
