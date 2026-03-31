import React, { useState, useRef, useCallback } from 'react'
import './Kalimba.css'

/* ================================================================
   LAYOUT CONSTANTS
   ================================================================ */
const NUM_TINES  = 17
const CENTER     = 8        // index of the central (longest) tine

const BODY_W     = 640      // body width  px
const BODY_H     = 542      // body height px

const TINE_W     = 20       // tine width  px
const TINE_GAP   = 4        // gap between tines
const TINE_STEP  = TINE_W + TINE_GAP   // 24

const MAX_FREE   = 196      // central tine free length above bridge
const MIN_FREE   = 58       // outer tine free length above bridge
const TINE_EXT   = 22       // tine extension below bridge (hidden)

const BRIDGE_H   = 36       // bridge bar thickness
const BRIDGE_BOT = 342      // bridge bottom-edge y from body top
const BRIDGE_TOP = BRIDGE_BOT - BRIDGE_H   // 306

// Horizontal tine span and left-margin so tines are centred
const TINE_SPAN  = NUM_TINES * TINE_W + (NUM_TINES - 1) * TINE_GAP   // 404
const TINE_OX    = (BODY_W - TINE_SPAN) / 2                           // 118

/* ================================================================
   TINE DATA  —  standard 17-key C-major kalimba layout
   Index 8 = C4 (centre / longest). Going outward, notes alternate
   left / right and ascend, creating the arch of tine lengths.
   ================================================================ */
const TINES = [
  { note: 'D', octave: 6, freq: 1174.66 },  //  0  outer-left  (shortest)
  { note: 'B', octave: 5, freq:  987.77 },  //  1
  { note: 'G', octave: 5, freq:  783.99 },  //  2
  { note: 'E', octave: 5, freq:  659.25 },  //  3
  { note: 'C', octave: 5, freq:  523.25 },  //  4
  { note: 'A', octave: 4, freq:  440.00 },  //  5
  { note: 'F', octave: 4, freq:  349.23 },  //  6
  { note: 'D', octave: 4, freq:  293.66 },  //  7
  { note: 'C', octave: 4, freq:  261.63 },  //  8  CENTRE (longest)
  { note: 'E', octave: 4, freq:  329.63 },  //  9
  { note: 'G', octave: 4, freq:  392.00 },  // 10
  { note: 'B', octave: 4, freq:  493.88 },  // 11
  { note: 'D', octave: 5, freq:  587.33 },  // 12
  { note: 'F', octave: 5, freq:  698.46 },  // 13
  { note: 'A', octave: 5, freq:  880.00 },  // 14
  { note: 'C', octave: 6, freq: 1046.50 },  // 15
  { note: 'E', octave: 6, freq: 1318.51 },  // 16 outer-right (shortest)
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
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const playNote = useCallback((freq) => {
    const ctx = ensureCtx()
    const t   = ctx.currentTime

    // ── Oscillators ──────────────────────────────────────────────
    const o1 = ctx.createOscillator()   // fundamental
    const o2 = ctx.createOscillator()   // inharmonic overtone
    const o3 = ctx.createOscillator()   // click partial

    // Triangle wave is warmer / more tine-like than pure sine
    o1.type = 'triangle'
    // Slight pitch glide: +0.18% → settles to true pitch in ~48 ms
    o1.frequency.setValueAtTime(freq * 1.0018, t)
    o1.frequency.exponentialRampToValueAtTime(freq, t + 0.048)

    o2.type = 'sine'
    o2.frequency.setValueAtTime(freq * 2.754, t)   // ~inharmonic 2nd partial

    o3.type = 'sine'
    o3.frequency.setValueAtTime(freq * 5.06, t)    // high click

    // ── Gain envelopes ───────────────────────────────────────────
    const g1     = ctx.createGain()
    const g2     = ctx.createGain()
    const g3     = ctx.createGain()
    const master = ctx.createGain()

    // Fundamental: near-instant attack → quick partial decay → long resonant ring
    g1.gain.setValueAtTime(0, t)
    g1.gain.linearRampToValueAtTime(0.64, t + 0.0007)
    g1.gain.exponentialRampToValueAtTime(0.28, t + 0.072)
    g1.gain.exponentialRampToValueAtTime(0.001, t + 3.2)

    // Inharmonic partial: fast decay (adds brightness early)
    g2.gain.setValueAtTime(0, t)
    g2.gain.linearRampToValueAtTime(0.17, t + 0.001)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.68)

    // Click: extremely fast (nail-strike transient)
    g3.gain.setValueAtTime(0, t)
    g3.gain.linearRampToValueAtTime(0.09, t + 0.0004)
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.075)

    master.gain.value = 0.62

    // ── Graph ────────────────────────────────────────────────────
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

  // Geometry – linear interpolation from centre outward
  const dist    = Math.abs(idx - CENTER)
  const freeLen = MAX_FREE - dist * (MAX_FREE - MIN_FREE) / CENTER
  const tipY    = BRIDGE_BOT - freeLen      // top of tine (px from body top)
  const totalH  = freeLen + TINE_EXT        // includes hidden portion below bridge
  const leftX   = TINE_OX + idx * TINE_STEP

  const isC = tine.note === 'C'

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    setPressed(true)
    onPlay(tine.freq)
    // Hold the pressed state briefly, then let the spring transition handle the return
    setTimeout(() => setPressed(false), 65)
  }, [tine.freq, onPlay])

  return (
    <div
      className={`kb-tine${pressed ? ' pressed' : ''}`}
      style={{
        left:   leftX,
        top:    tipY,
        width:  TINE_W,
        height: totalH,
      }}
      onPointerDown={handlePointerDown}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Chrome body — gradient simulates cylindrical reflection */}
      <div
        className="kb-tine-body"
        style={{ borderRadius: `${TINE_W / 2}px ${TINE_W / 2}px 3px 3px` }}
      />

      {/* Specular highlight strip (top section only, above bridge) */}
      <div
        className="kb-tine-spec"
        style={{ top: 10, bottom: TINE_EXT + 5 }}
      />

      {/* Engraved note name */}
      <div className={`kb-note ${isC ? 'is-c' : 'is-regular'}`}>
        {tine.note}
      </div>

      {/* Gold registration dot on all C notes (traditional kalimba marking) */}
      {isC && <div className="kb-c-dot" />}
    </div>
  )
}

/* ================================================================
   MAIN KALIMBA COMPONENT
   ================================================================ */
export default function Kalimba() {
  const playNote = useKalimbaAudio()

  // Bridge spans slightly wider than the tine cluster
  const bridgeLeft  = TINE_OX - 24
  const bridgeRight = BODY_W - (TINE_OX + TINE_SPAN + 24)

  return (
    /* ── Dark studio scene ── */
    <div className="kb-scene">

      {/* ── Instrument body ── */}
      <div className="kb-body" style={{ width: BODY_W, height: BODY_H }}>

        {/* Varnish gloss */}
        <div className="kb-varnish" />

        {/* Brand engraving */}
        <div className="kb-title">✦ Kalimba ✦</div>

        {/* Top decorative inlay */}
        <div className="kb-inlay" style={{ top: 60 }} />

        {/* ── 17 Tines ── */}
        {TINES.map((t, i) => (
          <Tine key={i} tine={t} idx={i} onPlay={playNote} />
        ))}

        {/* ── Bridge / Z-bracket (sits above tines in z-order) ── */}
        <div
          className="kb-bridge"
          style={{
            top:    BRIDGE_TOP,
            left:   bridgeLeft,
            right:  bridgeRight,
            height: BRIDGE_H,
          }}
        >
          <div className="kb-bridge-groove" />
          {[0.10, 0.28, 0.50, 0.72, 0.90].map((pos, i) => (
            <div key={i} className="kb-bolt" style={{ left: `${pos * 100}%` }} />
          ))}
        </div>

        {/* ── Sound hole ── */}
        <div
          className="kb-hole"
          style={{ bottom: 74, left: '50%', transform: 'translateX(-50%)' }}
        />

        {/* Bottom decorative inlay */}
        <div className="kb-inlay" style={{ bottom: 50 }} />

        {/* Subtitle */}
        <div className="kb-subtitle">17 Keys · C Major · Handcrafted</div>

      </div>
    </div>
  )
}
