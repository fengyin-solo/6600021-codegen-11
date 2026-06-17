export interface BrailleChar {
  char: string
  dots: number[]  // 1-6 active dots
  unicode: string
}

export type LearnMode = 'charToBraille' | 'brailleToChar' | 'dictation'

export interface Player {
  id: number
  name: string
  score: number
}

export interface BattleHistory {
  playerId: number
  playerName: string
  char: string
  correct: boolean
  timestamp: number
}

export type BattlePhase = 'setup' | 'playing' | 'result'
