import React from 'react'
import { AbsoluteFill, getInputProps, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import { loadFont as loadUnbounded } from '@remotion/google-fonts/Unbounded'
import { loadFont as loadSerif } from '@remotion/google-fonts/PTSerif'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat'

// ---------------------------------------------------------------------------------------------------------------
// Fonts. These four families cover Latin and Cyrillic. For another script (Greek, Arabic, CJK...) pick families that
// support it and change FONT_SUBSETS. An italic face also needs fontStyle: 'italic' in CSS: loadFont returns the same
// family name for italic and upright, so without it the text renders upright with no error.
// ---------------------------------------------------------------------------------------------------------------
const FONT_SUBSETS: ('latin' | 'cyrillic')[] = ['latin', 'cyrillic']
export const display = loadUnbounded('normal', { weights: ['500', '700'], subsets: FONT_SUBSETS }).fontFamily
export const serif = loadSerif('normal', { weights: ['400', '700'], subsets: FONT_SUBSETS }).fontFamily
export const serifItalic = loadSerif('italic', { weights: ['400'], subsets: FONT_SUBSETS }).fontFamily
export const mono = loadMono('normal', { weights: ['400', '700'], subsets: FONT_SUBSETS }).fontFamily
export const hand = loadCaveat('normal', { weights: ['700'], subsets: FONT_SUBSETS }).fontFamily

// Two looks that were approved in real campaigns: a dark ground and a cream "print" page. Replace with the brand's.
export const THEMES = {
  dark: { ground: '#0a0a0a', text: '#fafaf8', accent: '#00ff88', dim: 'rgba(250,250,248,0.62)', rule: '#00ff88' },
  print: { ground: '#f1ece1', text: '#16181d', accent: '#16181d', dim: '#55534e', rule: '#0f9d58' },
}
export type Theme = keyof typeof THEMES
export const INK = '#1f2a3d'
export const RED = '#c8322b'

// ---------------------------------------------------------------------------------------------------------------
// Layout. Meta Reels/Stories UI covers about 14% at the top and 35% at the bottom of 1080x1920: every line of copy stays
// between SAFE_TOP and SAFE_BOTTOM. The 4:5 feed file is the 9:16 master cropped at CROP_4x5_Y unless a dedicated
// "<Id>-4x5" composition exists (scripts/package.sh). A 1080 px frame shows at about a third of its size on a phone, so
// anything the viewer must read is at least MIN_TEXT px; secondary lines (URL, author) at least MIN_SECONDARY px.
// ---------------------------------------------------------------------------------------------------------------
export const SAFE_TOP = 300
export const SAFE_BOTTOM = 1250
export const CROP_4x5_Y = 200
export const PAD = 84
export const MIN_TEXT = 44
export const MIN_SECONDARY = 32

const warned = new Set<string>()
const warnOnce = (key: string, msg: string) => {
  if (warned.has(key)) return
  warned.add(key)
  console.warn(msg)
}
// Every text component calls this with its EFFECTIVE size on the 1080 px frame (after any scaling). scripts/check.mjs
// collects these warnings from the copy-only render and fails the ad.
export const checkTextSize = (px: number, where: string, secondary = false) => {
  const min = secondary ? MIN_SECONDARY : MIN_TEXT
  if (px < min - 0.5) warnOnce(`${where}-${Math.round(px)}`, `[video-ads] ${where}: text at ${Math.round(px)}px is below ${min}px: too small to read on a phone`)
}

// Copy-only mode: `--props='{"copyOnly":true}'` renders copy as white on black and hides every visual, so
// scripts/check.mjs can measure where the text is. Anything that is not copy must go through a visual component below
// (Ground, Visual, Picture, Footage, Surface, MockCard...) or the check will count it as copy.
export const isCopyOnly = () => (getInputProps() as { copyOnly?: boolean }).copyOnly === true
const copyColor = (c: string) => (isCopyOnly() ? '#ffffff' : c)

export const ease = Easing.inOut(Easing.cubic)
export const ramp = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease })

// Spring-in. Give first-scene elements a NEGATIVE delay so frame 0 (the autoplay thumbnail) already shows the hook.
export const useIn = (delay = 0, dur = 14) => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - delay, fps, config: { damping: 200 }, durationInFrames: dur })
  return { opacity: s, transform: `translateY(${(1 - s) * 40}px)` }
}

// Beat timeline with cross-fades: each beat runs `fade` frames into the next one, so two fades never meet at an
// empty frame. Returns [{ from, dur }] and the total length in frames.
export const timeline = (durations: number[], fade = 6) => {
  if (!(fade >= 1)) throw new Error('timeline: fade must be at least 1 frame, and Say/FadeScene must use the same fade')
  let from = 0
  const beats = durations.map((d, i) => {
    const b = { from, dur: d + (i < durations.length - 1 ? fade : 0) }
    from += d
    return b
  })
  return { beats, total: from }
}

// Separate fade-in and fade-out: a single interpolate with a 0-length range throws.
export const FadeScene: React.FC<{ dur: number; children: React.ReactNode; fadeIn?: number; fadeOut?: number }> = ({ dur, children, fadeIn = 6, fadeOut = 6 }) => {
  const f = useCurrentFrame()
  const a = fadeIn ? interpolate(f, [0, fadeIn], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1
  const b = fadeOut ? interpolate(f, [dur - fadeOut, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1
  return <AbsoluteFill style={{ opacity: Math.min(a, b) }}>{children}</AbsoluteFill>
}

// ---------------------------------------------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------------------------------------------
const Line: React.FC<{ delay: number; style: React.CSSProperties; children: React.ReactNode }> = ({ delay, style, children }) => (
  <div style={{ ...style, ...useIn(delay) }}>{children}</div>
)

// Full-size lines only. There is deliberately no small "kicker" label component: viewers skip them.
export const Lines: React.FC<{ lines: React.ReactNode[]; delay?: number; size?: number; stagger?: number; color?: string; weight?: number; font?: string; lh?: number; secondary?: boolean }> = ({ lines, delay = 0, size = 72, stagger = 6, color = THEMES.dark.text, weight = 700, font = display, lh = 1.18, secondary }) => {
  checkTextSize(size, 'Lines', secondary)
  return <div>{lines.map((l, i) => <Line key={i} delay={delay + i * stagger} style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: lh, color: copyColor(color) }}>{l}</Line>)}</div>
}

export const Copy: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = SAFE_TOP }) => (
  <div style={{ position: 'absolute', left: PAD, right: PAD, top }}>{children}</div>
)

// A beat of full-size text inside its own fade. `first` = the opening beat: visible on frame 0, no fade-in.
// Pass the same `fade` as timeline() so the incoming beat is visible before the outgoing one is gone.
export const Say: React.FC<{ dur: number; lines: string[]; theme?: Theme; size?: number; first?: boolean; top?: number; font?: string; fade?: number; color?: string }> = ({ dur, lines, theme = 'dark', size = 72, first, top = SAFE_TOP, font, fade = 6, color }) => (
  <FadeScene dur={dur} fadeIn={first ? 0 : fade} fadeOut={fade}>
    <Copy top={top}>
      <Lines lines={lines} delay={first ? -20 : 0} stagger={first ? 0 : 5} size={size} color={color ?? THEMES[theme].text} font={font ?? (theme === 'print' ? serif : display)} lh={1.1} />
    </Copy>
  </FadeScene>
)

// End card. `lead` bridges the video's punch to the offer and is the largest line; the product, the concrete offer
// (format, dates) and the footer follow. Fully built within ~1 s so it can be read for the rest of the card; give the
// card at least 3 s. The product should not be a surprise here: name what is sold before the end card (SKILL.md).
export const EndCard: React.FC<{ theme?: Theme; lead: string[]; product: string[]; details: string[]; footer: string }> = ({ theme = 'dark', lead, product, details, footer }) => {
  const t = THEMES[theme]
  return (
    <AbsoluteFill>
      <Ground theme={theme} />
      <Copy top={330}>
        <Lines delay={-20} stagger={0} lines={lead} size={66} color={t.text} font={theme === 'print' ? serif : display} lh={1.12} />
        <div style={{ ...useIn(10), height: 6, width: 160, background: isCopyOnly() ? 'transparent' : t.rule, borderRadius: 3, margin: '46px 0 40px' }} />
        <Lines delay={14} lines={product} size={80} color={t.accent} stagger={3} />
        <div style={{ height: 30 }} />
        <Lines delay={22} size={46} weight={500} lines={details} stagger={2} color={t.text} />
        <div style={{ ...useIn(28), marginTop: 40, fontFamily: mono, fontSize: 36, color: copyColor(t.dim) }}>{footer}</div>
      </Copy>
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Visuals (hidden in copy-only mode)
// ---------------------------------------------------------------------------------------------------------------
export const Ground: React.FC<{ theme?: Theme }> = ({ theme = 'dark' }) => {
  if (isCopyOnly()) return <AbsoluteFill style={{ background: '#000' }} />
  if (theme === 'print') return <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, #f6f2e9 0%, #f1ece1 60%, #e6dfd0 100%)' }} />
  return <AbsoluteFill style={{ background: THEMES[theme].ground }} />
}

// Wrap any custom visual (a shape, a background, a screenshot) so the copy check ignores it.
export const Visual: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) =>
  isCopyOnly() ? null : <div style={style}>{children}</div>

// A generated or drawn illustration with feathered edges, so its paper melts into the page instead of sitting in a
// box (mix-blend-mode: multiply tinted it into a darker box). Keep every word out of the image: text lives in Lines.
const FEATHER = 'linear-gradient(to right, transparent 0%, #000 7%, #000 93%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%)'
export const Picture: React.FC<{ src: string; top: number; width: number; opacity?: number }> = ({ src, top, width, opacity = 1 }) =>
  isCopyOnly() || opacity <= 0 ? null : (
    <Img src={staticFile(src)} style={{ position: 'absolute', left: (1080 - width) / 2, top, width, opacity, WebkitMaskImage: FEATHER, maskImage: FEATHER, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' }} />
  )

// Generated footage, full bleed, muted. Generators often deliver black bars inside the frame: measure them on the first
// clip (barTop/barBottom in source pixels) and they are cropped away. Start at the second where the action happens
// (`startFrom`, in source frames), not at 0.
export const Footage: React.FC<{ src: string; startFrom?: number; srcW?: number; srcH?: number; barTop?: number; barBottom?: number; shiftY?: number; opacity?: number }> = ({ src, startFrom = 0, srcW = 720, srcH = 1280, barTop = 0, barBottom = 0, shiftY = 0, opacity = 1 }) => {
  const { width: W, height: H } = useVideoConfig()
  if (isCopyOnly() || opacity <= 0) return null
  const contentSrcH = srcH - barTop - barBottom
  const scale = Math.max(H / contentSrcH, W / srcW) // cover the frame with the picture area, bars excluded
  const vw = srcW * scale
  const vh = srcH * scale
  const contentTop = barTop * scale
  const contentH = contentSrcH * scale
  return (
    <AbsoluteFill style={{ opacity, overflow: 'hidden', background: '#000' }}>
      <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{ position: 'absolute', width: vw, height: vh, left: (W - vw) / 2, top: -contentTop + (H - contentH) / 2 + shiftY }} />
    </AbsoluteFill>
  )
}

// A calm panel behind a news line that sits over footage.
export const TextPanel: React.FC<{ top: number; bottom: number; opacity?: number }> = ({ top, bottom, opacity = 1 }) =>
  isCopyOnly() ? null : <div style={{ position: 'absolute', left: 48, right: 48, top, height: bottom - top, opacity, background: 'rgba(241,236,225,0.94)', borderRadius: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }} />

// A photographed surface (sheet, whiteboard, board) with an SVG overlay drawn in the IMAGE's own pixel coordinates:
// measure the writable area in the file once, then children use those coordinates and stay aligned at any size.
const SurfaceScale = React.createContext(1)
export const Surface: React.FC<{ src: string; iw: number; ih: number; left: number; top: number; width: number; opacity?: number; children?: React.ReactNode }> = ({ src, iw, ih, left, top, width, opacity = 1, children }) => {
  const h = (width * ih) / iw
  return (
    <div style={{ position: 'absolute', left, top, width, height: h, opacity }}>
      {isCopyOnly() ? null : <Img src={staticFile(src)} style={{ width, height: h, display: 'block', boxShadow: '0 30px 60px rgba(40,30,10,0.25)' }} />}
      <SurfaceScale.Provider value={width / iw}>
        <svg viewBox={`0 0 ${iw} ${ih}`} width={width} height={h} style={{ position: 'absolute', inset: 0 }}>{children}</svg>
      </SurfaceScale.Provider>
    </div>
  )
}

// Zero-budget product object: a mock of the product's own UI (a card, a form, a button) drawn in JSX. Better than an
// empty frame; a real screenshot or photo of the product beats it.
export const MockCard: React.FC<{ title: string; subtitle?: string; button: string; buttonColor?: string; buttonTextColor?: string; top: number; width?: number }> = ({ title, subtitle, button, buttonColor = '#111', buttonTextColor = '#fff', top, width = 760 }) => {
  const co = isCopyOnly() // the card is a visual; its words are copy and stay visible to the check
  checkTextSize(52, 'MockCard title'); if (subtitle) checkTextSize(32, 'MockCard subtitle', true); checkTextSize(46, 'MockCard button')
  return (
    <div style={{ position: 'absolute', top, left: (1080 - width) / 2, width, boxSizing: 'border-box', background: co ? 'transparent' : '#fffdf8', borderRadius: 28, padding: 44, boxShadow: co ? 'none' : '0 30px 70px rgba(0,0,0,0.35)' }}>
      <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 52, color: co ? '#fff' : '#16181d' }}>{title}</div>
      {subtitle ? <div style={{ fontFamily: mono, fontSize: 32, color: co ? '#fff' : '#6b6b66', marginTop: 8 }}>{subtitle}</div> : null}
      {[0.92, 0.78, 0.86, 0.55].map((w, i) => <div key={i} style={{ height: 16, width: `${w * 100}%`, background: co ? 'transparent' : '#e7e1d4', borderRadius: 8, marginTop: i ? 16 : 34 }} />)}
      <div style={{ marginTop: 40, background: co ? 'transparent' : buttonColor, color: co ? '#fff' : buttonTextColor, fontFamily: mono, fontWeight: 700, fontSize: 46, textAlign: 'center', padding: '22px 0', borderRadius: 14 }}>{button}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Hand drawing for Surface overlays: strokes draw on with `p` (0..1), deterministic wobble from `seed`.
// ---------------------------------------------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

export const Stroke: React.FC<{ d: string; color?: string; w?: number; o?: number; p?: number }> = ({ d, color = INK, w = 5, o = 1, p = 1 }) =>
  isCopyOnly() || p <= 0 ? null : (
    <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o} {...(p < 1 ? { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - p } : {})} />
  )

// Curved arrow; `delay` adds the two-bar delay mark of systems diagrams at the midpoint.
export const Arrow: React.FC<{ x1: number; y1: number; cx: number; cy: number; x2: number; y2: number; color?: string; seed: number; delay?: boolean; p?: number; w?: number }> = ({ x1, y1, cx, cy, x2, y2, color = INK, seed, delay, p = 1, w = 5 }) => {
  const r = rng(seed)
  const j = () => (r() - 0.5) * 6
  const a = Math.atan2(y2 - cy, x2 - cx)
  const hl = 26
  const head = `M ${x2 - hl * Math.cos(a - 0.45)} ${y2 - hl * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - hl * Math.cos(a + 0.45)} ${y2 - hl * Math.sin(a + 0.45)}`
  const mx = 0.25 * x1 + 0.5 * cx + 0.25 * x2, my = 0.25 * y1 + 0.5 * cy + 0.25 * y2
  const ta = Math.atan2(y2 - y1, x2 - x1), n = ta + Math.PI / 2
  const bar = (off: number) => `M ${mx + off * Math.cos(ta) - 18 * Math.cos(n)} ${my + off * Math.sin(ta) - 18 * Math.sin(n)} L ${mx + off * Math.cos(ta) + 18 * Math.cos(n)} ${my + off * Math.sin(ta) + 18 * Math.sin(n)}`
  return (
    <g>
      <Stroke d={`M ${x1 + j()} ${y1 + j()} Q ${cx + j()} ${cy + j()} ${x2} ${y2}`} color={color} w={w} p={clamp01(p / 0.75)} />
      <Stroke d={head} color={color} w={w} p={clamp01((p - 0.75) / 0.25)} />
      {delay ? <><Stroke d={bar(-8)} color={color} w={w} p={clamp01((p - 0.45) / 0.15)} /><Stroke d={bar(8)} color={color} w={w} p={clamp01((p - 0.55) / 0.15)} /></> : null}
    </g>
  )
}

// Hand-drawn ellipse that circles a word; fade `o` and `blur` to leave a wiped trace. Motion that points at the line
// being read helps; unrelated motion next to a line competes with it.
export const Loop: React.FC<{ cx: number; cy: number; rx: number; ry: number; seed: number; color?: string; w?: number; o?: number; blur?: number; p?: number }> = ({ cx, cy, rx, ry, seed, color = RED, w = 7, o = 1, blur = 0, p = 1 }) => {
  if (isCopyOnly() || p <= 0 || o <= 0) return null
  const r = rng(seed)
  const start = r() * Math.PI * 2
  const pts: string[] = []
  for (let i = 0; i <= 46; i++) {
    const t = start + (i / 46) * Math.PI * 2 * 1.1
    const k = 1 + (r() - 0.5) * 0.035 + (i / 46) * 0.06
    pts.push(`${cx + rx * k * Math.cos(t)} ${cy + ry * k * Math.sin(t)}`)
  }
  return <path d={`M ${pts.join(' L ')}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={o} style={blur ? { filter: `blur(${blur}px)` } : undefined} {...(p < 1 ? { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - p } : {})} />
}

// Handwritten word on a surface. It is copy: size x surface scale must stay >= MIN_TEXT (checked) and inside the safe zone.
export const Word: React.FC<{ x: number; y: number; size: number; children: string; color?: string; anchor?: 'middle' | 'start' | 'end'; p?: number }> = ({ x, y, size, children, color = INK, anchor = 'middle', p = 1 }) => {
  const scale = React.useContext(SurfaceScale)
  checkTextSize(size * scale, `Word "${children}"`)
  if (p <= 0) return null
  const estW = size * 0.56 * children.length + 24
  const left = anchor === 'middle' ? x - estW / 2 : anchor === 'start' ? x - 12 : x - estW + 12
  const id = `w${Math.round(x)}_${Math.round(y)}_${children.length}`
  return (
    <g>
      {p < 1 ? <defs><clipPath id={id}><rect x={left} y={y - size} width={estW * p} height={size * 2} /></clipPath></defs> : null}
      <text x={x} y={y} fontFamily={hand} fontWeight={700} fontSize={size} fill={copyColor(color)} textAnchor={anchor} dominantBaseline="middle" clipPath={p < 1 ? `url(#${id})` : undefined}>{children}</text>
    </g>
  )
}
