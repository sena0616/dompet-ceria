import { useEffect, useState } from "react";

export default function Bibble() {
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const lookAt = (clientX, clientY) => {
      const x = (clientX / window.innerWidth - 0.5) * 10;
      const y = (clientY / window.innerHeight - 0.5) * 8;
      setLook({ x, y });
    };

    // Mouse, pena, dan jari yang menekan layar
    const onPointer = (event) => lookAt(event.clientX, event.clientY);

    // Jari yang menggeser layar (scroll): di HP, pointermove berhenti saat
    // halaman mulai bergulir, jadi kita pakai event sentuhan juga.
    const onTouch = (event) => {
      const touch = event.touches[0];
      if (touch) lookAt(touch.clientX, touch.clientY);
    };

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div className="dashboard-bibble bibble-css">
      <div className="bibble-body">
        <div className="bibble-ear ear-left" />
        <div className="bibble-ear ear-right" />
        <div className="bibble-wing wing-left">✦</div>
        <div className="bibble-wing wing-right">✦</div>

        <div className="bibble-face">
          <div className="bibble-eye eye-left">
            <span style={{ transform: `translate(${look.x}px, ${look.y}px)` }} />
          </div>
          <div className="bibble-eye eye-right">
            <span style={{ transform: `translate(${look.x}px, ${look.y}px)` }} />
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