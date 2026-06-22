<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { executeTerminalCommand, resolveCommandInput, terminalWelcomeLines } from '../terminal'
import type { TerminalAction, TerminalContext } from '../terminal'
import type { TerminalLine, TerminalLineDraft } from '../types'

type TerminalCommandBlock = {
  id: number
  command: string
  context: TerminalContext | null
  results: TerminalLine[]
}

const props = defineProps<{
  apiBaseUrl: string
  active: boolean
}>()

const emit = defineEmits<{
  action: [action: TerminalAction]
}>()

const welcomeLines = ref<TerminalLine[]>([])
const commandBlocks = ref<TerminalCommandBlock[]>([])
const commandInput = ref('')
const terminalContext = ref<TerminalContext | null>(null)
const isRunning = ref(false)
const outputRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
let lineId = 0
let blockId = 0
let historyIndex = -1
const commandHistory = ref<string[]>([])

const assignLineIds = (drafts: TerminalLineDraft[]) =>
  drafts.map((draft) => {
    lineId += 1
    return { ...draft, id: lineId }
  })

const resetWelcomeLines = () => {
  lineId = 0
  welcomeLines.value = assignLineIds(terminalWelcomeLines())
}

const clearTerminal = () => {
  resetWelcomeLines()
  commandBlocks.value = []
  blockId = 0
}

const scrollToBottom = async () => {
  await nextTick()

  if (outputRef.value) {
    outputRef.value.scrollTop = outputRef.value.scrollHeight
  }
}

const focusInput = () => {
  inputRef.value?.focus()
}

const canFillFromClick = (input: string, context: TerminalContext | null) => {
  const resolved = resolveCommandInput(input.trimEnd(), context)

  return /^(bd\s+(g|m|d)|md\s+g|gc\s+(m|r))\s*$/i.test(resolved.trimEnd())
}

const resolvedCommandInput = () =>
  resolveCommandInput(commandInput.value.trimEnd(), terminalContext.value)

const handleLineClick = async (line: TerminalLine) => {
  if (!line.clickValue || isRunning.value) {
    return
  }

  const input = commandInput.value.trimEnd()

  if (!canFillFromClick(input, terminalContext.value)) {
    return
  }

  commandInput.value = `${input} ${line.clickValue}`
  await nextTick()
  focusInput()

  const length = commandInput.value.length
  inputRef.value?.setSelectionRange(length, length)
}

const runCommand = async () => {
  const command = commandInput.value.trim()

  if (!command || isRunning.value) {
    return
  }

  blockId += 1
  const currentContext = terminalContext.value
  const block: TerminalCommandBlock = {
    id: blockId,
    command,
    context: currentContext,
    results: [],
  }

  commandBlocks.value.push(block)
  commandInput.value = ''
  historyIndex = commandHistory.value.length
  commandHistory.value.push(command)
  isRunning.value = true

  try {
    const result = await executeTerminalCommand(command, props.apiBaseUrl, currentContext)

    if (result.context !== undefined) {
      terminalContext.value = result.context
    }

    if (result.clear) {
      clearTerminal()
    } else if (result.lines.length > 0) {
      block.results = assignLineIds(result.lines)
    }

    if (result.action) {
      emit('action', result.action)
    }
  } catch (error) {
    block.results = assignLineIds([
      {
        type: 'error',
        text: error instanceof Error ? error.message : '명령 실행 중 오류가 발생했습니다.',
      },
    ])
  } finally {
    isRunning.value = false
    await scrollToBottom()
    focusInput()
  }
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()

    if (commandHistory.value.length === 0) {
      return
    }

    historyIndex = historyIndex <= 0 ? 0 : historyIndex - 1
    commandInput.value = commandHistory.value[historyIndex] ?? ''
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()

    if (commandHistory.value.length === 0) {
      return
    }

    if (historyIndex >= commandHistory.value.length - 1) {
      historyIndex = commandHistory.value.length
      commandInput.value = ''
      return
    }

    historyIndex += 1
    commandInput.value = commandHistory.value[historyIndex] ?? ''
  }
}

watch(
  () => props.active,
  (active) => {
    if (active) {
      void scrollToBottom()
      focusInput()
    }
  },
)

onMounted(() => {
  isRunning.value = false
  resetWelcomeLines()
  void scrollToBottom()

  if (props.active) {
    focusInput()
  }
})

defineExpose({ focusInput })
</script>

<template>
  <section class="view-panel terminal-view">
    <div class="terminal-panel">
      <header class="terminal-titlebar">
        <div class="terminal-traffic-lights" aria-hidden="true">
          <span class="terminal-light terminal-light-close" />
          <span class="terminal-light terminal-light-minimize" />
          <span class="terminal-light terminal-light-maximize" />
        </div>
        <span class="terminal-titlebar-label">-zsh</span>
      </header>

      <div ref="outputRef" class="terminal-output" aria-live="polite" @click="focusInput">
        <div
          v-for="line in welcomeLines"
          :key="line.id"
          class="terminal-line terminal-line-output terminal-line-muted"
        >
          <pre class="terminal-text">{{ line.text }}</pre>
        </div>

        <div
          v-for="(block, blockIndex) in commandBlocks"
          :key="block.id"
          class="terminal-command-group"
        >
          <div class="terminal-line terminal-line-input">
            <span class="terminal-prompt" aria-hidden="true">
              <template v-if="block.context">
                <span class="terminal-prompt-context">({{ block.context }})</span>
                <span class="terminal-prompt-divider">|</span>
              </template>
              <span v-else class="terminal-prompt-arrow">➜</span>
            </span>
            <pre class="terminal-text terminal-text-command">{{ block.command }}</pre>
          </div>

          <template
            v-if="block.results.length > 0 || (isRunning && blockIndex === commandBlocks.length - 1)"
          >
            <div class="terminal-command-results">
              <div v-for="line in block.results" :key="line.id" class="terminal-result-block">
                <hr v-if="line.groupBreak" class="terminal-line-separator" />

                <div
                  class="terminal-line terminal-line-result"
                  :class="`terminal-line-${line.type}`"
                >
                  <button
                    v-if="line.clickValue && line.type === 'output'"
                    type="button"
                    class="terminal-text terminal-text-clickable"
                    :title="`${resolvedCommandInput()} ${line.clickValue}`"
                    @click.stop="handleLineClick(line)"
                  ><template v-if="line.textParts?.length"><span
                      v-for="(part, partIndex) in line.textParts"
                      :key="partIndex"
                      :style="part.color ? { color: part.color } : undefined"
                    >{{ part.text }}</span></template><template v-else>{{ line.text }}</template></button>
                  <pre v-else-if="!line.textParts?.length" class="terminal-text">{{ line.text }}</pre>
                  <span v-else class="terminal-text terminal-text-line"><span
                      v-for="(part, partIndex) in line.textParts"
                      :key="partIndex"
                      :style="part.color ? { color: part.color } : undefined"
                    >{{ part.text }}</span></span>
                </div>
              </div>

              <p
                v-if="isRunning && blockIndex === commandBlocks.length - 1"
                class="terminal-running"
              >
                실행 중...
              </p>
            </div>
          </template>
        </div>

        <form class="terminal-line terminal-line-active" @submit.prevent="runCommand" @click.stop>
          <span class="terminal-prompt" aria-hidden="true">
            <template v-if="terminalContext">
              <span class="terminal-prompt-context">({{ terminalContext }})</span>
              <span class="terminal-prompt-divider">|</span>
            </template>
            <span v-else class="terminal-prompt-arrow">➜</span>
          </span>
          <input
            ref="inputRef"
            v-model="commandInput"
            class="terminal-input"
            type="text"
            spellcheck="false"
            autocomplete="off"
            aria-label="터미널 명령어 입력"
            :disabled="isRunning"
            @keydown="handleInputKeydown"
          />
        </form>
      </div>
    </div>
  </section>
</template>
