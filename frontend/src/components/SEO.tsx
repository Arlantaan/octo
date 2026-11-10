import { useEffect } from 'react'

const SITE_NAME = 'Octopus Tech'
const SITE_URL = 'https://octopustech.org'
const DEFAULT_IMAGE = `${SITE_URL}/images/og-image.jpg`

interface SEOProps {
  title: string
  description: string
  /** Path only, e.g. "/about". Defaults to current pathname. */
  path?: string
  image?: string
}

/** Sets/updates a meta tag by name or property. */
const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const setCanonical = (url: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

/**
 * Lightweight per-page SEO. Updates document title and social/meta tags on mount.
 * Avoids pulling in react-helmet for a small marketing SPA.
 */
const SEO = ({ title, description, path, image = DEFAULT_IMAGE }: SEOProps) => {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`
    const url = `${SITE_URL}${path ?? window.location.pathname}`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setCanonical(url)

    // Open Graph
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)

    // Twitter
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)
  }, [title, description, path, image])

  return null
}

export default SEO
