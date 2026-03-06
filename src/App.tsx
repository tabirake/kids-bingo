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
  const [minInput, setMinInput] = useState(String(saved?.minNumber ?? 1))
  const [maxInput, setMaxInput] = useState(String(saved?.maxNumber ?? 75))
  const [currentNumber, setCurrentNumber] = useState<number | null>(saved?.currentNumber ?? null)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(saved?.drawnNumbers ?? [])
  const [isRolling, setIsRolling] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const stopRequestedRef = useRef(false)
  const finalNumberRef = useRef<number | null>(null)

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
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  // モバイルでSpeechSynthesisを有効化するため、ユーザー操作時に空の発話でロック解除
  const unlockSpeech = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance('')
    utterance.volume = 0
    speechSynthesis.speak(utterance)
  }, [])

  const startGame = () => {
    // モバイル対応: ユーザータップのタイミングで音声系を初期化
    getAudioCtx()
    unlockSpeech()
    setGameStarted(true)
    setDrawnNumbers([])
    setCurrentNumber(null)
    setIsRevealed(false)
  }

  const revealNumber = useCallback((finalNumber: number, audioCtx: AudioContext) => {
    // 減速して止まる演出
    setIsStopping(true)
    const slowSteps = 8
    let step = 0

    const slowDown = () => {
      if (step < slowSteps) {
        const randomDisplay = minNumber + Math.floor(Math.random() * (maxNumber - minNumber + 1))
        setCurrentNumber(randomDisplay)
        playTickSound(audioCtx, 15 + step)
        const delay = 100 + step * 50
        step++
        setTimeout(slowDown, delay)
      } else {
        setCurrentNumber(finalNumber)
        setDrawnNumbers(prev => [...prev, finalNumber])
        setIsRolling(false)
        setIsStopping(false)
        setIsRevealed(true)
        stopRequestedRef.current = false
        playFinalSound(audioCtx)
        speakNumber(finalNumber)
        setTimeout(() => setIsRevealed(false), 1000)
      }
    }

    slowDown()
  }, [minNumber, maxNumber])

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
    finalNumberRef.current = finalNumber
    const audioCtx = getAudioCtx()

    setIsRolling(true)
    setIsRevealed(false)
    stopRequestedRef.current = false

    // スロット演出: ストップが押されるまで回り続ける
    let tick = 0
    const roll = () => {
      if (stopRequestedRef.current) {
        revealNumber(finalNumber, audioCtx)
        return
      }
      const randomDisplay = minNumber + Math.floor(Math.random() * (maxNumber - minNumber + 1))
      setCurrentNumber(randomDisplay)
      playTickSound(audioCtx, tick % 10)
      tick++
      setTimeout(roll, 80)
    }

    roll()
  }

  const stopRoll = () => {
    if (isRolling && !isStopping) {
      stopRequestedRef.current = true
    }
  }

  const endGame = () => {
    setGameStarted(false)
    setCurrentNumber(null)
    setDrawnNumbers([])
    setIsRevealed(false)
    setShowConfirm(false)
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
                type="text"
                inputMode="numeric"
                value={minInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '')
                  setMinInput(v)
                  if (v !== '') setMinNumber(Number(v))
                }}
              />
            </label>
          </div>
          <div className="input-group">
            <label>
              最大値:
              <input
                type="text"
                inputMode="numeric"
                value={maxInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '')
                  setMaxInput(v)
                  if (v !== '') setMaxNumber(Number(v))
                }}
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
        <div className="game-main">
          <div className="slot-area">
            <div className={`current-number ${isRolling ? 'rolling' : ''} ${isRevealed ? 'revealed' : ''}`}>
              {currentNumber !== null ? (
                <div className={`number-display ${isRolling ? 'slot-spin' : ''} ${isRevealed ? 'final-pop' : ''}`}>
                  {currentNumber}
                </div>
              ) : (
                <div className="number-placeholder">ボタンを押してね！</div>
              )}
            </div>
            <div className="slot-buttons">
              {isRolling ? (
                <button
                  className={`stop-btn ${isStopping ? 'disabled' : ''}`}
                  onClick={stopRoll}
                  disabled={isStopping}
                >
                  {isStopping ? 'とまります...' : 'ストップ！'}
                </button>
              ) : (
                <button className="draw-btn" onClick={drawNumber}>
                  すうじをひく
                </button>
              )}
              <button className="end-btn" onClick={() => setShowConfirm(true)}>
                おわる
              </button>
            </div>
          </div>
          <div className="history-header">
            <h2>でたすうじ ({drawnNumbers.length}こ)</h2>
            {drawnNumbers.length > 0 && (
              <button className="fullscreen-btn" onClick={() => setShowFullHistory(true)}>
                おおきくみる
              </button>
            )}
          </div>
          <div className="drawn-numbers">
            {drawnNumbers.map((num) => (
              <span key={num} className="drawn-number" onClick={() => speakNumber(num)}>
                {num}
              </span>
            ))}
          </div>
        </div>
      </div>
      {showFullHistory && (
        <div className="fullscreen-overlay" onClick={() => setShowFullHistory(false)}>
          <div className="fullscreen-history" onClick={(e) => e.stopPropagation()}>
            <h2>でたすうじ ({drawnNumbers.length}こ)</h2>
            <div className="fullscreen-numbers">
              {drawnNumbers.map((num) => (
                <span key={num} className="fullscreen-number">
                  {num}
                </span>
              ))}
            </div>
            <button className="fullscreen-close" onClick={() => setShowFullHistory(false)}>
              とじる
            </button>
          </div>
        </div>
      )}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>ゲームをおわりにする？</p>
            <div className="modal-buttons">
              <button className="modal-yes" onClick={endGame}>はい</button>
              <button className="modal-no" onClick={() => setShowConfirm(false)}>いいえ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
