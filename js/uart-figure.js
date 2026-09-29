/* ------------------------------------------------------------
   uart-figure.js — the signal at the foot of the Focus or Fry gate
   One 8N1 UART frame, 16x oversampled, drawn as a two-lane timing
   diagram from the pure generator in ./uart.js: the receiver's
   clock as rising-edge ticks (the centre tick of every cell is the
   sample), the tx line, and the centre-bit samples. Typing a
   character redraws the frame; nothing animates.
   ------------------------------------------------------------ */
import { byteFromChar, centreSampleXs, formatByte, sampledBits, txPolyline, uartFrame } from './uart.js?v=1';

const SVG = 'http://www.w3.org/2000/svg';
/* viewBox geometry (user units). The plot is 12 cells of 72, so 16 ticks of 4.5 per cell. */
const VB_W = 976;
const VB_H = 150;
const PLOT_X = 104;
const PLOT_W = 864;
const LANE_LABEL_X = 92;
const CLK_HIGH = 20;
const CLK_LOW = 44;
const TX_HIGH = 72;
const TX_LOW = 108;
const RULE_TOP = 10;
const RULE_BOTTOM = 118;
const CELL_LABEL_Y = 140;
const SAMPLE_HALF = 5;

function el(name, attrs, parent) {
  const n = document.createElementNS(SVG, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function draw(svg, frame) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const cells = sampledBits(frame);
  const samples = centreSampleXs(frame, PLOT_W);
  const cellW = PLOT_W / frame.bits.length;

  // cell boundaries
  const rules = el('g', { class: 'sig-rules' }, svg);
  frame.bits.forEach((b, i) => {
    const x = PLOT_X + i * cellW;
    el('line', { x1: x, x2: x, y1: RULE_TOP, y2: RULE_BOTTOM, 'vector-effect': 'non-scaling-stroke' }, rules);
  });
  el('line', { x1: PLOT_X + PLOT_W, x2: PLOT_X + PLOT_W, y1: RULE_TOP, y2: RULE_BOTTOM, 'vector-effect': 'non-scaling-stroke' }, rules);

  // the 16x clock as rising-edge ticks: the centre tick of every cell is the sample
  const clk = el('g', { class: 'sig-clk', transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  for (let t = 0; t < frame.totalTicks; t++) {
    const x = (t * PLOT_W) / frame.totalTicks;
    const centre = t % frame.oversample === frame.oversample / 2;
    el('line', { x1: x, x2: x, y1: centre ? CLK_HIGH : CLK_LOW - 8, y2: CLK_LOW, class: centre ? 'sig-sample' : '', 'vector-effect': 'non-scaling-stroke' }, clk);
  }

  // the tx lane
  const tx = el('g', { class: 'sig-tx', transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  el('polyline', { points: txPolyline(frame, PLOT_W, TX_HIGH, TX_LOW), 'vector-effect': 'non-scaling-stroke' }, tx);

  // centre-bit sample points on tx
  const marks = el('g', { class: 'sig-marks', transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  cells.forEach((b, i) => {
    const y = b.value ? TX_HIGH : TX_LOW;
    el('line', { x1: samples[i], x2: samples[i], y1: y - SAMPLE_HALF, y2: y + SAMPLE_HALF, 'vector-effect': 'non-scaling-stroke' }, marks);
  });

  // labels
  const lane = (y, text) => {
    const t = el('text', { class: 'sig-label', x: LANE_LABEL_X, y, 'text-anchor': 'end', 'dominant-baseline': 'central' }, svg);
    t.textContent = text;
  };
  lane((CLK_HIGH + CLK_LOW) / 2, 'clk_16x');
  lane((TX_HIGH + TX_LOW) / 2, 'tx');
  cells.forEach((b, i) => {
    const t = el('text', { class: 'sig-label', x: PLOT_X + samples[i], y: CELL_LABEL_Y, 'text-anchor': 'middle' }, svg);
    t.textContent = b.name;
  });
  return cells;
}

function mount(root) {
  root.innerHTML =
    '<div class="sig-head">' +
      '<span class="sig-title">One frame on tx</span>' +
      '<label class="sig-byte">Byte <input class="sig-input" type="text" inputmode="text" maxlength="1" autocomplete="off" autocapitalize="off" spellcheck="false" value="E" aria-describedby="uartCap"></label>' +
      '<output class="sig-readout" aria-live="polite"></output>' +
    '</div>' +
    '<div class="sig-scroll" tabindex="0" role="group" aria-label="UART timing diagram, scrolls sideways" aria-describedby="uartCap"></div>' +
    '<p class="sig-cap" id="uartCap">8N1, 16&times; oversampled, LSB first. The taller ticks are the centre-bit samples. Change the byte to redraw.<span class="sig-bits"></span></p>';
  const svg = el('svg', { viewBox: '0 0 ' + VB_W + ' ' + VB_H, class: 'sig-svg', 'aria-hidden': 'true', focusable: 'false' }, root.querySelector('.sig-scroll'));
  const input = root.querySelector('.sig-input');
  const readout = root.querySelector('.sig-readout');
  const bits = root.querySelector('.sig-bits');

  function render(ch) {
    const frame = uartFrame(byteFromChar(ch));
    const cells = draw(svg, frame);
    readout.textContent = formatByte(frame.byte);
    bits.textContent = ' Bits: ' + cells.map((b) => b.name + ' ' + b.value).join(', ') + '.';
  }
  input.addEventListener('input', () => {
    const v = input.value;
    const ch = v ? Array.from(v).slice(-1)[0] : '';
    if (input.value !== ch) input.value = ch;
    render(ch);
  });
  input.addEventListener('focus', () => input.select());
  render('E');
}

document.querySelectorAll('[data-signal="uart"]').forEach(mount);
