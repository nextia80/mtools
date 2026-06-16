<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { MdFile, MdViewMode } from '../types'

const props = defineProps<{
  selectedMdFile: MdFile | undefined
  mdViewMode: MdViewMode
  mdErrorMessage: string
  mdSaveMessage: string
  isMdContentLoading: boolean
  isMdSaving: boolean
  editedMdContent: string
  renderedMdContent: string
}>()

defineEmits<{
  setMdViewMode: [mode: MdViewMode]
  saveMdFile: []
  updateEditedMdContent: [value: string]
  mdContentClick: [event: MouseEvent]
}>()

const mdEditorRef = ref<HTMLTextAreaElement | null>(null)

watch(
  () => props.mdViewMode,
  async (mode) => {
    if (mode !== 'edit') {
      return
    }

    await nextTick()
    mdEditorRef.value?.focus()
  },
)
</script>

<template>
  <section class="view-panel docs-view">
    <div class="docs-header">
      <div>
        <span class="eyebrow">Documents</span>
        <h1>일자별 MD</h1>
      </div>
    </div>

    <p v-if="mdErrorMessage" class="error inline">{{ mdErrorMessage }}</p>
    <p v-if="mdSaveMessage" class="success inline">{{ mdSaveMessage }}</p>

    <article class="md-viewer">
      <div v-if="selectedMdFile" class="md-viewer-header">
        <div class="md-viewer-title">
          <h3>{{ selectedMdFile.name }}</h3>
          <span>{{ selectedMdFile.path }}</span>
        </div>
        <div class="md-mode-actions" aria-label="Markdown 보기 모드">
          <button
            class="mode-button"
            :class="{ active: mdViewMode === 'review' }"
            type="button"
            @click="$emit('setMdViewMode', 'review')"
          >
            리뷰 <span class="shortcut">⌘V</span>
          </button>
          <button
            class="mode-button"
            :class="{ active: mdViewMode === 'edit' }"
            type="button"
            @click="$emit('setMdViewMode', 'edit')"
          >
            편집 <span class="shortcut">⌘E</span>
          </button>
          <button
            v-if="mdViewMode === 'edit'"
            class="save-button"
            type="button"
            :disabled="isMdSaving"
            @click="$emit('saveMdFile')"
          >
            {{ isMdSaving ? '저장 중' : '저장' }} <span class="shortcut">⌘S</span>
          </button>
        </div>
      </div>

      <p v-if="isMdContentLoading" class="notice">MD 파일을 불러오는 중입니다.</p>
      <textarea
        v-else-if="selectedMdFile && mdViewMode === 'edit'"
        ref="mdEditorRef"
        :value="editedMdContent"
        class="md-editor"
        spellcheck="false"
        aria-label="Markdown 편집기"
        @input="$emit('updateEditedMdContent', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <div
        v-else-if="selectedMdFile && editedMdContent"
        class="md-content"
        @click="$emit('mdContentClick', $event)"
        v-html="renderedMdContent"
      ></div>
      <p v-else class="empty">좌측 일자별 MD 메뉴에서 파일을 선택하세요.</p>
    </article>
  </section>
</template>
