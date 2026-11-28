import rainSound from '@/assets/sounds/rain-sound.mp3'
import forestSound from '@/assets/sounds/forest-ambience.mp3'
import oceanSound from '@/assets/sounds/ocean-waves.mp3'
import whiteNoiseSound from '@/assets/sounds/white-noise.mp3'
import fireplaceSound from '@/assets/sounds/fireplace.mp3'
import cafeSound from '@/assets/sounds/restaurant-cafe.mp3'

let audioContext = null
let ambientAudio = null

const ambientSources = {
  rain: rainSound,
  forest: forestSound,
  ocean: oceanSound,
  white: whiteNoiseSound,
  fireplace: fireplaceSound,
  cafe: cafeSound,
}

const getContext = () => {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  if (!audioContext) audioContext = new AudioContext()
  return audioContext
}

export const unlockAudio = () => {
  const ctx = getContext()
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

export const stopAmbient = () => {
  if (!ambientAudio) return
  ambientAudio.pause()
  ambientAudio.currentTime = 0
  ambientAudio = null
}

export const setAmbientVolume = (volume) => {
  if (!ambientAudio) return
  ambientAudio.volume = Math.max(0, Math.min(100, volume)) / 100
}

export const playAmbient = (type, volume = 60, onError) => {
  stopAmbient()
  if (!type || !ambientSources[type]) return

  const audio = new Audio(ambientSources[type])
  audio.loop = true
  audio.volume = Math.max(0, Math.min(100, volume)) / 100
  ambientAudio = audio

  audio.play().catch((error) => {
    console.error(`Unable to play ambient sound "${type}"`, error)
    if (ambientAudio === audio) ambientAudio = null
    onError?.('Your browser blocked audio playback. Press play again to start the sound.')
  })
}

export const playRingtone = (ringtone = 'chime') => {
  const ctx = unlockAudio()
  if (!ctx) return

  const patterns = {
    chime: [523.25, 659.25, 783.99],
    bell: [880, 659.25, 880],
    digital: [987.77, 987.77, 987.77],
  }
  const notes = patterns[ringtone] || patterns.chime

  notes.forEach((frequency, index) => {
    const start = ctx.currentTime + index * (ringtone === 'digital' ? 0.18 : 0.32)
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = ringtone === 'digital' ? 'square' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(ringtone === 'digital' ? 0.08 : 0.18, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (ringtone === 'digital' ? 0.14 : 0.5))
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + (ringtone === 'digital' ? 0.16 : 0.52))
  })
}
