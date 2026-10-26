import { useEffect, useRef, useState } from "react";

const MAX_MOVE = 9;      // jarak maksimal bola mata (px)
const IDLE_AFTER = 2500; // ms tanpa sentuhan sebelum Bibble melirik sendiri

const css = `
.bibble-live { position: relative; transition: transform 0.25s ease-out; }
.bibble-jump { cursor: pointer; }
.bibble-jump.jumping { animation: bibble-jump 0.6s ease-out; }
.bibble-live .bibble-eye { transition: transform 0.08s ease-out; }
.bibble-live .bibble-eye.blink { transform: scaleY(0.1); }
.bibble-heart {
  position: absolute; left: 50%; top: 0; pointer-events: none;
  font-size: 20px; animation: bibble-heart 1s ease-out forwards;
}
@keyframes bibble-jump {
  0%   { transform: translateY(0) scale(1, 1); }
  25%  { transform: translateY(0) scale(1.08, 0.9); }
  55%  { transform: translateY(-28px) scale(0.95, 1.07); }
  80%  { transform: translateY(0) scale(1.06, 0.94); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes bibble-heart {
  0%   { opacity: 1; transform: translate(var(--hx), 0) scale(0.6); }
  100% { opacity: 0; transform: translate(var(--hx), -70px) scale(1.2); }
}
`;

export default function Bibble() {
  const bodyRef = useRef(null);
  const lastActive = useRef(0);
  const heartId = useRef(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [hearts, setHearts] = useState([]);

  // Ikuti kursor / jari
  useEffect(() => {
    const lookAt = (clientX, clientY) => {
      const el = bodyRef.current;
      if (!el) return;
      lastActive.current = Date.now();
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const power = Math.min(dist / 120, 1) * MAX_MOVE;
      setLook({ x: (dx / dist) * power, y: (dy / dist) * power });
    };
    const onPointer = (e) => lookAt(e.clientX, e.clientY);
    const onTouch = (e) => {
      const t = e.touches[0];
      if (t) lookAt(t.clientX, t.clientY);
    };
    const onEnd = () => {
      lastActive.current = Date.now();
      setLook({ x: 0, y: 0 });
    };

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

  // Berkedip acak
  useEffect(() => {
    let t1, t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => {
          setBlink(false);
          loop();
        }, 140);
      }, 1800 + Math.random() * 3200);
    };
    loop();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Melirik sendiri kalau lama tidak disentuh
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastActive.current > IDLE_AFTER) {
        setLook({
          x: (Math.random() * 2 - 1) * MAX_MOVE,
          y: (Math.random() * 2 - 1) * MAX_MOVE * 0.6,
        });
      }
    }, 1600);
    return () => clearInterval(id);
  }, []);

  // Diketuk: lompat + hati
  const onTap = () => {
    setJumping(false);
    requestAnimationFrame(() => setJumping(true));
    setTimeout(() => setJumping(false), 650);

    const id = heartId.current++;
    const hx = `${Math.round((Math.random() * 2 - 1) * 30)}px`;
    setHearts((h) => [...h, { id, hx }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1000);
  };

  const pupilStyle = {
    transform: `translate(${look.x}px, ${look.y}px)`,
    transition: "transform 0.08s ease-out",
  };
  const leanStyle = {
    transform: `translate(${look.x * 0.6}px, ${look.y * 0.4}px) rotate(${(look.x / MAX_MOVE) * 5}deg)`,
  };

  return (
    <div className="dashboard-bibble bibble-css">
      <style>{css}</style>
      <div className="bibble-live" style={leanStyle}>
        {hearts.map((h) => (
          <span key={h.id} className="bibble-heart" style={{ "--hx": h.hx }}>
            💖
          </span>
        ))}
        <div
          className={`bibble-jump${jumping ? " jumping" : ""}`}
          onClick={onTap}
        >
          <div className="bibble-body" ref={bodyRef}>
            <div className="bibble-ear ear-left" />
            <div className="bibble-ear ear-right" />
            <div className="bibble-wing wing-left">✦</div>
            <div className="bibble-wing wing-right">✦</div>

            <div className="bibble-face">
              <div className={`bibble-eye eye-left${blink ? " blink" : ""}`}>
                <span style={pupilStyle} />
              </div>
              <div className={`bibble-eye eye-right${blink ? " blink" : ""}`}>
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
        </div>
      </div>
      <div className="bibble-shadow" />
    </div>
  );
}