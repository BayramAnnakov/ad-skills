import React from 'react'
import { Composition, Still } from 'remotion'
import { ExampleAd, EXAMPLE_FRAMES, ExampleNews, NEWS_FRAMES, ExampleStill } from './Example'
import { STILL_SIZE } from './Stills'
import { Compare, compareSize, CompareRow } from './Compare'

// Register each ad as "<Id>" (the 9:16 master). Add "<Id>-4x5" only when the feed version needs its own layout;
// otherwise scripts/package.sh crops the master. Durations come from the example's timeline().
const COMPARE_ROWS: CompareRow[] = [{ frames: 90, cells: [{ src: 'sample/clip-letterbox.mp4', label: 'Model A · 10 cr/s · black bars' }, { src: 'sample/clip-plain.mp4', label: 'Model B · 20 cr/s' }] }]
const V = { fps: 30, width: 1080, height: 1920 }

export const Root: React.FC = () => (
  <>
    <Composition id="Example" component={ExampleAd} durationInFrames={EXAMPLE_FRAMES} {...V} />
    <Composition id="ExampleNews" component={ExampleNews} durationInFrames={NEWS_FRAMES} {...V} />
    <Composition id="ExampleNewsFootage" component={ExampleNews} durationInFrames={NEWS_FRAMES} {...V} defaultProps={{ footage: true }} />
    <Still id="ExampleStill-4x5" component={ExampleStill('4x5')} {...STILL_SIZE['4x5']} />
    <Still id="ExampleStill-9x16" component={ExampleStill('9x16')} {...STILL_SIZE['9x16']} />
    <Composition id="Compare" component={Compare} fps={30} {...compareSize(COMPARE_ROWS)} defaultProps={{ rows: COMPARE_ROWS }} />
  </>
)
