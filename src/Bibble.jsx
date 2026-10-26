import { useEffect, useState } from "react";

export default function Bibble() {
  const [look, setLook] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 10;
      const y = (event.clientY / window.innerHeight - 0.5) * 8;
      setLook({ x, y });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
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
