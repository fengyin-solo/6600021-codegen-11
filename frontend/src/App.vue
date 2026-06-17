<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="flex gap-2 flex-wrap">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex justify-between mb-2">
          <h3 class="text-purple-300 font-bold">统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
            class="flex justify-between bg-gray-800 rounded p-2 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Battle -->
    <div v-if="activeTab === 'battle'" class="space-y-4">
      <!-- Setup Phase -->
      <div v-if="store.battlePhase === 'setup'" class="grid grid-cols-2 gap-4">
        <div class="bg-gray-900 rounded-xl p-4">
          <h3 class="text-purple-300 font-bold mb-3">对战设置</h3>
          <div class="flex gap-2 mb-3">
            <input v-model="newPlayerName" @keyup.enter="doAddPlayer"
              class="flex-1 bg-gray-800 rounded px-3 py-2 text-white" placeholder="输入玩家名称..." />
            <button @click="doAddPlayer" class="bg-purple-500 px-4 py-2 rounded hover:bg-purple-400">添加</button>
          </div>
          <div class="space-y-2 mb-4">
            <div v-for="p in store.battlePlayers" :key="p.id"
              class="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" :style="{ background: playerColors[p.id % playerColors.length] }"></div>
                <span>{{ p.name }}</span>
              </div>
              <button @click="store.removePlayer(p.id)" class="text-red-400 hover:text-red-300 text-sm">移除</button>
            </div>
            <div v-if="store.battlePlayers.length === 0" class="text-gray-500 text-sm text-center py-4">
              请添加至少 2 名玩家
            </div>
          </div>
          <div class="mb-4">
            <label class="text-sm text-gray-400 mb-1 block">回合数</label>
            <select v-model.number="selectedRounds" class="w-full bg-gray-800 rounded px-3 py-2 text-white">
              <option :value="3">3 回合</option>
              <option :value="5">5 回合</option>
              <option :value="10">10 回合</option>
              <option :value="15">15 回合</option>
            </select>
          </div>
          <button @click="store.startBattle(selectedRounds)"
            :disabled="store.battlePlayers.length < 2"
            class="w-full bg-purple-500 px-4 py-3 rounded-lg text-lg font-bold hover:bg-purple-400 disabled:bg-gray-700 disabled:cursor-not-allowed">
            开始对战
          </button>
        </div>
        <div class="bg-gray-900 rounded-xl p-4">
          <h3 class="text-purple-300 font-bold mb-3">对战规则</h3>
          <ul class="space-y-2 text-gray-300 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-purple-400">1.</span>
              玩家轮流进行盲文答题
            </li>
            <li class="flex items-start gap-2">
              <span class="text-purple-400">2.</span>
              每回合每人回答 1 题，答对得 1 分
            </li>
            <li class="flex items-start gap-2">
              <span class="text-purple-400">3.</span>
              根据选择的回合数进行比赛
            </li>
            <li class="flex items-start gap-2">
              <span class="text-purple-400">4.</span>
              答对/答错会有不同振动反馈（支持设备）
            </li>
            <li class="flex items-start gap-2">
              <span class="text-purple-400">5.</span>
              最终得分最高者获胜
            </li>
          </ul>
        </div>
      </div>

      <!-- Playing Phase -->
      <div v-if="store.battlePhase === 'playing'" class="grid grid-cols-3 gap-4">
        <div class="bg-gray-900 rounded-xl p-4 col-span-2">
          <div class="flex justify-between items-center mb-4">
            <div class="text-purple-300 font-bold">
              第 {{ store.currentRound }} / {{ store.battleRounds }} 回合
            </div>
            <button @click="store.resetBattle()" class="text-red-400 text-sm hover:underline">结束对战</button>
          </div>
          <div class="flex flex-col items-center gap-4">
            <div class="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2">
              <div class="w-3 h-3 rounded-full"
                :style="{ background: store.currentPlayer ? playerColors[store.currentPlayer.id % playerColors.length] : '#666' }"></div>
              <span class="text-lg font-bold text-purple-300">{{ store.currentPlayer?.name }} 的回合</span>
            </div>
            <div class="text-8xl font-bold text-purple-400">{{ store.battleQuizChar }}</div>
            <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
            <div class="grid grid-cols-2 gap-3 p-5 bg-gray-800 rounded-xl">
              <button v-for="d in 6" :key="d" @click="store.toggleBattleDot(d)"
                class="w-16 h-16 rounded-full border-2 transition-all text-base"
                :class="store.battleSelectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
                {{ d }}
              </button>
            </div>
            <button @click="store.checkBattleAnswer()"
              :disabled="store.battleSelectedDots.length === 0"
              class="bg-purple-500 px-8 py-3 rounded-lg text-lg font-bold hover:bg-purple-400 disabled:bg-gray-700 disabled:cursor-not-allowed">
              确认答案
            </button>
          </div>
        </div>
        <div class="bg-gray-900 rounded-xl p-4">
          <h3 class="text-purple-300 font-bold mb-3">实时计分</h3>
          <div class="space-y-2 mb-4">
            <div v-for="(p, idx) in store.sortedPlayers" :key="p.id"
              class="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
              :class="store.currentPlayer?.id === p.id ? 'ring-2 ring-purple-400' : ''">
              <div class="flex items-center gap-2">
                <span class="text-yellow-400 text-sm w-5">{{ idx + 1 }}</span>
                <div class="w-3 h-3 rounded-full" :style="{ background: playerColors[p.id % playerColors.length] }"></div>
                <span>{{ p.name }}</span>
              </div>
              <span class="font-bold text-xl text-purple-300">{{ p.score }}</span>
            </div>
          </div>
          <h3 class="text-purple-300 font-bold mb-2 text-sm">答题记录</h3>
          <div class="space-y-1 max-h-48 overflow-y-auto">
            <div v-for="(h, i) in store.battleHistory.slice(0, 15)" :key="i"
              class="flex justify-between bg-gray-800 rounded p-2 text-xs"
              :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
              <span>{{ h.playerName }}: {{ h.char }}</span>
              <span>{{ h.correct ? '✓' : '✗' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Result Phase -->
      <div v-if="store.battlePhase === 'result'" class="bg-gray-900 rounded-xl p-6">
        <div class="text-center mb-6">
          <div class="text-6xl mb-2">🏆</div>
          <h2 class="text-3xl font-bold text-purple-400 mb-2">对战结束</h2>
          <div class="text-xl text-yellow-400">
            {{ store.battleWinners.length === 1 ? `${store.battleWinners[0].name} 获胜！` : `${store.battleWinners.map(w => w.name).join('、')} 并列冠军！` }}
          </div>
        </div>
        <div class="max-w-md mx-auto mb-6">
          <h3 class="text-purple-300 font-bold mb-3">最终排名</h3>
          <div class="space-y-2">
            <div v-for="(p, idx) in store.sortedPlayers" :key="p.id"
              class="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
              :class="idx === 0 ? 'ring-2 ring-yellow-400' : ''">
              <div class="flex items-center gap-3">
                <span class="text-2xl font-bold w-8 text-center"
                  :class="idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-500'">
                  {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
                </span>
                <div class="w-3 h-3 rounded-full" :style="{ background: playerColors[p.id % playerColors.length] }"></div>
                <span class="text-lg">{{ p.name }}</span>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-purple-300">{{ p.score }} 分</div>
                <div class="text-xs text-gray-500">
                  {{ store.battleRounds }} 回合
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-3 justify-center">
          <button @click="store.resetBattle()" class="bg-purple-500 px-6 py-3 rounded-lg hover:bg-purple-400">
            重新开始
          </button>
          <button @click="store.startBattle(store.battleRounds)" class="bg-gray-700 px-6 py-3 rounded-lg hover:bg-gray-600">
            再来一局
          </button>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <button @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBrailleStore } from './store/braille'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'

const store = useBrailleStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'battle', label: '多人对战' },
  { id: 'ref', label: '速查表' },
]
const activeTab = ref('translate')
const newPlayerName = ref('')
const selectedRounds = ref(5)
const playerColors = ['#f472b6', '#60a5fa', '#4ade80', '#facc15', '#f97316', '#a78bfa']

function doAddPlayer() {
  store.addPlayer(newPlayerName.value)
  newPlayerName.value = ''
}

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}
</script>
