import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode, Player, BattleHistory, BattlePhase } from '../types'

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizChar = ref('')
  const selectedDots = ref<number[]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])

  const battlePlayers = ref<Player[]>([])
  const battlePhase = ref<BattlePhase>('setup')
  const currentPlayerIndex = ref(0)
  const battleHistory = ref<BattleHistory[]>([])
  const battleRounds = ref(5)
  const currentRound = ref(1)
  const battleSelectedDots = ref<number[]>([])
  const battleQuizChar = ref('')

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  const currentPlayer = computed(() => battlePlayers.value[currentPlayerIndex.value])

  const sortedPlayers = computed(() =>
    [...battlePlayers.value].sort((a, b) => b.score - a.score)
  )

  const battleWinners = computed(() => {
    if (sortedPlayers.value.length === 0) return []
    const maxScore = sortedPlayers.value[0].score
    return sortedPlayers.value.filter(p => p.score === maxScore)
  })

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    return brailleToText(selectedDots.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    selectedDots.value = []
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) selectedDots.value.splice(idx, 1)
    else selectedDots.value.push(dot)
  }

  function checkQuizAnswer() {
    const correct = JSON.stringify([...selectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[quizChar.value] || [])].sort())
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct })
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  function addPlayer(name: string) {
    if (name.trim() && battlePlayers.value.length < 6) {
      battlePlayers.value.push({
        id: Date.now(),
        name: name.trim(),
        score: 0
      })
    }
  }

  function removePlayer(id: number) {
    const idx = battlePlayers.value.findIndex(p => p.id === id)
    if (idx >= 0) battlePlayers.value.splice(idx, 1)
  }

  function startBattle(rounds: number = 5) {
    if (battlePlayers.value.length < 2) return
    battleRounds.value = rounds
    currentRound.value = 1
    currentPlayerIndex.value = 0
    battleHistory.value = []
    battlePlayers.value.forEach(p => p.score = 0)
    battlePhase.value = 'playing'
    generateBattleQuiz()
  }

  function generateBattleQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    battleQuizChar.value = chars[Math.floor(Math.random() * chars.length)]
    battleSelectedDots.value = []
  }

  function toggleBattleDot(dot: number) {
    const idx = battleSelectedDots.value.indexOf(dot)
    if (idx >= 0) battleSelectedDots.value.splice(idx, 1)
    else battleSelectedDots.value.push(dot)
  }

  function checkBattleAnswer() {
    const correct = JSON.stringify([...battleSelectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[battleQuizChar.value] || [])].sort())
    const player = currentPlayer.value
    if (player && correct) {
      player.score++
    }
    if (player) {
      battleHistory.value.unshift({
        playerId: player.id,
        playerName: player.name,
        char: battleQuizChar.value,
        correct,
        timestamp: Date.now()
      })
    }
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    nextBattleTurn()
  }

  function nextBattleTurn() {
    if (currentPlayerIndex.value < battlePlayers.value.length - 1) {
      currentPlayerIndex.value++
    } else {
      currentPlayerIndex.value = 0
      if (currentRound.value < battleRounds.value) {
        currentRound.value++
      } else {
        battlePhase.value = 'result'
        return
      }
    }
    generateBattleQuiz()
  }

  function resetBattle() {
    battlePhase.value = 'setup'
    currentRound.value = 1
    currentPlayerIndex.value = 0
    battleHistory.value = []
    battleQuizChar.value = ''
    battleSelectedDots.value = []
  }

  return {
    inputText, brailleOutput, learnMode, quizChar, selectedDots, score, history,
    brailleUnicode, translate, reverseTranslate, generateQuiz, toggleDot,
    checkQuizAnswer, resetScore, exportPDF,
    battlePlayers, battlePhase, currentPlayerIndex, battleHistory, battleRounds,
    currentRound, battleSelectedDots, battleQuizChar, currentPlayer,
    sortedPlayers, battleWinners,
    addPlayer, removePlayer, startBattle, toggleBattleDot, checkBattleAnswer,
    resetBattle
  }
})
