import { useEffect, useRef } from 'react'

/**
 * MenuBloom: the mobile menu's background.
 * On open, 233 seeds (a Fibonacci number) burst out of the menu button, each one golden
 * angle (137.5°) after the last, blooming into a full sunflower while a golden spiral
 * (r = a·φ^(2θ/π)) draws itself. Once open, the bloom keeps turning slowly.
 */

const PHI = (1 + Math.sqrt(5)) / 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const SPIRAL_B = Math.log(PHI) / (Math.PI / 2)
const SEEDS = 610 // Fibonacci
const BLOOM_MS = 1000 * PHI // 1.618s to full bloom

// Ease-out built from φ: fast burst, long graceful settle
const easeOut = (t: number) => 1 - Math.pow(1 - t, PHI * 2)

interface Props {
  /** Bloom origin in viewport pixels (the menu button's centre) */
  originX: number
  originY: number
}

const MenuBloom = ({ originX, originY }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    let raf = 0

    const draw = (now: number) => {
      const elapsed = now - start
      const p = reduce ? 1 : easeOut(Math.min(1, elapsed / BLOOM_MS))
      const t = elapsed / 1000
      const rot = t * 0.0618
      // A true sunflower centred on the button, large enough to fan across the whole screen
      const reach = Math.hypot(w, h) * 1.05
      const c = reach / Math.sqrt(SEEDS)

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      // Seed positions: each travels from the button to its place, outer seeds slightly later
      const xs = new Float32Array(SEEDS + 1)
      const ys = new Float32Array(SEEDS + 1)
      const ls = new Float32Array(SEEDS + 1)
      for (let i = 1; i <= SEEDS; i++) {
        const lag = (i / SEEDS) * 0.382
        const local = Math.max(0, Math.min(1, (p - lag) / (1 - lag)))
        const r = c * Math.sqrt(i) * local
        const a = i * GOLDEN_ANGLE + rot + (1 - local) * Math.PI * 0.618 // swirl outward while travelling
        xs[i] = originX + r * Math.cos(a)
        ys[i] = originY + r * Math.sin(a)
        ls[i] = local
      }

      // Fibonacci lattice: link seeds 21 and 34 apart to reveal the interlocking sunflower spirals
      ctx.lineWidth = 0.854
      for (const step of [21, 34]) {
        for (let i = 1; i + step <= SEEDS; i++) {
          const j = i + step
          const local = Math.min(ls[i], ls[j])
          if (local <= 0) continue
          const mx = (xs[i] + xs[j]) / 2
          const my = (ys[i] + ys[j]) / 2
          if (mx < -30 || mx > w + 30 || my < -30 || my > h + 30) continue
          const wave = 0.5 + 0.5 * Math.sin(Math.sqrt(i) * 0.618 - t * PHI)
          ctx.strokeStyle = `rgba(${step === 21 ? '34,197,94' : '16,185,129'},${(0.06 + 0.2 * wave * wave) * local})`
          ctx.beginPath()
          ctx.moveTo(xs[i], ys[i])
          ctx.lineTo(xs[j], ys[j])
          ctx.stroke()
        }
      }

      // Seeds
      for (let i = 1; i <= SEEDS; i++) {
        const local = ls[i]
        if (local <= 0) continue
        const x = xs[i]
        const y = ys[i]
        if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue
        const twinkle = 0.5 + 0.5 * Math.sin(t * PHI + i * PHI)
        const alpha = (0.3 + 0.55 * twinkle) * (0.382 + 0.618 * local)
        const size = (i % 13 === 0 ? 3.236 : i % 5 === 0 ? 2 : 1.236) * (0.618 + 0.382 * local)
        ctx.fillStyle = `rgba(${i % 8 === 0 ? '167,243,208' : i % 3 === 0 ? '16,185,129' : '74,222,128'},${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Golden spiral tracing itself out from the button
      const turns = 3.618 * p
      const steps = 144
      ctx.lineWidth = 1.618
      ctx.strokeStyle = `rgba(134, 239, 172, ${0.5 * p})`
      ctx.beginPath()
      for (let s = 0; s <= steps; s++) {
        const th = (s / steps) * turns * Math.PI * 2
        const r = 4 * Math.exp(SPIRAL_B * th)
        const x = originX - r * Math.cos(th + rot * 1.618)
        const y = originY + r * Math.sin(th + rot * 1.618)
        if (s === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // A pulse of light riding the spiral outward
      const pulse = (t * 0.236) % 1
      const pth = pulse * 3.618 * Math.PI * 2
      const pr = 4 * Math.exp(SPIRAL_B * pth)
      const px = originX - pr * Math.cos(pth + rot * 1.618)
      const py = originY + pr * Math.sin(pth + rot * 1.618)
      const g = ctx.createRadialGradient(px, py, 0, px, py, 21)
      g.addColorStop(0, `rgba(167, 243, 208, ${0.618 * p * Math.sin(pulse * Math.PI)})`)
      g.addColorStop(1, 'rgba(34, 197, 94, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(px, py, 21, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [originX, originY])

  return <canvas ref={ref} className="phi-menu-bloom" aria-hidden="true" />
}

export default MenuBloom
