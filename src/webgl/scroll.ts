// Scroll choreography for the field. Three scrubbed moments (Release, Gather, the moon) plus
// the quiet-band gate. ScrollTriggers write the plain `target` object; the render loop lerps.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyGates, control, flags, target } from './bus'
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

  if (flags.reducedMotion) {
    // one still frame of the formed fox; the moon rests; scrolling redraws so the page-anchored
    // fox leaves with the hero instead of riding the viewport
    target.formA = 1.3
    target.formB = -0.3
    target.fade = 1
    applyGates()
    const onScroll = () => control.invalidate()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  if (!spec.gather) {
    // low tier: the field exists for the hero only; it fades out past About and the loop stops
    triggers.push(
      ScrollTrigger.create({
        trigger: '#about',
        start: 'top 90%',
        end: 'top 40%',
        onUpdate: (self) => {
          target.fade = 1 - self.progress
        },
      }),
    )
    triggers.push(
      ScrollTrigger.create({
        trigger: '#about',
        start: 'top 40%',
        end: 'bottom -100000%',
        onToggle: (self) => {
          flags.idle = self.isActive
          applyGates()
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

  // the quiet band: fade the field out through Skills and Off the clock, stop the loop, wake for Contact
  if (spec.gather) triggers.push(
    ScrollTrigger.create({
      trigger: '#skills',
      start: 'top 85%',
      end: 'top 30%',
      onUpdate: (self) => {
        target.fade = 1 - self.progress
      },
    }),
  )
  if (spec.gather) triggers.push(
    ScrollTrigger.create({
      trigger: '#skills',
      start: 'top 30%',
      endTrigger: '#contact',
      end: 'top 140%',
      onToggle: (self) => {
        flags.idle = self.isActive
        applyGates()
      },
    }),
  )

  if (spec.gather) {
    triggers.push(
      ScrollTrigger.create({
        trigger: '#contact',
        start: 'top 140%',
        end: 'top 20%',
        onUpdate: (self) => {
          target.fade = Math.min(1, self.progress * 3)
          target.formB = -0.3 + 1.6 * self.progress
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
  }
}
