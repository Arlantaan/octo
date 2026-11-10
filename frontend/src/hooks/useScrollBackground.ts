import { useEffect, useRef } from 'react'

export const useScrollBackground = () => {
  const currentPosition = useRef(50) // Start at center (50%)
  const targetPosition = useRef(100) // Target: bottom (100%)
  const animationFrame = useRef<number | null>(null)
  const isAnimating = useRef(true)

  useEffect(() => {
    const updateBackgroundPosition = (position: number) => {
      // Clamp position between 0% (top) and 100% (bottom)
      const clampedPosition = Math.max(0, Math.min(100, position))
      document.documentElement.style.setProperty('--bg-position-y', `${clampedPosition}%`)
    }

    const animate = () => {
      if (!isAnimating.current) {
        return
      }

      const diff = targetPosition.current - currentPosition.current
      
      if (Math.abs(diff) > 0.05) {
        // Very slow, smooth movement downward (1% of difference per frame for very slow movement)
        const step = diff * 0.01
        currentPosition.current += step
        updateBackgroundPosition(currentPosition.current)
        animationFrame.current = requestAnimationFrame(animate)
      } else {
        // Reached target - stay at bottom
        currentPosition.current = targetPosition.current
        updateBackgroundPosition(currentPosition.current)
        isAnimating.current = false
        animationFrame.current = null
      }
    }

    // Initialize position at center
    updateBackgroundPosition(currentPosition.current)
    
    // Start slow automatic animation downward after a short delay
    const startDelay = setTimeout(() => {
      animationFrame.current = requestAnimationFrame(animate)
    }, 1000) // Start after 1 second

    return () => {
      clearTimeout(startDelay)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])
}
