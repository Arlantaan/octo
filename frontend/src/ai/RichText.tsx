import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { WHATSAPP_DISPLAY, whatsappLink } from '../config/contact'

// Turns site paths (/portfolio), known domains and **bold** into links/emphasis, and "- " lines into bullets.
// Everything else stays plain text (no HTML is ever injected).
const TOKEN = /(\*\*[^*]+\*\*|\/(?:about|services|portfolio|partners|contact|quote|ai-lab|ai-engineering|work\/etikz)\b|\b(?:koyagambia\.com|ambilspeed\.com|trustqualitydesign\.com)\b|\babdulla@octopustech\.org\b|\+220 877 872 586)/g

function renderInline(text: string, keyBase: string) {
  return text.split(TOKEN).map((part, i) => {
    const key = `${keyBase}-${i}`
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('/')) {
      return (
        <Link key={key} to={part} className="text-green-400 underline underline-offset-2 hover:text-green-300">
          {part}
        </Link>
      )
    }
    if (part === WHATSAPP_DISPLAY) {
      return (
        <a key={key} href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-green-400 underline underline-offset-2">
          {part}
        </a>
      )
    }
    if (part.includes('@')) {
      return <a key={key} href={`mailto:${part}`} className="text-green-400 underline underline-offset-2">{part}</a>
    }
    if (part.endsWith('.com')) {
      return (
        <a key={key} href={`https://${part}`} target="_blank" rel="noopener noreferrer" className="text-green-400 underline underline-offset-2">
          {part}
        </a>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

const BULLET = /^\s*[-•*]\s+/

const RichText = ({ text }: { text: string }) => {
  // Group consecutive bullet lines into a list and other lines into paragraphs,
  // so "Here's how:\n- a\n- b" renders as a sentence followed by a real list.
  const groups: Array<{ list: boolean; lines: string[] }> = []
  for (const line of text.split('\n')) {
    const isBullet = BULLET.test(line)
    if (!line.trim()) {
      groups.push({ list: false, lines: [] }) // blank line: paragraph break
      continue
    }
    const last = groups[groups.length - 1]
    if (last && last.list === isBullet && last.lines.length > 0) last.lines.push(line)
    else groups.push({ list: isBullet, lines: [line] })
  }
  const blocks = groups.filter((g) => g.lines.length > 0)

  return (
    <>
      {blocks.map((g, b) =>
        g.list ? (
          <ul key={b} className="my-1.5 list-disc pl-5 space-y-0.5">
            {g.lines.map((l, i) => (
              <li key={i}>{renderInline(l.replace(BULLET, ''), `${b}-${i}`)}</li>
            ))}
          </ul>
        ) : (
          <p key={b} className={b > 0 ? 'mt-2' : ''}>
            {g.lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {renderInline(l, `${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        ),
      )}
    </>
  )
}

export default RichText
