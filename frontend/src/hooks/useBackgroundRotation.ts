import { useEffect } from 'react'

export const useBackgroundRotation = () => {
  useEffect(() => {
    const body = document.body
    const root = document.documentElement
    const backgroundImage = '/liko.webp'
    
    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform))
    const attachmentMode = isIOS ? 'scroll' : 'fixed'
    
    // Preload the image to ensure it's ready
    const img = new Image()
    img.onload = () => {
      // Image loaded, set it as background
      body.style.backgroundImage = `url('${backgroundImage}')`
      body.style.backgroundSize = 'cover'
      body.style.backgroundPosition = 'center var(--bg-position-y)'
      body.style.backgroundRepeat = 'no-repeat'
      body.style.backgroundAttachment = attachmentMode
    }
    img.onerror = () => {
      // Even if image fails, set it (browser will handle fallback)
      body.style.backgroundImage = `url('${backgroundImage}')`
      body.style.backgroundSize = 'cover'
      body.style.backgroundPosition = 'center var(--bg-position-y)'
      body.style.backgroundRepeat = 'no-repeat'
      body.style.backgroundAttachment = attachmentMode
    }
    img.src = backgroundImage
    
    // Update background position on scroll
    const handleScroll = () => {
      const bgPosition = getComputedStyle(root).getPropertyValue('--bg-position-y')
      body.style.backgroundPosition = `center ${bgPosition}`
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
}
