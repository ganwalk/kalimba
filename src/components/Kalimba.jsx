import React, { useState, useRef, useCallback } from 'react'

/* ================================================================
   STYLES  —  inlined so the component is self-contained
   ================================================================ */
const CSS = `
/* ── Scene / Stage ─────────────────────────────────────────────── */
.kb-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 48px 24px;
  background: radial-gradient(
    ellipse 75% 55% at 42% 35%,
    #1f1b14 0%, #110e09 48%, #060504 100%
  );
  position: relative;
  overflow: hidden;
}
.kb-scene::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(
    ellipse 60% 40% at 50% 100%,
    rgba(80, 50, 15, 0.12) 0%, transparent 70%
  );
  pointer-events: none;
}

/* ── Instrument Body ────────────────────────────────────────────── */
.kb-body {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background:
    repeating-linear-gradient(
      89.3deg,
      transparent 0px, transparent 32px,
      rgba(188, 110, 42, 0.072) 32px, rgba(188, 110, 42, 0.072) 34px,
      transparent 34px, transparent 46px,
      rgba(0, 0, 0, 0.050) 46px, rgba(0, 0, 0, 0.050) 47px
    ),
    repeating-linear-gradient(
      90.6deg,
      transparent 0px, transparent 76px,
      rgba(204, 130, 54, 0.054) 76px, rgba(204, 130, 54, 0.054) 79px
    ),
    radial-gradient(
      ellipse 90% 84% at 37% 29%,
      #cc7c3e 0%, #ac602c 14%, #8a441a 30%, #6a3010 48%,
      #4e200a 66%, #381608 82%, #260e04 93%, #1c0a02 100%
    );
  box-shadow:
     8px 18px 54px rgba(0, 0, 0, 0.84),
     4px  9px 26px rgba(0, 0, 0, 0.74),
     2px  4px 10px rgba(0, 0, 0, 0.60),
    inset  0   3px  6px rgba(215, 170, 102, 0.38),
    inset  3px  0   5px rgba(208, 160,  92, 0.20),
    inset  0  -5px 10px rgba(0, 0, 0, 0.62),
    inset -3px  0   7px rgba(0, 0, 0, 0.40),
    inset  0   0   58px rgba(0, 0, 0, 0.24);
  border: 1.5px solid rgba(138, 68, 16, 0.44);
  user-select: none;
}

/* ── Varnish Gloss Overlay ──────────────────────────────────────── */
.kb-varnish {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    128deg,
    rgba(255, 228, 162, 0.16)  0%,
    rgba(255, 215, 128, 0.08) 22%,
    rgba(255, 200,  98, 0.04) 42%,
    transparent 62%
  );
  pointer-events: none;
  z-index: 20;
}

/* ── Brand Engraving ────────────────────────────────────────────── */
.kb-title {
  position: absolute;
  top: 22px; left: 0; right: 0;
  text-align: center;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 7px;
  text-transform: uppercase;
  color: rgba(212, 172, 88, 0.56);
  text-shadow:
    -1px -1px 0   rgba(0,   0,   0,   0.68),
     1px  1px 1px rgba(255, 230, 148, 0.28);
  pointer-events: none;
  z-index: 15;
}
.kb-subtitle {
  position: absolute;
  bottom: 20px; left: 0; right: 0;
  text-align: center;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 8px;
  letter-spacing: 3.5px;
  text-transform: uppercase;
  color: rgba(188, 148, 68, 0.36);
  text-shadow:
    -0.5px -0.5px 0   rgba(0,   0,   0,   0.58),
     0.5px  0.5px 0   rgba(255, 218, 108, 0.22);
  pointer-events: none;
  z-index: 15;
}

/* ── Decorative Inlay Lines ─────────────────────────────────────── */
.kb-inlay {
  position: absolute;
  left: 32px; right: 32px;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(172, 108, 35, 0.30) 12%, rgba(196, 136, 52, 0.42) 50%,
    rgba(172, 108, 35, 0.30) 88%, transparent
  );
  box-shadow:
     0  1px 0 rgba(0,   0,   0,   0.30),
     0 -1px 0 rgba(255, 198, 92,  0.14);
  pointer-events: none;
  z-index: 5;
}

/* ── Bridge / Z-Bracket ─────────────────────────────────────────── */
.kb-bridge {
  position: absolute;
  border-radius: 5px;
  z-index: 7;
  background: linear-gradient(
    to bottom,
    #f4f4f4  0%, #ffffff  4%, #eeeeee 10%, #d4d4d4 20%,
    #bcbcbc 30%, #c8c8c8 40%, #dcdcdc 50%, #eaeaea 58%,
    #cccccc 68%, #aaaaaa 78%, #bcbcbc 88%, #cecece 100%
  );
  box-shadow:
     0  7px 20px rgba(0, 0, 0, 0.72),
     0  3px  9px rgba(0, 0, 0, 0.56),
     0  1px  3px rgba(0, 0, 0, 0.42),
    inset  0   1.5px  3.5px rgba(255, 255, 255, 1.00),
    inset  0  -1.5px  3px   rgba(0,   0,   0,   0.52),
    inset  2px  0     4px   rgba(255, 255, 255, 0.48),
    inset -2px  0     4px   rgba(0,   0,   0,   0.24);
}
.kb-bridge-groove {
  position: absolute;
  top: 44%; left: 3%; right: 3%;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(
    to right,
    transparent, rgba(0, 0, 0, 0.30) 8%,
    rgba(0, 0, 0, 0.40) 50%, rgba(0, 0, 0, 0.30) 92%, transparent
  );
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.68);
}

/* ── Bridge Bolt Heads ──────────────────────────────────────────── */
.kb-bolt {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 9px; height: 9px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 32% 32%,
    #f6f6f6 0%, #d2d2d2 32%, #aaaaaa 58%, #848484 80%, #646464 100%
  );
  box-shadow:
    inset -1px  -1px  2px   rgba(0,   0,   0,   0.54),
    inset  1px   1px  2.5px rgba(255, 255, 255, 0.72),
           0    1.5px 3px   rgba(0,   0,   0,   0.58);
}
.kb-bolt::before,
.kb-bolt::after {
  content: '';
  position: absolute;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 0.5px;
}
.kb-bolt::before {
  top: 50%; left: 16%; right: 16%;
  height: 1.5px;
  transform: translateY(-50%);
}
.kb-bolt::after {
  left: 50%; top: 16%; bottom: 16%;
  width: 1.5px;
  transform: translateX(-50%);
}

/* ── Sound Hole ─────────────────────────────────────────────────── */
.kb-hole {
  position: absolute;
  width: 90px; height: 90px;
  border-radius: 50%;
  z-index: 2;
  background: radial-gradient(
    circle at 35% 32%,
    #040101 0%, #0c0404 40%, #180a06 70%, #261108 100%
  );
  box-shadow:
    inset  0   0   35px rgba(0, 0, 0, 0.99),
    inset  0   8px 24px rgba(0, 0, 0, 0.97),
    inset  0  -6px 16px rgba(0, 0, 0, 0.94),
    inset  7px  0  18px rgba(0, 0, 0, 0.90),
    inset -7px  0  18px rgba(0, 0, 0, 0.90),
     0  0  0  3.5px rgba(152,  78, 20, 0.54),
     0  0  0  7px   rgba( 52,  20,  5, 0.64),
     3px 5px 14px rgba(0, 0, 0, 0.58),
    -2px -3px  5px rgba(218, 162, 78, 0.17);
}

/* ── Tines ──────────────────────────────────────────────────────── */
.kb-tine {
  position: absolute;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition:
    transform 0.46s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter    0.12s ease;
  z-index: 4;
}
.kb-tine:hover {
  filter: brightness(1.20) drop-shadow(0 0 5px rgba(200, 218, 255, 0.44));
}
.kb-tine.pressed,
.kb-tine.pressed:hover {
  transition: transform 0.04s ease-out;
  transform: translateY(6px) !important;
  filter: brightness(0.92) !important;
}

/* Chrome cylinder — linear gradient simulates curved metal reflection */
.kb-tine-body {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    to right,
    #484848  0%, #686868  6%, #929292 14%, #b8b8b8 22%,
    #d6d6d6 30%, #eaeaea 38%, #f6f6f6 45%, #ffffff 50%,
    #f8f8f8 55%, #ececec 62%, #d4d4d4 70%, #b4b4b4 78%,
    #888888 87%, #646464 94%, #484848 100%
  );
  box-shadow:
    -1.5px  0     3px   rgba(0,   0,   0,   0.44),
     1.5px  0     2.5px rgba(0,   0,   0,   0.18),
     0     -3px   7px   rgba(255, 255, 255, 0.42),
     1px    4px  14px   rgba(0,   0,   0,   0.44);
}

/* Specular highlight strip — runs along the tine length */
.kb-tine-spec {
  position: absolute;
  left: 25%;
  width: 16%;
  border-radius: 4px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.94)  0%,
    rgba(255, 255, 255, 0.60) 35%,
    rgba(255, 255, 255, 0.18) 75%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* Engraved note label */
.kb-note {
  position: absolute;
  top: 5px; left: 0; right: 0;
  text-align: center;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 900;
  font-size: 8px;
  line-height: 1;
  pointer-events: none;
  z-index: 3;
}
.kb-note.is-c {
  color: #b87820;
  text-shadow:
    -0.5px -0.5px  0   rgba(60,  20,   0,  0.64),
     0.8px  0.8px  1px rgba(255, 220, 98,  0.74);
}
.kb-note.is-regular {
  color: #464646;
  text-shadow:
    -0.5px -0.5px  0 rgba(0,   0,   0,   0.60),
     0.8px  0.8px  0 rgba(255, 255, 255, 0.92);
}

/* Gold registration dot on C notes */
.kb-c-dot {
  position: absolute;
  top: 17px; left: 50%;
  transform: translateX(-50%);
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #c07818;
  box-shadow:
    -0.5px -0.5px 0 rgba(0,   0,   0,   0.44),
     0.5px  0.5px 0 rgba(255, 200, 78,  0.64);
  pointer-events: none;
  z-index: 3;
}
`

/* ================================================================
   LAYOUT CONSTANTS
   ================================================================ */
const NUM_TINES  = 17
const CENTER     = 8

const BODY_W     = 640
const BODY_H     = 542

const TINE_W     = 20
const TINE_GAP   = 4
const TINE_STEP  = TINE_W + TINE_GAP

const MAX_FREE   = 196
const MIN_FREE   = 58
const TINE_EXT   = 22

const BRIDGE_H   = 36
const BRIDGE_BOT = 342
const BRIDGE_TOP = BRIDGE_BOT - BRIDGE_H

const TINE_SPAN  = NUM_TINES * TINE_W + (NUM_TINES - 1) * TINE_GAP
const TINE_OX    = (BODY_W - TINE_SPAN) / 2

/* ================================================================
   TINE DATA  —  standard 17-key C-major kalimba layout
   Index 8 = C4 (centre / longest). Going outward, notes alternate
   left / right and ascend, creating the arch of tine lengths.
   ================================================================ */
const TINES = [
  { note: 'D', octave: 6, freq: 1174.66 },
  { note: 'B', octave: 5, freq:  987.77 },
  { note: 'G', octave: 5, freq:  783.99 },
  { note: 'E', octave: 5, freq:  659.25 },
  { note: 'C', octave: 5, freq:  523.25 },
  { note: 'A', octave: 4, freq:  440.00 },
  { note: 'F', octave: 4, freq:  349.23 },
  { note: 'D', octave: 4, freq:  293.66 },
  { note: 'C', octave: 4, freq:  261.63 },  // CENTRE (longest)
  { note: 'E', octave: 4, freq:  329.63 },
  { note: 'G', octave: 4, freq:  392.00 },
  { note: 'B', octave: 4, freq:  493.88 },
  { note: 'D', octave: 5, freq:  587.33 },
  { note: 'F', octave: 5, freq:  698.46 },
  { note: 'A', octave: 5, freq:  880.00 },
  { note: 'C', octave: 6, freq: 1046.50 },
  { note: 'E', octave: 6, freq: 1318.51 },
]

/* ================================================================
   AUDIO HOOK  —  authentic kalimba synthesis via Web Audio API

   A real tine produces:
     • A fundamental with slight pitch-glide (the "twang")
     • An inharmonic overtone ~2.75× (characteristic of metal tines)
     • A high percussive click at ~5× (thumb-nail strike)
   All three have independent gain envelopes — fast attack + decay
   into a slow exponential ring-out, matching the acoustic profile.
   ================================================================ */
function useKalimbaAudio() {
  const ctxRef = useRef(null)

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const playNote = useCallback((freq) => {
    const ctx = ensureCtx()
    const t   = ctx.currentTime

    const o1 = ctx.createOscillator()   // fundamental
    const o2 = ctx.createOscillator()   // inharmonic overtone
    const o3 = ctx.createOscillator()   // click partial

    o1.type = 'triangle'
    o1.frequency.setValueAtTime(freq * 1.0018, t)
    o1.frequency.exponentialRampToValueAtTime(freq, t + 0.048)

    o2.type = 'sine'
    o2.frequency.setValueAtTime(freq * 2.754, t)

    o3.type = 'sine'
    o3.frequency.setValueAtTime(freq * 5.06, t)

    const g1 = ctx.createGain(), g2 = ctx.createGain()
    const g3 = ctx.createGain(), master = ctx.createGain()

    g1.gain.setValueAtTime(0, t)
    g1.gain.linearRampToValueAtTime(0.64, t + 0.0007)
    g1.gain.exponentialRampToValueAtTime(0.28, t + 0.072)
    g1.gain.exponentialRampToValueAtTime(0.001, t + 3.2)

    g2.gain.setValueAtTime(0, t)
    g2.gain.linearRampToValueAtTime(0.17, t + 0.001)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.68)

    g3.gain.setValueAtTime(0, t)
    g3.gain.linearRampToValueAtTime(0.09, t + 0.0004)
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.075)

    master.gain.value = 0.62

    o1.connect(g1);   g1.connect(master)
    o2.connect(g2);   g2.connect(master)
    o3.connect(g3);   g3.connect(master)
    master.connect(ctx.destination)

    const end = t + 3.6
    ;[o1, o2, o3].forEach(o => { o.start(t); o.stop(end) })
  }, [ensureCtx])

  return playNote
}

/* ================================================================
   TINE COMPONENT
   ================================================================ */
function Tine({ tine, idx, onPlay }) {
  const [pressed, setPressed] = useState(false)

  const dist    = Math.abs(idx - CENTER)
  const freeLen = MAX_FREE - dist * (MAX_FREE - MIN_FREE) / CENTER
  const tipY    = BRIDGE_BOT - freeLen
  const totalH  = freeLen + TINE_EXT
  const leftX   = TINE_OX + idx * TINE_STEP
  const isC     = tine.note === 'C'

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    setPressed(true)
    onPlay(tine.freq)
    setTimeout(() => setPressed(false), 65)
  }, [tine.freq, onPlay])

  return (
    <div
      className={`kb-tine${pressed ? ' pressed' : ''}`}
      style={{ left: leftX, top: tipY, width: TINE_W, height: totalH }}
      onPointerDown={handlePointerDown}
      onPointerLeave={() => setPressed(false)}
    >
      <div
        className="kb-tine-body"
        style={{ borderRadius: `${TINE_W / 2}px ${TINE_W / 2}px 3px 3px` }}
      />
      <div className="kb-tine-spec" style={{ top: 10, bottom: TINE_EXT + 5 }} />
      <div className={`kb-note ${isC ? 'is-c' : 'is-regular'}`}>{tine.note}</div>
      {isC && <div className="kb-c-dot" />}
    </div>
  )
}

/* ================================================================
   MAIN KALIMBA COMPONENT
   ================================================================ */
export default function Kalimba() {
  const playNote   = useKalimbaAudio()
  const bridgeLeft  = TINE_OX - 24
  const bridgeRight = BODY_W - (TINE_OX + TINE_SPAN + 24)

  return (
    <>
      <style>{CSS}</style>

      <div className="kb-scene">
        <div className="kb-body" style={{ width: BODY_W, height: BODY_H }}>

          <div className="kb-varnish" />
          <div className="kb-title">✦ Kalimba ✦</div>
          <div className="kb-inlay" style={{ top: 60 }} />

          {TINES.map((t, i) => (
            <Tine key={i} tine={t} idx={i} onPlay={playNote} />
          ))}

          <div
            className="kb-bridge"
            style={{ top: BRIDGE_TOP, left: bridgeLeft, right: bridgeRight, height: BRIDGE_H }}
          >
            <div className="kb-bridge-groove" />
            {[0.10, 0.28, 0.50, 0.72, 0.90].map((pos, i) => (
              <div key={i} className="kb-bolt" style={{ left: `${pos * 100}%` }} />
            ))}
          </div>

          <div
            className="kb-hole"
            style={{ bottom: 74, left: '50%', transform: 'translateX(-50%)' }}
          />

          <div className="kb-inlay" style={{ bottom: 50 }} />
          <div className="kb-subtitle">17 Keys · C Major · Handcrafted</div>

        </div>
      </div>
    </>
  )
}
