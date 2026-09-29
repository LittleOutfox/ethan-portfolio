/* ------------------------------------------------------------
   spi.js — pure generator for one write to the SPI PWM ASIC: a
   16-bit SPI Mode 0 frame, MSB first (W, a 7-bit address, an
   8-bit datum), and the PWM the duty register sets, as the chip's
   RTL has it. No DOM, no state. Tested in world/test/spi.test.ts.
   ------------------------------------------------------------ */

/** the duty-cycle register */
export const DUTY_REG = 0x04;
/** cells across the diagram: one before the frame (nCS falls), the 16 bits, one after (nCS rises) */
export const FRAME_CELLS = 18;

function checkByte(what, v, max) {
  if (!Number.isInteger(v) || v < 0 || v > max) {
    throw new RangeError('spi: ' + what + ' must be an integer in 0..' + max + ', received ' + v);
  }
}
function num(n) { return String(Number(n.toFixed(3))); }
function pt(x, y) { return num(x) + ',' + num(y); }
function hex2(v) { return '0x' + v.toString(16).toUpperCase().padStart(2, '0'); }

/** The 16 bits of a write of `data` to `addr`, MSB first. */
export function spiWrite(addr, data) {
  checkByte('address', addr, 127);
  checkByte('data', data, 255);
  const bits = [{ name: 'W', value: 1 }];
  for (let i = 6; i >= 0; i--) bits.push({ name: 'A' + i, value: (addr >> i) & 1 });
  for (let i = 7; i >= 0; i--) bits.push({ name: 'D' + i, value: (data >> i) & 1 });
  return { addr: addr, data: data, bits: bits };
}

/** nCS: high, falls half a cell in, low across the 16 bits, rises half a cell after the last — the commit. */
export function csPolyline(width, high, low) {
  const c = width / FRAME_CELLS;
  return [pt(0, high), pt(0.5 * c, high), pt(0.5 * c, low), pt(17.5 * c, low), pt(17.5 * c, high), pt(width, high)].join(' ');
}

/** SCLK in mode 0: idle low; in each bit's cell it rises at the middle (the sample) and falls at the end. */
export function sclkPolyline(width, high, low) {
  const c = width / FRAME_CELLS;
  const pts = [pt(0, low)];
  for (let k = 1; k <= 16; k++) {
    const xm = (k + 0.5) * c;
    const xe = (k + 1) * c;
    pts.push(pt(xm, low), pt(xm, high), pt(xe, high), pt(xe, low));
  }
  pts.push(pt(width, low));
  return pts.join(' ');
}

/** x of each SCLK rising edge — where the chip samples COPI — one per bit. */
export function sampleXs(width) {
  const c = width / FRAME_CELLS;
  const xs = [];
  for (let k = 1; k <= 16; k++) xs.push((k + 0.5) * c);
  return xs;
}

/** COPI: low outside the frame, each bit held across its cell; edges only on cell boundaries. */
export function copiPolyline(frame, width, high, low) {
  const c = width / FRAME_CELLS;
  const levels = [0].concat(frame.bits.map(function (b) { return b.value; }), [0]);
  const y = function (v) { return v ? high : low; };
  const pts = [pt(0, y(levels[0]))];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] === levels[i - 1]) continue;
    pts.push(pt(i * c, y(levels[i - 1])), pt(i * c, y(levels[i])));
  }
  pts.push(pt(width, y(levels[levels.length - 1])));
  return pts.join(' ');
}

/** The share of each period the output is high: counter < duty over 256 counts; 255 is always high. */
export function pwmHigh(duty) {
  checkByte('duty', duty, 255);
  return duty === 255 ? 1 : duty / 256;
}

/** The duty as a percentage with one decimal, e.g. '50.0%'. */
export function dutyPercent(duty) {
  return (pwmHigh(duty) * 100).toFixed(1) + '%';
}

/** The output across [0, width]: `periods` periods, each high for pwmHigh(duty) of it. */
export function pwmPolyline(duty, width, high, low, periods) {
  if (periods === undefined) periods = 2;
  const f = pwmHigh(duty);
  if (f === 0) return pt(0, low) + ' ' + pt(width, low);
  if (f === 1) return pt(0, high) + ' ' + pt(width, high);
  const pw = width / periods;
  const pts = [];
  for (let p = 0; p < periods; p++) {
    const x0 = p * pw;
    const xh = x0 + f * pw;
    pts.push(pt(x0, low), pt(x0, high), pt(xh, high), pt(xh, low));
  }
  pts.push(pt(width, low));
  return pts.join(' ');
}

/** The write for the readout, e.g. '0x04 ← 0x80'. */
export function formatWrite(addr, data) {
  return hex2(addr) + ' ← ' + hex2(data);
}

/** The duty box's text as a duty: digits only, clamped to 255; null while there are none. */
export function dutyFromText(text) {
  const digits = String(text).replace(/\D+/g, '');
  if (!digits) return null;
  return Math.min(255, parseInt(digits, 10));
}
