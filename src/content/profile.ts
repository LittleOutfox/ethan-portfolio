import type { Link, Profile } from './types'

export const profile: Profile = {
  name: 'Ethan Tiong',
  role: 'RTL for ASIC & FPGA',
  standfirst:
    'I am most drawn to RTL design: latency, throughput, interfaces, timing, and the logic that decides how a system moves.',
  school: 'Electrical Engineering @ University of Waterloo',
  status: 'Open · Winter 2027 co-op',
  based: 'Greater Toronto · open to relocate',
  focus: 'RTL · ASIC & FPGA',
  email: 'ethan.tiong@uwaterloo.ca',
  bio: [
    'I study Electrical Engineering at the University of Waterloo. I am most drawn to RTL design: latency, throughput, interfaces, timing, and the logic that decides how a system moves. I like the space between hardware and software too, bridging the gap between processing systems and programmable logic. Every tail points deeper, closer to silicon.',
    'Hi! My name is Ethan Tiong. I was born in Canada on a snowy winter afternoon, and if it was not already obvious, my favourite animal is the fox. I’ve always held an affinity towards the charm, intelligence, and playfulness they are known for. Quiet when they need to be, quick when it matters, and just a little mysterious.',
  ],
}

export const links = {
  resume: { label: 'Résumé', href: 'https://www.overleaf.com/read/jngjdjcgbqms#cdd752', external: true },
  github: { label: 'GitHub', href: 'https://github.com/LittleOutfox', external: true },
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ethan-tiong/', external: true },
  email: { label: 'ethan.tiong@uwaterloo.ca', href: 'mailto:ethan.tiong@uwaterloo.ca' },
} satisfies Record<string, Link>

export const site = {
  url: 'https://www.etiong.com/',
  title: 'Ethan Tiong — RTL & FPGA Design Engineer',
  description:
    'Ethan Tiong — RTL and digital design for ASIC and FPGA. Electrical Engineering at the University of Waterloo, open to a Winter 2027 co-op.',
  copyright: '© 2026 Ethan Tiong · Designed & built by hand',
  colophon: 'Set in Newsreader, Schibsted Grotesk and Azeret Mono. Fox drawings by the author.',
  signature: '以狐为引',
}
