import type { Hobby, Skill } from './types'

export const skills: Skill[] = [
  { name: 'RTL Design', line: 'Clocks, registers, and state machines.', note: 'Logic shaped before it becomes silicon.' },
  { name: 'Verification', line: 'Self-checking testbenches and assertions.', note: 'Nothing ships on faith.' },
  { name: 'Interfaces', line: 'AXI4-Lite, UART, CSRs.' },
  { name: 'Design Flow', line: 'Vivado, Vitis, TCL, CI/CD.', note: 'From source to bitstream, repeatable and clean.' },
  { name: 'Adaptability', line: 'Fast learner, clear teammate, steady under ambiguity.' },
]

export const offTheClock: Hobby[] = [
  { name: 'Games with friends', description: 'Minecraft, Valorant, and League. Fun with friends, painfully boring alone.' },
  { name: 'Tennis', description: 'Years of competing left their mark. Pickleball just happened to speak the same language.' },
  {
    name: 'Cooking',
    description:
      'I know my way around Western comfort food. Lately, the winds have shifted toward Chinese, Korean, and other Asian dishes.',
  },
]
