// Types for js/uart.js, so the world's strict type-check accepts its tests' imports.
export interface UartBit { name: string; value: 0 | 1; startTick: number; endTick: number }
export interface UartFrame { byte: number; oversample: number; ticksPerBit: number; bits: UartBit[]; totalTicks: number }
export const FRAME_CELLS: number
export function uartFrame(byte: number, oversample?: number): UartFrame
export function txLevels(frame: UartFrame): Uint8Array
export function txPolyline(frame: UartFrame, width: number, high: number, low: number): string
export function clockPolyline(frame: UartFrame, width: number, high: number, low: number): string
export function centreSampleXs(frame: UartFrame, width: number): number[]
export function sampledBits(frame: UartFrame): UartBit[]
export function byteFromChar(ch: string): number
export function formatByte(byte: number): string
