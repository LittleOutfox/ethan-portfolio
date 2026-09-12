import { useMemo, useState, type ChangeEvent, type FocusEvent } from 'react'
import { byteFromChar, centreSampleXs, formatByte, sampledBits, txPolyline, uartFrame } from './uart'
import styles from './UartFigure.module.css'

/* viewBox geometry (user units). The plot is 12 cells of 72, so 16 ticks of 4.5 per cell. */
const VB_W = 976
const VB_H = 150
const PLOT_X = 104
const PLOT_W = 864
const LANE_LABEL_X = 92
const CLK_HIGH = 20
const CLK_LOW = 44
const TX_HIGH = 72
const TX_LOW = 108
const RULE_TOP = 10
const RULE_BOTTOM = 118
const CELL_LABEL_Y = 140
const SAMPLE_HALF = 5

/**
 * One 8N1 UART frame, 16x oversampled, drawn as a two-lane timing diagram from the pure
 * generator in ./uart. Typing a character redraws the frame; nothing animates.
 */
export function UartFigure({ id }: { id: string }) {
  const [ch, setCh] = useState('E')

  const view = useMemo(() => {
    const frame = uartFrame(byteFromChar(ch))
    return {
      frame,
      cells: sampledBits(frame),
      tx: txPolyline(frame, PLOT_W, TX_HIGH, TX_LOW),
      samples: centreSampleXs(frame, PLOT_W),
    }
  }, [ch])

  const { frame, cells, tx, samples } = view
  const cellW = PLOT_W / frame.bits.length
  const inputId = `${id}-byte`
  const captionId = `${id}-cap`
  const bitText = cells.map((b) => `${b.name} ${b.value}`).join(', ')

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setCh(v ? (Array.from(v).at(-1) ?? '') : '')
  }
  const onFocus = (e: FocusEvent<HTMLInputElement>) => e.target.select()

  return (
    <figure className={styles.figure} role="group" aria-labelledby={captionId}>
      <div className={styles.controls}>
        <label htmlFor={inputId} className="t-label">
          Byte to send
        </label>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          inputMode="text"
          maxLength={1}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={ch}
          onChange={onChange}
          onFocus={onFocus}
        />
        <output htmlFor={inputId} className={`data ${styles.readout}`}>
          {formatByte(frame.byte)}
        </output>
      </div>

      <div
        className={styles.scroll}
        tabIndex={0}
        role="group"
        aria-label="UART timing diagram, scrolls sideways"
        aria-describedby={captionId}
      >
        <svg className={styles.svg} viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" aria-hidden="true" focusable="false">
          {/* cell boundaries */}
          <g fill="none" stroke="var(--hairline)" strokeWidth={1} shapeRendering="crispEdges" strokeLinecap="square">
            {frame.bits.map((b, i) => {
              const x = PLOT_X + i * cellW
              return <line key={b.startTick} x1={x} x2={x} y1={RULE_TOP} y2={RULE_BOTTOM} vectorEffect="non-scaling-stroke" />
            })}
            <line
              x1={PLOT_X + PLOT_W}
              x2={PLOT_X + PLOT_W}
              y1={RULE_TOP}
              y2={RULE_BOTTOM}
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {/* the 16x clock as rising-edge ticks: the centre tick of every cell is the sample */}
          <g transform={`translate(${PLOT_X} 0)`} fill="none" strokeWidth={1} shapeRendering="crispEdges" strokeLinecap="square">
            {Array.from({ length: frame.totalTicks }, (_, t) => {
              const x = (t * PLOT_W) / frame.totalTicks
              const centre = t % frame.oversample === frame.oversample / 2
              return (
                <line
                  key={t}
                  x1={x}
                  x2={x}
                  y1={centre ? CLK_HIGH : CLK_LOW - 8}
                  y2={CLK_LOW}
                  stroke={centre ? 'var(--ice)' : 'var(--text-3)'}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </g>

          {/* the tx lane */}
          <g
            transform={`translate(${PLOT_X} 0)`}
            fill="none"
            stroke="var(--text)"
            strokeWidth={1}
            shapeRendering="crispEdges"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <polyline points={tx} vectorEffect="non-scaling-stroke" />
          </g>

          {/* centre-bit sample points on tx */}
          <g transform={`translate(${PLOT_X} 0)`} fill="none" stroke="var(--ice)" strokeWidth={3} shapeRendering="crispEdges">
            {cells.map((b, i) => {
              const x = samples[i]
              const y = b.value ? TX_HIGH : TX_LOW
              return <line key={b.name} x1={x} x2={x} y1={y - SAMPLE_HALF} y2={y + SAMPLE_HALF} vectorEffect="non-scaling-stroke" />
            })}
          </g>

          {/* lane labels */}
          <text
            className={`data ${styles.svgText}`}
            fill="currentColor"
            x={LANE_LABEL_X}
            y={(CLK_HIGH + CLK_LOW) / 2}
            textAnchor="end"
            dominantBaseline="central"
          >
            clk_16x
          </text>
          <text
            className={`data ${styles.svgText}`}
            fill="currentColor"
            x={LANE_LABEL_X}
            y={(TX_HIGH + TX_LOW) / 2}
            textAnchor="end"
            dominantBaseline="central"
          >
            tx
          </text>

          {/* cell labels, centred under start, d0..d7, stop */}
          {cells.map((b, i) => (
            <text
              key={b.name}
              className={`data ${styles.svgText}`}
              fill="currentColor"
              x={PLOT_X + samples[i]}
              y={CELL_LABEL_Y}
              textAnchor="middle"
            >
              {b.name}
            </text>
          ))}
        </svg>
      </div>

      <figcaption id={captionId} className="t-meta">
        UART frame, 8N1, 16&times; oversampled, LSB first. Change the byte to redraw.
        <span className="visually-hidden"> Bits: {bitText}.</span>
      </figcaption>
    </figure>
  )
}
