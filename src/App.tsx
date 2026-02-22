import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'

function playTickSound(audioCtx: AudioContext, pitch: number) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.frequency.value = 400 + pitch * 20
  osc.type = 'square'
  gain.gain.value = 0.08
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.05)
}

function speakNumber(num: number) {
  const utterance = new SpeechSynthesisUtterance(`${num}`)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  utterance.pitch = 1.2
  speechSynthesis.speak(utterance)
}

function playFinalSound(audioCtx: AudioContext) {
  // 和音でジャジャーン！
  const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
  for (const freq of frequencies) {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = freq
    osc.type = 'triangle'
    gain.gain.value = 0.15
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.8)
  }
}

const STORAGE_KEY = 'kids-bingo-state'

interface SavedState {
  gameStarted: boolean
  minNumber: number
  maxNumber: number
  currentNumber: number | null
  drawnNumbers: number[]
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedState
  } catch {
    return null
  }
}

function saveState(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}

function App() {
  const saved = useRef(loadState()).current
  const [gameStarted, setGameStarted] = useState(saved?.gameStarted ?? false)
  const [minNumber, setMinNumber] = useState(saved?.minNumber ?? 1)
  const [maxNumber, setMaxNumber] = useState(saved?.maxNumber ?? 75)
  const [currentNumber, setCurrentNumber] = useState<number | null>(saved?.currentNumber ?? null)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(saved?.drawnNumbers ?? [])
  const [isRolling, setIsRolling] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // 状態が変わるたびにlocalStorageに保存
  useEffect(() => {
    if (gameStarted) {
      saveState({ gameStarted, minNumber, maxNumber, currentNumber, drawnNumbers })
    }
  }, [gameStarted, minNumber, maxNumber, currentNumber, drawnNumbers])

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }, [])

  const startGame = () => {
    setGameStarted(true)
    setDrawnNumbers([])
    setCurrentNumber(null)
    setIsRevealed(false)
  }

  const drawNumber = () => {
    if (isRolling) return

    const availableNumbers = Array.from(
      { length: maxNumber - minNumber + 1 },
      (_, i) => minNumber + i
    ).filter(num => !drawnNumbers.includes(num))

    if (availableNumbers.length === 0) {
      alert('すべての数字が出ました！')
      return
    }

    const finalNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)]
    const audioCtx = getAudioCtx()

    setIsRolling(true)
    setIsRevealed(false)

    // スロット演出: 数字を高速で切り替えて、徐々に遅くする
    const totalSteps = 20
    let step = 0

    const roll = () => {
      if (step < totalSteps) {
        // ランダムな数字を表示
        const randomDisplay = minNumber + Math.floor(Math.random() * (maxNumber - minNumber + 1))
        setCurrentNumber(randomDisplay)
        playTickSound(audioCtx, step)

        // 徐々に遅くする (50ms -> 300ms)
        const delay = 50 + (step / totalSteps) * 250
        step++
        setTimeout(roll, delay)
      } else {
        // 最終的な数字を表示
        setCurrentNumber(finalNumber)
        setDrawnNumbers(prev => [...prev, finalNumber])
        setIsRolling(false)
        setIsRevealed(true)
        playFinalSound(audioCtx)
        speakNumber(finalNumber)

        // アニメーションフラグを少し遅れてリセット
        setTimeout(() => setIsRevealed(false), 1000)
      }
    }

    roll()
  }

  const endGame = () => {
    setGameStarted(false)
    setCurrentNumber(null)
    setDrawnNumbers([])
    setIsRevealed(false)
    clearState()
  }

  if (!gameStarted) {
    return (
      <div className="container">
        <h1>キッズビンゴ</h1>
        <div className="setup">
          <div className="input-group">
            <label>
              最小値:
              <input
                type="number"
                value={minNumber}
                onChange={(e) => setMinNumber(Number(e.target.value))}
                min="1"
              />
            </label>
          </div>
          <div className="input-group">
            <label>
              最大値:
              <input
                type="number"
                value={maxNumber}
                onChange={(e) => setMaxNumber(Number(e.target.value))}
                min={minNumber + 1}
              />
            </label>
          </div>
          <button className="start-btn" onClick={startGame}>
            スタート
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>キッズビンゴ</h1>
      <div className="game">
        <div className={`current-number ${isRolling ? 'rolling' : ''} ${isRevealed ? 'revealed' : ''}`}>
          {currentNumber !== null ? (
            <div className={`number-display ${isRolling ? 'slot-spin' : ''} ${isRevealed ? 'final-pop' : ''}`}>
              {currentNumber}
            </div>
          ) : (
            <div className="number-placeholder">ボタンを押してね！</div>
          )}
        </div>
        <button
          className={`draw-btn ${isRolling ? 'disabled' : ''}`}
          onClick={drawNumber}
          disabled={isRolling}
        >
          {isRolling ? '抽選中...' : '数字を引く'}
        </button>
        <div className="history">
          <h2>出た数字 ({drawnNumbers.length}個)</h2>
          <div className="drawn-numbers">
            {drawnNumbers.map((num) => (
              <span key={num} className="drawn-number">
                {num}
              </span>
            ))}
          </div>
        </div>
        <button className="end-btn" onClick={endGame}>
          終了
        </button>
      </div>
    </div>
  )
}

export default App
