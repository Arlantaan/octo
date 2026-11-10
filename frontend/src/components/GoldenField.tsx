import { useEffect, useRef } from 'react'

/**
 * GoldenField: a full-screen background animation built from golden-ratio maths.
 *
 *  - Phyllotaxis: point i sits at angle i·137.5° (the golden angle) and radius c·√i,
 *    the pattern sunflowers use to pack seeds. Point counts are Fibonacci numbers.
 *  - Golden spiral: r = a·φ^(2θ/π), growing by φ every quarter turn, with light
 *    pulses travelling outward along it.
 *  - The field is anchored on the viewport's golden point (61.8% across, 38.2% down),
 *    drifts toward the pointer, and fades out near the centre so text stays clean.
 *
 * Sits behind all content (z-index -1), pauses when the tab is hidden, and draws a
 * single still frame for visitors who prefer reduced motion.
 */

const PHI = (1 + Math.sqrt(5)) / 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)) // ≈ 137.5° in radians
const SPIRAL_B = Math.log(PHI) / (Math.PI / 2) // growth rate: ×φ per quarter turn

type Rgb = [number, number, number]
const EMERALD: Rgb = [34, 197, 94]
const MINT: Rgb = [110, 231, 183]
const TEAL: Rgb = [16, 185, 129]

const GoldenField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let count = 987
    let raf = 0
    let running = true
    const start = performance.now()

    // Pointer, eased so the field drifts rather than snaps
    const pointer = { x: 0.618, y: 0.382, tx: 0.618, ty: 0.382, active: false }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.618)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      count = width < 768 ? 377 : 987 // Fibonacci numbers
    }

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / width
      pointer.ty = e.clientY / height
      pointer.active = true
    }
    const onLeave = () => {
      pointer.tx = 0.618
      pointer.ty = 0.382
      pointer.active = false
    }

    const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      // Ease the anchor toward the pointer (only ~1/φ³ of the way, so it stays subtle)
      pointer.x += (pointer.tx - pointer.x) * 0.0236
      pointer.y += (pointer.ty - pointer.y) * 0.0236
      const mobile = width < 768
      const baseX = mobile ? 0.5 : 0.618
      const cx = width * (baseX + (pointer.x - 0.618) * 0.0618)
      const cy = height * (0.382 + (pointer.y - 0.382) * 0.0618)

      const span = Math.hypot(width, height)
      const breathe = 1 + Math.sin(t / PHI) * 0.0382
      const c = (span / Math.sqrt(count)) * 0.5 * breathe // spacing so the field fills the screen
      const rot = t * 0.0618 // slow rotation, radians/sec
      const textSafe = Math.min(width, height) * 0.382 // fade radius around the centre column

      // ---- 1. Phyllotaxis field ----
      // Pre-compute every seed once per frame so dots and lattice lines share positions
      const xs = new Float32Array(count + 1)
      const ys = new Float32Array(count + 1)
      const safes = new Float32Array(count + 1)
      for (let i = 1; i <= count; i++) {
        const r = c * Math.sqrt(i)
        const a = i * GOLDEN_ANGLE + rot
        const x = cx + r * Math.cos(a)
        const y = cy + r * Math.sin(a)
        xs[i] = x
        ys[i] = y
        // Keep the middle of the screen (where text lives) quiet
        const dCentre = Math.hypot(x - width / 2, y - height * 0.45)
        safes[i] = Math.min(1, Math.max(0.146, (dCentre - textSafe * 0.5) / textSafe))
      }

      // Parastichy lattice: link each seed to the seeds 21 and 34 ahead (consecutive
      // Fibonacci numbers), which traces the two families of interlocking sunflower spirals.
      // A slow wave of light travels outward through the lattice.
      ctx.lineWidth = 0.854
      for (const step of [21, 34]) {
        for (let i = 1; i + step <= count; i++) {
          const j = i + step
          const mx = (xs[i] + xs[j]) / 2
          const my = (ys[i] + ys[j]) / 2
          if (mx < -40 || mx > width + 40 || my < -40 || my > height + 40) continue
          const wave = 0.5 + 0.5 * Math.sin(Math.sqrt(i) * 0.618 - t * 1.618)
          const a = (0.055 + 0.2 * wave * wave) * Math.min(safes[i], safes[j])
          if (a < 0.008) continue
          ctx.strokeStyle = rgba(step === 21 ? EMERALD : TEAL, a)
          ctx.beginPath()
          ctx.moveTo(xs[i], ys[i])
          ctx.lineTo(xs[j], ys[j])
          ctx.stroke()
        }
      }

      for (let i = 1; i <= count; i++) {
        const x = xs[i]
        const y = ys[i]
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue
        const safe = safes[i]

        // Twinkle phase offset by φ so neighbours never pulse together
        const twinkle = 0.5 + 0.5 * Math.sin(t * 1.618 + i * PHI)
        let alpha = (0.18 + 0.4 * twinkle) * safe

        // Pointer spotlight
        if (pointer.active) {
          const dp = Math.hypot(x - pointer.x * width, y - pointer.y * height)
          alpha += Math.max(0, 1 - dp / 161.8) * 0.55
        }

        const size = 0.618 + (i % 13 === 0 ? 2.618 : (i % 5 === 0 ? 1.618 : 0.618)) * (0.8 + twinkle * 0.4)
        const col = i % 8 === 0 ? MINT : i % 3 === 0 ? TEAL : EMERALD
        ctx.fillStyle = rgba(col, Math.min(alpha, 0.854))
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
      // ---- 2. Golden spirals with travelling light ----
      const arms = 2
      const turns = 4.236 // φ³ full turns: enough for the spiral to reach the screen edge
      const a0 = Math.min(width, height) * 0.0236
      for (let k = 0; k < arms; k++) {
        const offset = rot * -1.618 + k * Math.PI
        ctx.strokeStyle = rgba(TEAL, 0.18)
        ctx.lineWidth = 1
        ctx.beginPath()
        const steps = 233
        for (let s = 0; s <= steps; s++) {
          const th = (s / steps) * turns * Math.PI * 2
          const r = a0 * Math.exp(SPIRAL_B * th)
          const x = cx + r * Math.cos(th + offset)
          const y = cy + r * Math.sin(th + offset)
          if (s === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Three pulses per arm, spaced by 1/φ along the spiral, moving outward
        for (let p = 0; p < 3; p++) {
          const progress = ((t * 0.0618 + p * 0.382 + k * 0.236) % 1)
          const th = progress * turns * Math.PI * 2
          const r = a0 * Math.exp(SPIRAL_B * th)
          const x = cx + r * Math.cos(th + offset)
          const y = cy + r * Math.sin(th + offset)
          const fade = Math.sin(progress * Math.PI) // brightest mid-journey
          const glow = 13 + 21 * progress // Fibonacci sizes
          const g = ctx.createRadialGradient(x, y, 0, x, y, glow)
          g.addColorStop(0, rgba(MINT, 0.618 * fade))
          g.addColorStop(0.382, rgba(EMERALD, 0.236 * fade))
          g.addColorStop(1, rgba(EMERALD, 0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(x, y, glow, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ---- 3. Golden-ratio ripples expanding from the anchor ----
      for (let w = 0; w < 3; w++) {
        const phase = ((t / 6.18 + w / 3) % 1)
        const rr = phase * span * 0.618
        ctx.strokeStyle = rgba(EMERALD, 0.11 * (1 - phase))
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cy, rr, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = (now: number) => {
      if (!running) return
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduceMotion) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduceMotion) {
      draw(start + 16180) // one calm, still frame
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(loop)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="golden-field" aria-hidden="true" />
}

export default GoldenField
