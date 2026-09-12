import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'focus-or-fry',
    title: 'Focus or Fry',
    meta: 'FPGA telemetry system · Personal · 2025',
    description:
      'An end-to-end FPGA telemetry-processing system built around a fully parameterized UART in Verilog: 16× oversampling with centre-bit sampling, a two-flop synchronizer on the asynchronous receive line, framing-error detection, and FIFO buffering and flow control behind the host interface. Verified with self-checking SystemVerilog testbenches that fail the run on any unexpected behaviour, and brought up on an Artix-7 against STM32 firmware.',
    specs: [
      '100 MHz system clock',
      '115200 baud, 8N1',
      '16× oversampling',
      '64-entry TX and RX FIFOs',
      'Artix-7 · Digilent Basys 3',
      'STM32F401RE host firmware',
      'Xilinx Vivado',
    ],
    stack: 'Verilog · SystemVerilog · FSMs · FIFO · C (STM32 HAL)',
    link: { label: 'focus-or-fry on GitHub', href: 'https://github.com/LittleOutfox/focus-or-fry/', external: true },
  },
  {
    id: 'quadrature-encoder',
    title: 'Quadrature Encoder Block',
    meta: 'FPGA · General Dynamics · 2025',
    description:
      'A quadrature encoder block in VHDL: FSM control and measurement logic, exposing position, speed and error status through a CSR-mapped AXI4-Lite window.',
    stack: 'VHDL · FSM · AXI4-Lite · SystemVerilog TB',
    note: 'Employer work; no public source.',
  },
  {
    id: 'calming-teddy-bear',
    title: 'Calming Teddy Bear',
    meta: 'First build · 2021',
    description:
      'An Arduino bear that sensed racing hearts and answered with a lullaby and a warm tummy: easing anxiety by up to 52% at a care centre and a dental clinic.',
    stack: 'Arduino · Heart-rate sensing · C++',
    link: {
      label: 'Project documentation',
      href: 'https://docs.google.com/document/d/1dKNdC3heJWIDP0wO4JZW94xYDHml6rhj4n3I9VjYhfo/edit?usp=sharing',
      external: true,
    },
  },
]
