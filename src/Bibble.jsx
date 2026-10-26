import { useEffect, useRef, useState } from "react";

const MAX_MOVE = 9; // jarak maksimal bola mata bergeser (px), naikkan kalau mau lebih jauh

export default function Bibble() {
  const bodyRef = useRef(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const lookAt = (clientX, clientY) => {
      const el = bodyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      // makin jauh makin mentok ke MAX_MOVE, makin dekat makin pelan
      const power = Math.min(dist / 120, 1) * MAX_MOVE;
      setLook({ x: (dx / dist) * power, y: (dy / dist) * power });
    };

    const onPointer = (e) => lookAt(e.clientX, e.clientY);
    const onTouch = (e) => {
      const t = e.touches[0];
      if (t) lookAt(t.clientX, t.clientY);
    };
    const onEnd = () => setLook({ x: 0, y: 0 });

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const pupilStyle = {
    transform: `translate(${look.x}px, ${look.y}px)`,
    transition: "transform 0.08s ease-out",
  };

  return (
    <div className="dashboard-bibble bibble-css">
      <div className="bibble-body" ref={bodyRef}>
        <div className="bibble-ear ear-left" />
        <div className="bibble-ear ear-right" />
        <div className="bibble-wing wing-left">✦</div>
        <div className="bibble-wing wing-right">✦</div>

        <div className="bibble-face">
          <div className="bibble-eye eye-left">
            <span style={pupilStyle} />
          </div>
          <div className="bibble-eye eye-right">
            <span style={pupilStyle} />
          </div>
          <div className="bibble-cheek cheek-left" />
          <div className="bibble-cheek cheek-right" />
          <div className="bibble-mouth" />
        </div>

        <div className="bibble-belly" />
        <div className="bibble-foot foot-left" />
        <div className="bibble-foot foot-right" />
      </div>
      <div className="bibble-shadow" />
    </div>
  );
}