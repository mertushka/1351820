import { useEffect, useState } from 'react'
import logo from './assets/mertushka.svg'
import './App.css'

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
const cipher = [
  { number: '13', letter: 'm' },
  { number: '5', letter: 'e' },
  { number: '18', letter: 'r' },
  { number: '20', letter: 't' },
]

const startDelay = 620
const stagger = 360
const decodeDuration = 1120

type DecodeCell = {
  value: string
  locked: boolean
  scanning: boolean
  number: boolean
}

const initialCells = cipher.map(({ number }) => ({
  value: number,
  locked: false,
  scanning: false,
  number: true,
}))

const finalCells = cipher.map(({ letter }) => ({
  value: letter,
  locked: true,
  scanning: false,
  number: false,
}))

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getDecodedCells(time: number, startTime: number): DecodeCell[] {
  return cipher.map(({ number, letter }, index) => {
    const elapsed = time - startTime - startDelay - index * stagger

    if (elapsed < 0) {
      return { value: number, locked: false, scanning: false, number: true }
    }

    if (elapsed >= decodeDuration) {
      return { value: letter, locked: true, scanning: false, number: false }
    }

    const targetIndex = alphabet.indexOf(letter)
    const progress = elapsed / decodeDuration
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    const letterIndex = Math.min(
      targetIndex,
      Math.floor(easedProgress * (targetIndex + 1)),
    )

    return {
      value: alphabet[letterIndex],
      locked: false,
      scanning: true,
      number: false,
    }
  })
}

function App() {
  const [cells, setCells] = useState<DecodeCell[]>(() =>
    prefersReducedMotion() ? finalCells : initialCells,
  )
  const [handleRevealed, setHandleRevealed] = useState(() =>
    prefersReducedMotion(),
  )
  const decoded = cells.every(({ locked }) => locked)
  const lockedCount = cells.filter(({ locked }) => locked).length

  useEffect(() => {
    if (prefersReducedMotion()) {
      return
    }

    let frameId = 0
    const startTime = performance.now()

    const animate = (time: number) => {
      const nextCells = getDecodedCells(time, startTime)
      setCells(nextCells)

      if (!nextCells.every(({ locked }) => locked)) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (!decoded || handleRevealed) {
      return
    }

    const revealId = window.setTimeout(() => {
      setHandleRevealed(true)
    }, 180)

    return () => window.clearTimeout(revealId)
  }, [decoded, handleRevealed])

  return (
    <main className="signature" aria-label="A1Z26 numbers decode to mertushka">
      <div className="signal" aria-hidden="true" />
      <div
        className="logo-shell"
        data-complete={handleRevealed}
        data-locks={lockedCount}
      >
        <img
          className="mark"
          src={logo}
          width="128"
          height="128"
          alt="Mertushka logo"
        />
      </div>
      <section className="cipher" aria-label="Decoded nickname">
        <div
          className="wordmark"
          data-complete={handleRevealed}
          data-revealed={handleRevealed}
          aria-live="polite"
        >
          <div className="decode">
            {cells.map(({ value, locked, scanning, number }, index) => (
              <span
                className="decode-cell"
                data-locked={locked}
                data-number={number}
                data-scanning={scanning}
                key={cipher[index].number}
              >
                {value}
              </span>
            ))}
          </div>
          <span className="suffix-word" aria-hidden={!handleRevealed}>
            ushka
          </span>
          <span className="text-sheen" aria-hidden="true">
            mertushka
          </span>
        </div>
      </section>
    </main>
  )
}

export default App
