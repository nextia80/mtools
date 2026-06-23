<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { executeTerminalCommand, resolveCommandInput, terminalWelcomeLines } from '../terminal'
import { formatDateTime, formatPromptContextLabel, isLoginPromptContext, isLoginPasswordContext, maskLoginCommandForDisplay } from '../terminal/textUtils'
import type { TerminalAction, TerminalContext } from '../terminal'
import type { Member, TerminalLine, TerminalLineDraft } from '../types'

type TerminalCommandBlock = {
  id: number
  command: string
  context: TerminalContext | null
  results: TerminalLine[]
}

const props = defineProps<{
  apiBaseUrl: string
  active: boolean
  isLoggedIn: boolean
  currentMember: Member | null
  loggedInAt: string | null
  lastSessionLabel: string | null
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
  welcomeLines.value = assignLineIds(
    terminalWelcomeLines(props.isLoggedIn, props.isLoggedIn ? null : props.lastSessionLabel),
  )
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

const scrollToTop = async () => {
  await nextTick()

  if (outputRef.value) {
    outputRef.value.scrollTop = 0
  }
}

const maskCommandForDisplay = (command: string, context: TerminalContext | null) =>
  maskLoginCommandForDisplay(command, context)

const isPasswordInput = computed(() => isLoginPasswordContext(terminalContext.value))

const sessionTimeLabel = computed(() => formatDateTime(props.loggedInAt))

const applyWelcomeLines = (drafts: TerminalLineDraft[]) => {
  lineId = 0
  welcomeLines.value = assignLineIds(drafts)
}

const scrollToMailAnchor = async (anchor: 'start' | 'end', mailRef?: string) => {
  await nextTick()
  await nextTick()

  const container = outputRef.value

  if (!container) {
    return
  }

  const findTarget = () => {
    const selector = mailRef
      ? `[data-mail-scroll-anchor="${anchor}"][data-mail-ref="${mailRef}"]`
      : `[data-mail-scroll-anchor="${anchor}"]`
    const candidates = container.querySelectorAll<HTMLElement>(selector)
    let target = candidates[candidates.length - 1]

    if (!target && mailRef) {
      const headerPrefix = anchor === 'start' ? `── ${mailRef} |` : '--- /r 읽음'
      const lines = container.querySelectorAll<HTMLElement>('.terminal-line-result')

      for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index]
        const text = line?.textContent?.trim() ?? ''

        if (text.startsWith(headerPrefix)) {
          target = line
          break
        }
      }
    }

    return target
  }

  requestAnimationFrame(() => {
    const target = findTarget()

    if (!target || !outputRef.value) {
      return
    }

    const containerRect = outputRef.value.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = targetRect.top - containerRect.top + outputRef.value.scrollTop - 12

    outputRef.value.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    })
  })
}

const focusInput = () => {
  inputRef.value?.focus()
}

const canFillFromClick = (input: string, context: TerminalContext | null) => {
  const resolved = resolveCommandInput(input.trimEnd(), context)

  return /^(bd\s+(g|m|d)|md\s+g|gc\s+(m|r)|gm\s+r)\s*$/i.test(resolved.trimEnd())
}

const resolvedCommandInput = () =>
  resolveCommandInput(commandInput.value.trimEnd(), terminalContext.value)

const handleLineClick = async (line: TerminalLine) => {
  if (!line.clickValue || isRunning.value) {
    return
  }

  const input = commandInput.value.trimEnd()
  const context = terminalContext.value

  if (context === 'gm' && !input) {
    commandInput.value = `r ${line.clickValue}`
    await nextTick()
    focusInput()

    const length = commandInput.value.length
    inputRef.value?.setSelectionRange(length, length)
    return
  }

  if (!canFillFromClick(input, context)) {
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
  const displayCommand = maskCommandForDisplay(command, currentContext)
  const block: TerminalCommandBlock = {
    id: blockId,
    command: displayCommand,
    context: currentContext,
    results: [],
  }

  commandBlocks.value.push(block)
  commandInput.value = ''
  historyIndex = commandHistory.value.length
  commandHistory.value.push(displayCommand)
  isRunning.value = true
  let scrollMailAction: Extract<TerminalAction, { type: 'scroll-mail' }> | null = null
  let scrollToTopAfter = false

  try {
    const result = await executeTerminalCommand(
      command,
      props.apiBaseUrl,
      currentContext,
      props.isLoggedIn,
      {
        loggedInAt: props.loggedInAt,
        lastSessionLabel: props.lastSessionLabel,
      },
    )

    if (result.context !== undefined) {
      terminalContext.value = result.context
    }

    if (result.clear) {
      clearTerminal()
    } else if (result.lines.length > 0) {
      block.results = assignLineIds(result.lines)
    }

    if (result.welcomeLines) {
      applyWelcomeLines(result.welcomeLines)
      scrollToTopAfter = true
    }

    if (result.resetCommands) {
      commandBlocks.value = []
      blockId = 0
    }

    if (result.action) {
      if (result.action.type === 'scroll-mail') {
        scrollMailAction = result.action
      } else {
        emit('action', result.action)
      }
    }

    if (result.inputDraft) {
      commandInput.value = result.inputDraft
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

    if (scrollMailAction) {
      await scrollToMailAnchor(scrollMailAction.anchor, scrollMailAction.ref)
    } else if (scrollToTopAfter) {
      await scrollToTop()
    } else {
      await scrollToBottom()
    }

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

watch(
  () => props.isLoggedIn,
  () => {
    resetWelcomeLines()
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
          class="terminal-line terminal-line-output"
          :class="{
            'terminal-line-muted':
              !line.logo
              && !line.logoSubtitle
              && !line.bannerBar
              && !line.welcomeStatus,
            'terminal-line-logo': line.logo,
            'terminal-line-logo-subtitle': line.logoSubtitle,
            'terminal-line-banner-bar': line.bannerBar,
            'terminal-line-welcome-status': line.welcomeStatus,
          }"
        >
          <hr v-if="line.bannerBar" class="terminal-banner-bar" />
          <pre v-else class="terminal-text">{{ line.text }}</pre>
        </div>

        <div
          v-for="(block, blockIndex) in commandBlocks"
          :key="block.id"
          class="terminal-command-group"
          :class="{ 'terminal-command-group-compact': isLoginPromptContext(block.context) }"
        >
          <div class="terminal-line terminal-line-input">
            <span class="terminal-prompt" aria-hidden="true">
              <template v-if="block.context">
                <span class="terminal-prompt-context">({{ formatPromptContextLabel(block.context) }})</span>
                <span class="terminal-prompt-divider">|</span>
              </template>
              <span v-else class="terminal-prompt-arrow">$</span>
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
                  :data-mail-scroll-anchor="line.mailScrollAnchor"
                  :data-mail-ref="line.mailRef"
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
                  <div
                    v-else-if="line.htmlContent"
                    class="terminal-mail-body-html"
                    v-html="line.htmlContent"
                  />
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

        <form
          class="terminal-line terminal-line-active"
          :class="{ 'terminal-line-active-compact': isLoginPromptContext(terminalContext) }"
          @submit.prevent="runCommand"
          @click.stop
        >
          <span class="terminal-prompt" aria-hidden="true">
            <template v-if="terminalContext">
              <span class="terminal-prompt-context">({{ formatPromptContextLabel(terminalContext) }})</span>
              <span class="terminal-prompt-divider">|</span>
            </template>
            <span v-else class="terminal-prompt-arrow">$</span>
          </span>
          <input
            ref="inputRef"
            v-model="commandInput"
            class="terminal-input"
            :type="isPasswordInput ? 'password' : 'text'"
            spellcheck="false"
            autocomplete="off"
            aria-label="터미널 명령어 입력"
            :disabled="isRunning"
            @keydown="handleInputKeydown"
          />
        </form>
      </div>

      <footer v-if="currentMember" class="terminal-statusbar">
        <span class="terminal-statusbar-name">{{ currentMember.name }}</span>
        <span class="terminal-statusbar-level">Lv.{{ currentMember.level }}</span>
        <span class="terminal-statusbar-time">{{ sessionTimeLabel }}</span>
      </footer>
    </div>
  </section>
</template>
