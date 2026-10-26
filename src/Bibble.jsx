import { useEffect, useRef, useState } from "react";

const MAX_MOVE = 9;           // jarak maksimal bola mata (px)
const IDLE_AFTER = 2500;      // ms tanpa sentuhan sebelum Bibble melirik sendiri
const LOW_BALANCE = 10000;    // saldo di bawah ini bikin Bibble menangis
const RUB_START = 70;         // jarak usapan (px) sebelum Bibble senang
const RUB_STEP = 55;          // tiap berapa px usapan keluar hati baru
const TAP_MAX_MS = 350;       // ketukan harus lebih cepat dari ini
const SLAP_TAPS = 3;          // jumlah ketukan cepat = tabok
const SLAP_WINDOW = 1200;     // dalam rentang waktu ini (ms)

const PET_EMOJI = ["💖", "💕", "💗", "✨"];
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const css = `
.bibble-live { position: relative; transition: transform 0.25s ease-out; }
.bibble-jump {
  cursor: grab; touch-action: none; user-select: none;
  -webkit-user-select: none; -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.bibble-jump:active { cursor: grabbing; }
.bibble-jump.anim-jump  { animation: bibble-jump 0.6s ease-out; }
.bibble-jump.anim-shake { animation: bibble-slap 0.55s ease-out; }

/* mata */
.bibble-live .bibble-eye {
  transition: transform 0.08s ease-out, height 0.15s ease, top 0.15s ease, background 0.15s ease;
}
.bibble-live .bibble-eye.blink { transform: scaleY(0.1); }
.bibble-live .bibble-eye.droop { transform: translateY(2px) scaleY(0.88); }
.bibble-live .bibble-eye.squint { transform: scaleY(0.2); }
.bibble-live .bibble-eye.happy {
  height: 24px; top: 24px; background: transparent;
  border-color: transparent; border-top-color: #49356e; border-width: 5px;
}
.bibble-live .bibble-eye.happy span { opacity: 0; }

/* alis */
.bibble-live .bibble-brow {
  position: absolute; top: 0; width: 32px; height: 5px; border-radius: 5px;
  background: #49356e; opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.bibble-live .brow-left  { left: 53px; }
.bibble-live .brow-right { right: 53px; }
.mood-sad .bibble-live .brow-left   { opacity: 1; transform: rotate(-18deg); }
.mood-sad .bibble-live .brow-right  { opacity: 1; transform: rotate(18deg); }
.mood-hurt .bibble-live .brow-left  { opacity: 1; transform: translateY(4px) rotate(-26deg); }
.mood-hurt .bibble-live .brow-right { opacity: 1; transform: translateY(4px) rotate(26deg); }

/* mulut */
.bibble-live .bibble-mouth { transition: all 0.2s ease; }
.bibble-live .bibble-mouth.m-sad {
  border-bottom: 0; border-top: 3px solid #49356e; top: 73px; height: 9px;
}
.bibble-live .bibble-mouth.m-hurt {
  width: 24px; height: 22px; left: calc(50% - 12px); top: 64px;
  border: 3px solid #49356e; border-radius: 50% 50% 45% 45%; background: #e0577f;
  animation: bibble-wail 0.3s ease-in-out infinite alternate;
}
.bibble-live .bibble-mouth.m-happy {
  width: 30px; height: 16px; left: calc(50% - 15px); top: 66px;
  border: 3px solid #49356e; border-top: 0; border-radius: 0 0 30px 30px; background: #ff8fb0;
}

/* pipi */
.bibble-live .bibble-cheek { transition: transform 0.25s ease, background 0.25s ease; }
.mood-happy .bibble-live .bibble-cheek { transform: scale(1.35); }
.mood-hurt .bibble-live .bibble-cheek  { background: #ff5f8f; transform: scale(1.2); }

/* air mata */
.bibble-live .bibble-tear {
  position: absolute; top: 58px; width: 10px; height: 14px; opacity: 0;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: #9be7ff; border: 1.5px solid #5cc3ee; pointer-events: none;
  animation: bibble-tear 1.5s ease-in infinite;
}
.bibble-live .tear-l1 { left: 62px; }
.bibble-live .tear-l2 { left: 73px; animation-delay: 0.75s; }
.bibble-live .tear-r1 { right: 62px; animation-delay: 0.3s; }
.bibble-live .tear-r2 { right: 73px; animation-delay: 1.05s; }
.mood-hurt .bibble-live .bibble-tear { animation-duration: 0.75s; }

/* badan */
.mood-sad .bibble-body {
  filter: saturate(0.7) brightness(0.96);
  animation: bibble-sob 2.4s ease-in-out infinite;
}
.mood-hurt .bibble-body { filter: saturate(0.85); }
.mood-happy .bibble-body { animation: bibble-purr 0.5s ease-in-out infinite; }

/* hati / efek */
.bibble-heart {
  position: absolute; left: 50%; top: 0; pointer-events: none;
  font-size: 22px; animation: bibble-heart 1s ease-out forwards;
}

/* ucapan */
.bibble-talk {
  margin-top: 8px; min-height: 58px; display: flex; flex-direction: column;
  align-items: center; gap: 6px; text-align: center; padding: 0 10px;
}
.bibble-bubble {
  background: #fff; border: 2px solid #e5dcf7; color: #5a536d;
  font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 16px;
  box-shadow: 0 3px 0 #eee5f7; max-width: 100%;
  animation: bibble-bubble 0.4s cubic-bezier(.34, 1.56, .64, 1);
}
.bibble-hint { font-size: 10px; font-weight: 700; color: #a59cb5; }

@keyframes bibble-jump {
  0%   { transform: translateY(0) scale(1, 1); }
  25%  { transform: translateY(0) scale(1.08, 0.9); }
  55%  { transform: translateY(-28px) scale(0.95, 1.07); }
  80%  { transform: translateY(0) scale(1.06, 0.94); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes bibble-slap {
  0%   { transform: translateX(0) rotate(0); }
  12%  { transform: translateX(-22px) rotate(-9deg); }
  30%  { transform: translateX(16px) rotate(6deg); }
  48%  { transform: translateX(-11px) rotate(-4deg); }
  66%  { transform: translateX(7px) rotate(2deg); }
  100% { transform: translateX(0) rotate(0); }
}
@keyframes bibble-heart {
  0%   { opacity: 1; transform: translate(var(--hx), 0) scale(0.6); }
  100% { opacity: 0; transform: translate(var(--hx), -80px) scale(1.25); }
}
@keyframes bibble-tear {
  0%   { opacity: 0; translate: 0 0; scale: 0.5; }
  20%  { opacity: 1; scale: 1; }
  100% { opacity: 0; translate: 0 56px; scale: 0.9; }
}
@keyframes bibble-sob {
  0%, 100% { translate: 0 3px; scale: 1 0.985; }
  10%      { translate: 1px 6px; scale: 1 0.96; }
  20%      { translate: -1px 3px; scale: 1 0.985; }
  30%      { translate: 1px 6px; scale: 1 0.96; }
  45%      { translate: 0 3px; scale: 1 0.985; }
}
@keyframes bibble-purr {
  0%, 100% { rotate: -2deg; scale: 1 1; }
  50%      { rotate: 2deg; scale: 1.03 0.98; }
}
@keyframes bibble-wail {
  from { scale: 1 1; }
  to   { scale: 1.1 0.85; }
}
@keyframes bibble-bubble {
  from { opacity: 0; transform: translateY(6px) scale(0.9); }
  to   { opacity: 1; transform: none; }
}
`;

export default function Bibble({ balance }) {
  const bodyRef = useRef(null);
  const lastActive = useRef(0);
  const fxId = useRef(0);
  const moodTimer = useRef(null);
  const animTimer = useRef(null);
  const press = useRef(null);
  const taps = useRef([]);
  const moodRef = useRef("normal");

  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [anim, setAnim] = useState(null);
  const [temp, setTemp] = useState(null); // "happy" | "hurt" | null
  const [fx, setFx] = useState([]);

  const sad = typeof balance === "number" && balance < LOW_BALANCE;
  const mood = temp ?? (sad ? "sad" : "normal");
  moodRef.current = mood;
  const crying = mood === "sad" || mood === "hurt";

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

  // Melirik sendiri (hanya saat biasa-biasa saja)
  useEffect(() => {
    const id = setInterval(() => {
      if (moodRef.current !== "normal") return;
      if (Date.now() - lastActive.current > IDLE_AFTER) {
        setLook({
          x: (Math.random() * 2 - 1) * MAX_MOVE,
          y: (Math.random() * 2 - 1) * MAX_MOVE * 0.6,
        });
      }
    }, 1600);
    return () => clearInterval(id);
  }, []);

  // Bersihkan timer saat komponen hilang
  useEffect(
    () => () => {
      clearTimeout(moodTimer.current);
      clearTimeout(animTimer.current);
    },
    []
  );

  const spawnFx = (emoji) => {
    const id = fxId.current++;
    const hx = `${Math.round((Math.random() * 2 - 1) * 40)}px`;
    setFx((f) => [...f.slice(-8), { id, emoji, hx }]);
    setTimeout(() => setFx((f) => f.filter((x) => x.id !== id)), 1000);
  };

  const setMood = (m, ms) => {
    clearTimeout(moodTimer.current);
    setTemp(m);
    moodTimer.current = setTimeout(() => setTemp(null), ms);
  };

  const playAnim = (name, ms) => {
    clearTimeout(animTimer.current);
    setAnim(null);
    requestAnimationFrame(() => setAnim(name));
    animTimer.current = setTimeout(() => setAnim(null), ms);
  };

  const slap = () => {
    setMood("hurt", 3200);
    playAnim("shake", 600);
    spawnFx("💢");
    try {
      navigator.vibrate?.(60);
    } catch {
      /* abaikan */
    }
  };

  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < SLAP_WINDOW), now];
    if (taps.current.length >= SLAP_TAPS) {
      taps.current = [];
      slap();
    } else {
      playAnim("jump", 650);
      spawnFx("💖");
    }
  };

  // Tahan lalu usap = dielus, ketuk cepat = colek / tabok
  const onDown = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* abaikan */
    }
    press.current = { x: e.clientX, y: e.clientY, t: Date.now(), rub: 0, next: RUB_START };
  };
  const onMove = (e) => {
    const p = press.current;
    if (!p) return;
    p.rub += Math.hypot(e.clientX - p.x, e.clientY - p.y);
    p.x = e.clientX;
    p.y = e.clientY;
    if (p.rub >= p.next) {
      p.next = p.rub + RUB_STEP;
      setMood("happy", 2200);
      spawnFx(PET_EMOJI[Math.floor(Math.random() * PET_EMOJI.length)]);
    }
  };
  const onUp = () => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (p.rub < 12 && Date.now() - p.t < TAP_MAX_MS) onTap();
  };
  const onCancel = () => {
    press.current = null;
  };

  const eyeCls = (side) =>
    [
      "bibble-eye",
      side,
      mood === "happy" && "happy",
      mood === "hurt" && "squint",
      mood === "sad" && "droop",
      blink && (mood === "normal" || mood === "sad") && "blink",
    ]
      .filter(Boolean)
      .join(" ");

  const px = mood === "sad" ? look.x * 0.5 : look.x;
  const py = mood === "sad" ? Math.min(MAX_MOVE, Math.max(look.y, 0) + 5) : look.y;
  const pupilStyle = {
    transform: `translate(${px}px, ${py}px)`,
    transition: "transform 0.08s ease-out",
  };
  const leanStyle =
    mood === "normal"
      ? {
          transform: `translate(${look.x * 0.6}px, ${look.y * 0.4}px) rotate(${(look.x / MAX_MOVE) * 5}deg)`,
        }
      : undefined;

  const text =
    mood === "hurt"
      ? "Aduh! Sakit tau... huhuhu 😭"
      : mood === "happy"
      ? sad
        ? "Makasih udah dielus... aku jadi agak tenang 🥹"
        : "Hehe, enak banget dielus~ 🥰"
      : mood === "sad"
      ? balance < 0
        ? `Saldomu minus ${rupiah(Math.abs(balance))}... huhu 😢`
        : `Saldomu tinggal ${rupiah(balance)}... huhu 😢`
      : "Halo! Yuk atur uangmu hari ini 💜";

  return (
    <div className={`dashboard-bibble bibble-css mood-${mood}`}>
      <style>{css}</style>
      <div className="bibble-live" style={leanStyle}>
        {fx.map((h) => (
          <span key={h.id} className="bibble-heart" style={{ "--hx": h.hx }}>
            {h.emoji}
          </span>
        ))}
        <div
          className={`bibble-jump${anim ? ` anim-${anim}` : ""}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
        >
          <div className="bibble-body" ref={bodyRef}>
            <div className="bibble-ear ear-left" />
            <div className="bibble-ear ear-right" />
            <div className="bibble-wing wing-left">✦</div>
            <div className="bibble-wing wing-right">✦</div>

            <div className="bibble-face">
              <span className="bibble-brow brow-left" />
              <span className="bibble-brow brow-right" />
              <div className={eyeCls("eye-left")}>
                <span style={pupilStyle} />
              </div>
              <div className={eyeCls("eye-right")}>
                <span style={pupilStyle} />
              </div>
              <div className="bibble-cheek cheek-left" />
              <div className="bibble-cheek cheek-right" />
              <div className={`bibble-mouth m-${mood}`} />
              {crying && (
                <>
                  <span className="bibble-tear tear-l1" />
                  <span className="bibble-tear tear-l2" />
                  <span className="bibble-tear tear-r1" />
                  <span className="bibble-tear tear-r2" />
                </>
              )}
            </div>

            <div className="bibble-belly" />
            <div className="bibble-foot foot-left" />
            <div className="bibble-foot foot-right" />
          </div>
        </div>
      </div>
      <div className="bibble-shadow" />
      <div className="bibble-talk">
        <div className="bibble-bubble" key={text}>
          {text}
        </div>
        <div className="bibble-hint">Tahan &amp; usap aku 🥰 · Ketuk 3x cepat = tabok 💢</div>
      </div>
    </div>
  );
}
