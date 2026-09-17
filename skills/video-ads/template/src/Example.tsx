import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { Arrow, EndCard, Footage, Ground, Loop, MockCard, Picture, ramp, Say, Surface, TextPanel, timeline, Word } from './lib'
import { Ratio, StaticAd } from './Stills'

// Every string below is a placeholder. Replace it, and give each on-screen claim a line in SOURCES.md (copy
// ../templates/sources-and-rights.md into the project). The examples name the product and the buyer's stake by the
// middle of the ad; keep that when you replace the words.

// ---------------------------------------------------------------------------------------------------------------
// 1. Evergreen ad, zero budget: the setup and the product object are both on frame 0 -> a pivot beat -> the punch ->
//    an end card that bridges the punch to the offer. The product object is a JSX mock (MockCard); a real screenshot
//    or photo is better when you have one.
// ---------------------------------------------------------------------------------------------------------------
const E = timeline([90, 75, 60, 105])
export const EXAMPLE_FRAMES = E.total

const ButtonFlip: React.FC = () => {
  const f = useCurrentFrame()
  const paid = f >= E.beats[1].from + 40
  return <MockCard top={760} title="<Product>" subtitle="its real screen or a mock" button={paid ? 'After: the change' : 'Before: the problem'} buttonColor={paid ? '#d97706' : '#111'} />
}

export const ExampleAd: React.FC = () => (
  <AbsoluteFill>
    <Ground theme="dark" />
    <Sequence durationInFrames={E.beats[1].from + E.beats[1].dur}><ButtonFlip /></Sequence>
    <Sequence from={E.beats[0].from} durationInFrames={E.beats[0].dur}><Say first dur={E.beats[0].dur} lines={['<Buyer> has', '<the problem>.']} /></Sequence>
    <Sequence from={E.beats[1].from} durationInFrames={E.beats[1].dur}><Say dur={E.beats[1].dur} lines={['<Product> changes', 'this for <buyer>.']} /></Sequence>
    <Sequence from={E.beats[2].from} durationInFrames={E.beats[2].dur}><Say dur={E.beats[2].dur} lines={['The punch:', 'what they can', 'now decide.']} size={92} top={520} /></Sequence>
    <Sequence from={E.beats[3].from}><EndCard lead={['The bridge from', 'the punch to the offer']} product={['Product', 'name']} details={['Format · start date']} footer="site.com · Author" /></Sequence>
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------------------------------------------
// 2. Newsjack ad in the print look (the structure that shipped): the news in one line over a text-free illustration
//    on frame 0 -> the same structure happens on the product's own object (a photographed sheet, drawn on in the
//    image's coordinates) -> the punch -> the end card. `footage` swaps the illustration for generated footage with its
//    black bars cropped (the A/B variant).
// ---------------------------------------------------------------------------------------------------------------
const N = timeline([90, 150, 60, 105])
export const NEWS_FRAMES = N.total
// Writable area inside public/sample/paper-sheet.jpg (1152x928): the whole sheet minus a 60 px border.
const SHEET = { iw: 1152, ih: 928, width: 1000, left: 40, top: 560 }

const SheetBeat: React.FC = () => {
  const f = useCurrentFrame()
  const t = f - 20
  const P = (a: number, d = 16) => ramp(t, a, a + d)
  const o = ramp(f, 0, 10) * (1 - ramp(f, N.beats[1].dur - 8, N.beats[1].dur))
  return (
    <Surface src="sample/paper-sheet.jpg" iw={SHEET.iw} ih={SHEET.ih} left={SHEET.left} top={SHEET.top} width={SHEET.width} opacity={o}>
      <Word x={250} y={330} size={84} p={P(0, 12)}>Cause</Word>
      <Arrow seed={3} x1={410} y1={330} cx={560} cy={250} x2={700} y2={320} w={7} p={P(14)} />
      <Word x={880} y={330} size={84} p={P(30, 12)}>Effect</Word>
      <Arrow seed={7} x1={860} y1={420} cx={620} cy={640} x2={330} y2={430} w={7} delay p={P(46, 22)} />
      <Word x={590} y={690} size={76} p={P(70, 12)}>delay</Word>
      <Loop cx={880} cy={330} rx={170} ry={90} seed={21} p={P(90, 20)} />
    </Surface>
  )
}

export const ExampleNews: React.FC<{ footage?: boolean }> = ({ footage }) => {
  const news = N.beats[0]
  return (
    <AbsoluteFill>
      <Ground theme="print" />
      <Sequence durationInFrames={news.dur}>
        {footage ? (
          <><Footage src="sample/clip-letterbox.mp4" barTop={84} barBottom={84} startFrom={15} /><TextPanel top={250} bottom={640} /></>
        ) : (
          <Picture src="sample/illustration.svg" top={640} width={1000} />
        )}
        <Say first theme="print" dur={news.dur} lines={['The news in one line,', 'naming no person', 'or company.']} size={76} />
      </Sequence>
      <Sequence from={N.beats[1].from} durationInFrames={N.beats[1].dur}>
        <SheetBeat />
        <Say theme="print" dur={N.beats[1].dur} lines={['In <product> we do', 'exactly this.']} size={66} />
      </Sequence>
      <Sequence from={N.beats[2].from} durationInFrames={N.beats[2].dur}><Say theme="print" dur={N.beats[2].dur} lines={['The punch: what', '<buyer> will decide.']} size={80} /></Sequence>
      <Sequence from={N.beats[3].from}><EndCard theme="print" lead={['What the course', 'teaches about it']} product={['Product name']} details={['Format · start date']} footer="site.com · Author" /></Sequence>
    </AbsoluteFill>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Static ad, 4:5 and 9:16 as two layouts.
// ---------------------------------------------------------------------------------------------------------------
export const ExampleStill = (ratio: Ratio) => () => (
  <StaticAd ratio={ratio} head={['Headline that carries', 'the whole idea.']} sign="Sign-off about the product." badge="Product name" details={['Format', 'Start date']}>
    {(w, h) => <Picture src="sample/illustration.svg" top={0} width={Math.min(w, (h * 1000) / 620)} />}
  </StaticAd>
)
