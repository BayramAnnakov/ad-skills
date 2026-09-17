import React from 'react'
import { AbsoluteFill } from 'remotion'
import { checkTextSize, display, isCopyOnly, mono, serif, serifItalic, THEMES } from './lib'

// Static ad in the print style: calm ground, one real object, a headline and a sign-off.
// 4:5 and 9:16 are separate layouts (not a crop). 9:16 keeps copy inside y 300..1250. Every line is >= 44 px except the
// details (36 px): a 1080 px image shows at about a third of its size on a phone.
export type Ratio = '4x5' | '9x16'
export const STILL_SIZE = { '4x5': { width: 1080, height: 1350 }, '9x16': { width: 1080, height: 1920 } }
const L = {
  '4x5': { head: 84, headSize: 88, obj: [330, 1000], sign: 1030, foot: 1190 },
  '9x16': { head: 300, headSize: 80, obj: [500, 940], sign: 960, foot: 1120 },
}

export const StaticAd: React.FC<{ ratio: Ratio; head: string[]; sign: string; badge: string; details: string[]; children: (w: number, h: number) => React.ReactNode }> = ({ ratio, head, sign, badge, details, children }) => {
  const l = L[ratio]
  checkTextSize(l.headSize, 'StaticAd headline'); checkTextSize(56, 'StaticAd sign-off'); checkTextSize(44, 'StaticAd badge'); checkTextSize(36, 'StaticAd details', true)
  const co = isCopyOnly()
  const ink = co ? '#fff' : '#16181d'
  const objW = 1080 - 2 * 84, objH = l.obj[1] - l.obj[0]
  return (
    <AbsoluteFill style={{ background: co ? '#000' : 'radial-gradient(ellipse at 50% 45%, #f6f2e9 0%, #f1ece1 60%, #e6dfd0 100%)' }}>
      <div style={{ position: 'absolute', left: 84, right: 84, top: l.head, fontFamily: serif, fontWeight: 700, fontSize: l.headSize, lineHeight: 1.08, color: ink, letterSpacing: -1 }}>
        {head.map((h) => <div key={h}>{h}</div>)}
      </div>
      <div style={{ position: 'absolute', left: 84, width: objW, top: l.obj[0], height: objH, overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: 1080, height: objH, left: -84 }}>{children(objW, objH)}</div>
      </div>
      <div style={{ position: 'absolute', left: 84, right: 84, top: l.sign, fontFamily: serifItalic, fontStyle: 'italic', fontSize: 56, lineHeight: 1.1, color: ink }}>{sign}</div>
      <div style={{ position: 'absolute', left: 84, right: 84, top: l.foot, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ background: co ? 'transparent' : THEMES.dark.ground, color: co ? '#fff' : THEMES.dark.accent, fontFamily: display, fontWeight: 500, fontSize: 44, padding: '12px 24px', borderRadius: 12, whiteSpace: 'nowrap' }}>{badge}</div>
        <div style={{ fontFamily: mono, fontSize: 36, color: co ? '#fff' : '#3d3d3b', lineHeight: 1.2 }}>{details.map((d) => <div key={d}>{d}</div>)}</div>
      </div>
    </AbsoluteFill>
  )
}
