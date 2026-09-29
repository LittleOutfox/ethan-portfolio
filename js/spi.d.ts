// Types for js/spi.js, so the world's strict type-check accepts its tests' imports.
export interface SpiBit { name: string; value: 0 | 1 }
export interface SpiFrame { addr: number; data: number; bits: SpiBit[] }
export const DUTY_REG: number
export const FRAME_CELLS: number
export function spiWrite(addr: number, data: number): SpiFrame
export function csPolyline(width: number, high: number, low: number): string
export function sclkPolyline(width: number, high: number, low: number): string
export function sampleXs(width: number): number[]
export function copiPolyline(frame: SpiFrame, width: number, high: number, low: number): string
export function pwmHigh(duty: number): number
export function dutyPercent(duty: number): string
export function pwmPolyline(duty: number, width: number, high: number, low: number, periods?: number): string
export function formatWrite(addr: number, data: number): string
export function dutyFromText(text: string): number | null
