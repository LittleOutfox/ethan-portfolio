/* ------------------------------------------------------------
   spi-figure.js — the signal at the foot of the SPI PWM ASIC gate
   One write to the duty register, drawn as a timing diagram from
   the pure generator in ./spi.js: nCS, SCLK and COPI across the
   16-bit frame (MSB first, sampled on SCLK's rising edges), and
   the PWM the new duty sets, two periods on its own time scale.
   Changing the duty redraws it; nothing animates.
   ------------------------------------------------------------ */
import { copiPolyline, csPolyline, DUTY_REG, dutyFromText, dutyPercent, formatWrite, pwmPolyline, sampleXs, sclkPolyline, spiWrite } from './spi.js?v=1';

const SVG = 'http://www.w3.org/2000/svg';
/* viewBox geometry (user units): 18 cells of 48 across the plot */
const VB_W = 976;
const VB_H = 150;
const PLOT_X = 104;
const PLOT_W = 864;
const LANE_LABEL_X = 92;
const CS = [10, 26];
const SCLK = [38, 54];
const COPI = [66, 82];
const BIT_LABEL_Y = 100;
const PWM = [116, 132];
const RULE_TOP = 4;
const RULE_BOTTOM = 88;
const SAMPLE_HALF = 5;

function el(name, attrs, parent) {
  const n = document.createElementNS(SVG, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function lane(svg, cls, points) {
  const g = el('g', { class: cls, transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  el('polyline', { points: points, 'vector-effect': 'non-scaling-stroke' }, g);
}

function draw(svg, duty) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const frame = spiWrite(DUTY_REG, duty);
  const cellW = PLOT_W / 18;

  // bit-cell boundaries across the three SPI lanes
  const rules = el('g', { class: 'sig-rules' }, svg);
  for (let i = 1; i <= 17; i++) {
    const x = PLOT_X + i * cellW;
    el('line', { x1: x, x2: x, y1: RULE_TOP, y2: RULE_BOTTOM, 'vector-effect': 'non-scaling-stroke' }, rules);
  }

  lane(svg, 'sig-tx', csPolyline(PLOT_W, CS[0], CS[1]));
  lane(svg, 'sig-tx', sclkPolyline(PLOT_W, SCLK[0], SCLK[1]));
  lane(svg, 'sig-tx', copiPolyline(frame, PLOT_W, COPI[0], COPI[1]));
  lane(svg, 'sig-pwm', pwmPolyline(duty, PLOT_W, PWM[0], PWM[1]));

  // the chip samples COPI on each SCLK rising edge
  const marks = el('g', { class: 'sig-marks', transform: 'translate(' + PLOT_X + ' 0)' }, svg);
  sampleXs(PLOT_W).forEach(function (x, k) {
    const y = frame.bits[k].value ? COPI[0] : COPI[1];
    el('line', { x1: x, x2: x, y1: y - SAMPLE_HALF, y2: y + SAMPLE_HALF, 'vector-effect': 'non-scaling-stroke' }, marks);
  });

  const text = function (x, y, anchor, s, cls) {
    const t = el('text', { class: cls || 'sig-label', x: x, y: y, 'text-anchor': anchor, 'dominant-baseline': 'central' }, svg);
    t.textContent = s;
  };
  text(LANE_LABEL_X, (CS[0] + CS[1]) / 2, 'end', 'nCS');
  text(LANE_LABEL_X, (SCLK[0] + SCLK[1]) / 2, 'end', 'SCLK');
  text(LANE_LABEL_X, (COPI[0] + COPI[1]) / 2, 'end', 'COPI');
  text(LANE_LABEL_X, (PWM[0] + PWM[1]) / 2, 'end', 'pwm');
  frame.bits.forEach(function (b, k) {
    text(PLOT_X + (k + 1.5) * cellW, BIT_LABEL_Y, 'middle', b.name, 'sig-label sig-bit');
  });
  return frame;
}

function mount(root) {
  root.innerHTML =
    '<div class="sig-head">' +
      '<span class="sig-title">One write on SPI</span>' +
      '<label class="sig-byte">Duty <input class="sig-input sig-duty" type="text" inputmode="numeric" maxlength="3" autocomplete="off" spellcheck="false" value="128" aria-describedby="spiCap"></label>' +
      '<output class="sig-readout" aria-live="polite"></output>' +
    '</div>' +
    '<div class="sig-scroll" tabindex="0" role="group" aria-label="SPI timing diagram, scrolls sideways" aria-describedby="spiCap"></div>' +
    '<p class="sig-cap" id="spiCap">SPI mode 0, 16 bits, MSB first: a write bit, the 7-bit address 0x04 (the duty register) and the 8-bit duty, sampled on each rising edge of SCLK and committed when nCS rises. The pwm lane shows two periods of the output, about 3 kHz, at its own time scale.<span class="sig-bits"></span></p>';
  const svg = el('svg', { viewBox: '0 0 ' + VB_W + ' ' + VB_H, class: 'sig-svg', 'aria-hidden': 'true', focusable: 'false' }, root.querySelector('.sig-scroll'));
  const input = root.querySelector('.sig-duty');
  const readout = root.querySelector('.sig-readout');
  const bits = root.querySelector('.sig-bits');
  let last = 128;

  function render(duty) {
    last = duty;
    const frame = draw(svg, duty);
    readout.textContent = dutyPercent(duty) + ' · ' + formatWrite(DUTY_REG, duty);
    bits.textContent = ' Bits: ' + frame.bits.map(function (b) { return b.name + ' ' + b.value; }).join(', ') + '.';
  }
  input.addEventListener('input', function () {
    const d = dutyFromText(input.value);
    if (d === null) return; // an empty box waits for a number
    if (String(d) !== input.value) input.value = String(d);
    render(d);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const step = e.shiftKey ? 16 : 1;
    const cur = dutyFromText(input.value);
    const from = cur === null ? last : cur;
    const next = Math.max(0, Math.min(255, from + (e.key === 'ArrowUp' ? step : -step)));
    input.value = String(next);
    render(next);
  });
  input.addEventListener('blur', function () {
    if (dutyFromText(input.value) === null) input.value = String(last);
  });
  input.addEventListener('focus', function () { input.select(); });
  render(128);
}

document.querySelectorAll('[data-signal="spi"]').forEach(mount);
