// Scroll choreography for the field. Three scrubbed moments (Release, Gather, the moon) plus
// the quiet-band gate. ScrollTriggers write the plain `target` object; the render loop lerps.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyGates, control, flags, isStill, target } from './bus'
import type { TierSpec } from './tiers'

let registered = false

export function setupScroll(spec: TierSpec): () => void {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger)
    ScrollTrigger.config({ ignoreMobileResize: true })
    registered = true
  }
  const wash = document.querySelector<HTMLElement>('[data-wash]')
  const triggers: ScrollTrigger[] = []

  // a still field (Pause or reduced motion) is redrawn on scroll and resize so the page-anchored
  // poses leave with their sections instead of riding the viewport over the text below
  const redraw = () => {
    if (isStill()) control.invalidate()
  }
  window.addEventListener('scroll', redraw, { passive: true })
  window.addEventListener('resize', redraw, { passive: true })
  const stopRedraw = () => {
    window.removeEventListener('scroll', redraw)
    window.removeEventListener('resize', redraw)
  }

  if (flags.reducedMotion) {
    // one still frame of the formed fox; the moon rests
    target.formA = 1.3
    target.formB = -0.3
    target.fade = 1
    applyGates()
    return stopRedraw
  }

  target.formA = 1.3
  const narrow = window.innerWidth < 960

  // Release: the fox lets go across the first 80% of a viewport of scroll, tail tips first.
  // On a phone the fox is a figure below the title block, so the release follows the figure
  // itself as it leaves the viewport rather than the hero's top edge.
  triggers.push(
    narrow
      ? ScrollTrigger.create({
          trigger: '[data-plate="a"]',
          start: 'top 12%',
          end: 'bottom 0%',
          onUpdate: (self) => {
            target.formA = 1.3 - 1.6 * self.progress
          },
        })
      : ScrollTrigger.create({
          trigger: '#top',
          start: 'top top',
          end: '+=80%',
          onUpdate: (self) => {
            target.formA = 1.3 - 1.6 * self.progress
          },
        }),
  )

  // One owner for the field's opacity. The quiet band fades it out and the Contact approach fades
  // it back in; both are progresses, so the curve is continuous at any viewport height (separate
  // toggle ranges in viewport units invert on tall screens). The loop sleeps itself once the curve
  // reaches zero (FoxPoints) and is woken here the moment it rises again.
  const prog = { quiet: 0, contact: 0 }
  const writeFade = () => {
    const next = Math.max(1 - prog.quiet, Math.min(1, prog.contact * 3))
    const wake = flags.idle && next > 0
    target.fade = next
    flags.idle = next === 0
    if (wake) applyGates()
  }

  if (!spec.gather) {
    // low tier: the field exists for the hero only; it fades out past About and the loop stops
    triggers.push(
      ScrollTrigger.create({
        trigger: '#about',
        start: 'top 90%',
        end: 'top 40%',
        onUpdate: (self) => {
          prog.quiet = self.progress
          writeFade()
        },
      }),
    )
  }

  // the moon crosses the sky over the whole page; the DOM wash and the shader share the value
  triggers.push(
    ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const x = 0.12 + 0.73 * self.progress
        target.lightX = x
        wash?.style.setProperty('--light-x', x.toFixed(3))
      },
    }),
  )

  if (spec.gather) {
    // the quiet band: fade the field out through Skills and Off the clock, then gather at Contact
    triggers.push(
      ScrollTrigger.create({
        trigger: '#skills',
        start: 'top 85%',
        end: 'top 30%',
        onUpdate: (self) => {
          prog.quiet = self.progress
          writeFade()
        },
      }),
    )
    const plateB = document.querySelector<HTMLElement>('[data-plate="b"]')
    triggers.push(
      ScrollTrigger.create({
        trigger: '#contact',
        start: 'top 140%',
        end: 'top 20%',
        onUpdate: (self) => {
          prog.contact = self.progress
          target.formB = -0.3 + 1.6 * self.progress
          // the poster hands over once the pose is a third formed; scrolling back brings it back
          plateB?.toggleAttribute('data-live', self.progress > 0.35)
          writeFade()
        },
      }),
    )
  }

  const refresh = () => ScrollTrigger.refresh()
  document.fonts?.ready.then(refresh)
  window.addEventListener('load', refresh)
  return () => {
    triggers.forEach((t) => t.kill())
    window.removeEventListener('load', refresh)
    stopRedraw()
  }
}
