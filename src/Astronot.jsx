import { useEffect, useRef, useState } from "react";
import "./Astronot.css";

const MAX_MOVE = 9;
const RUB_START = 70;
const RUB_STEP = 55;
const SLAP_WINDOW = 1200;

export default function Astronot() {
  const characterRef = useRef(null);
  const press = useRef(null);
  const taps = useRef([]);
  const timers = useRef({});
  const fxId = useRef(0);

  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [mood, setMood] = useState("normal");
  const [anim, setAnim] = useState("");
  const [effects, setEffects] = useState([]);
  const [landing, setLanding] = useState(false);

  useEffect(() => {

    setLanding(true);
    const timer = setTimeout(() => setLanding(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const follow = (x, y) => {
      const el = characterRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const power = Math.min(distance / 120, 1) * MAX_MOVE;
      setLook({ x: (dx / distance) * power, y: (dy / distance) * power });
    };

    const pointer = (e) => follow(e.clientX, e.clientY);
    const reset = () => setLook({ x: 0, y: 0 });

    window.addEventListener("pointermove", pointer);
    window.addEventListener("pointerdown", pointer);
    window.addEventListener("pointerup", reset);
    window.addEventListener("pointercancel", reset);

    return () => {
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerdown", pointer);
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("pointercancel", reset);
    };
  }, []);

  useEffect(() => {
    let timer;
    let next;
    const blinkLoop = () => {
      timer = setTimeout(() => {
        setBlink(true);
        next = setTimeout(() => {
          setBlink(false);
          blinkLoop();
        }, 140);
      }, 1800 + Math.random() * 3200);
    };
    blinkLoop();
    return () => {
      clearTimeout(timer);
      clearTimeout(next);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (press.current) return;
      setLook({
        x: (Math.random() * 2 - 1) * MAX_MOVE,
        y: (Math.random() * 2 - 1) * MAX_MOVE * 0.5,
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const spawn = (symbol) => {
    const id = fxId.current++;
    const hx = `${Math.round((Math.random() * 2 - 1) * 40)}px`;
    setEffects((old) => [...old.slice(-8), { id, symbol, hx }]);
    setTimeout(() => {
      setEffects((old) => old.filter((item) => item.id !== id));
    }, 1100);
  };

  const animate = (name, duration) => {
    clearTimeout(timers.current.anim);
    setAnim("");
    requestAnimationFrame(() => setAnim(name));
    timers.current.anim = setTimeout(() => setAnim(""), duration);
  };

  const temporaryMood = (name, duration) => {
    clearTimeout(timers.current.mood);
    setMood(name);
    timers.current.mood = setTimeout(() => setMood("normal"), duration);
  };

  const slap = () => {
    temporaryMood("hurt", 3000);
    animate("shake", 600);
    spawn("✦");
    try { navigator.vibrate?.(60); } catch {}
  };

  const tap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < SLAP_WINDOW), now];

    if (taps.current.length >= 3) {
      taps.current = [];
      slap();
    } else {
      animate("jump", 650);
      spawn("♡");
    }
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    press.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      distance: 0,
      next: RUB_START,
    };
  };

  const onMove = (e) => {
    const p = press.current;
    if (!p) return;

    p.distance += Math.hypot(e.clientX - p.x, e.clientY - p.y);
    p.x = e.clientX;
    p.y = e.clientY;

    if (p.distance >= p.next) {
      p.next = p.distance + RUB_STEP;
      temporaryMood("happy", 2200);
      spawn("♡");
    }
  };

  const onUp = () => {
    const p = press.current;
    press.current = null;
    if (p && p.distance < 12 && Date.now() - p.time < 350) tap();
  };

  const pupilStyle = {
    transform: `translate(${look.x}px, ${look.y}px)`,
  };

  const leanStyle = {
    transform: `translate(${look.x * 0.6}px, ${look.y * 0.4}px) rotate(${look.x / MAX_MOVE * 5}deg)`,
  };

  return (
    <div className={`astronaut-mascot astro-mood-${mood}`}>
      <div className="astro-interactive" style={leanStyle}>
        {effects.map((item) => (
          <span key={item.id} className="astro-heart" style={{ "--hx": item.hx }}>
            {item.symbol}
          </span>
        ))}

        <div
          className={`astro-character ${anim ? `astro-${anim}` : ""} ${landing ? "astro-landing" : ""}`}
          ref={characterRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => { press.current = null; }}
        >
          <div className="astro-backpack" />
          <div className="astro-arm astro-arm-left" />
          <div className="astro-arm astro-arm-right" />
          <div className="astro-hand astro-hand-left">✦</div>
          <div className="astro-hand astro-hand-right">✦</div>

          <div className="astro-helmet">
            <div className="astro-visor">
              <span className={`astro-eye eye-left ${blink ? "astro-blink" : ""}`}>
                <i style={pupilStyle} />
              </span>
              <span className={`astro-eye eye-right ${blink ? "astro-blink" : ""}`}>
                <i style={pupilStyle} />
              </span>
              <span className="astro-blush blush-left" />
              <span className="astro-blush blush-right" />
              <span className="astro-smile" />
              <span className="astro-shine" />
              {mood === "hurt" && <><span className="astro-tear tear-left" /><span className="astro-tear tear-right" /></>}
            </div>
            <div className="astro-ear ear-left" />
            <div className="astro-ear ear-right" />
          </div>

          <div className="astro-body">
            <div className="astro-chest">
              <span>✦</span><i /><i />
            </div>
          </div>
          <div className="astro-leg leg-left"><span /></div>
          <div className="astro-leg leg-right"><span /></div>
        </div>
      </div>

      <div className="astro-shadow" />
      <div className="astro-caption">
        {mood === "happy"
          ? "Hehe, enak banget dielus!"
          : mood === "hurt"
          ? "Aduh! Pelan-pelan dong..."
          : "Hai, penjelajah! Yuk hemat hari ini!"}
      </div>
      <div className="astro-hint">Tahan dan usap aku · Ketuk 3x cepat untuk menabok</div>
    </div>
  );
}




