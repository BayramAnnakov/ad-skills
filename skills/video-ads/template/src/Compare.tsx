import React from 'react'
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion'
import { mono } from './lib'

// Side-by-side comparison for a decision the user makes by watching (models, illustration vs footage, cuts). Show
// every candidate at the same moment with a label: name, price, known defect. It is an internal review tool, not an ad:
// it shows defects and look (rotation, bars, staging), never which finished ad will sell. Clips live in public/; each
// row is one beat of equal length.
export type CompareCell = { src: string; label: string; startFrom?: number }
export type CompareRow = { cells: CompareCell[]; frames: number }

const COL_W = 432 // 9:16 panel at 432x768; width = COL_W * columns
export const compareSize = (rows: CompareRow[]) => ({ width: COL_W * Math.max(...rows.map((r) => r.cells.length)), height: 768, durationInFrames: rows.reduce((a, r) => a + r.frames, 0) })

const Panel: React.FC<{ cell: CompareCell; x: number }> = ({ cell, x }) => (
  <div style={{ position: 'absolute', left: x, top: 0, width: COL_W, height: 768, overflow: 'hidden', background: '#000' }}>
    <OffthreadVideo src={staticFile(cell.src)} startFrom={cell.startFrom ?? 0} muted style={{ width: COL_W, height: 768, objectFit: 'cover' }} />
    <div style={{ position: 'absolute', left: 8, top: 8, right: 8, background: 'rgba(0,0,0,0.75)', color: '#fff', fontFamily: mono, fontSize: 18, padding: '6px 10px', borderRadius: 8, lineHeight: 1.3 }}>{cell.label}</div>
  </div>
)

export const Compare: React.FC<{ rows: CompareRow[] }> = ({ rows }) => {
  let from = 0
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {rows.map((row, i) => {
        const seq = <Sequence key={i} from={from} durationInFrames={row.frames}>{row.cells.map((c, j) => <Panel key={j} cell={c} x={j * COL_W} />)}</Sequence>
        from += row.frames
        return seq
      })}
    </AbsoluteFill>
  )
}
