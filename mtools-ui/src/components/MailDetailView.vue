<script setup lang="ts">
import { computed } from 'vue'
import type { MailMessage, MailMessageDetail } from '../types'

const props = defineProps<{
  detail: MailMessageDetail | null
  messages: MailMessage[]
  selectedIndex: number
  errorMessage: string
  saveMessage: string
  isLoading: boolean
  isDeleting: boolean
  isArchiving: boolean
}>()

defineEmits<{
  back: []
  prev: []
  next: []
  archiveMail: []
  deleteMail: []
}>()

const isBusy = computed(() => props.isLoading || props.isDeleting || props.isArchiving)

const hasPrev = computed(() => props.selectedIndex > 0)
const hasNext = computed(() => props.selectedIndex >= 0 && props.selectedIndex < props.messages.length - 1)

const positionLabel = computed(() => {
  if (props.selectedIndex < 0 || props.messages.length === 0) {
    return ''
  }

  return `${props.selectedIndex + 1} / ${props.messages.length}`
})

const formatSender = (from: string) => {
  const match = from.match(/^([^<]+)</)

  if (match?.[1]) {
    return match[1].trim().replace(/^"|"$/g, '')
  }

  return from
}
</script>

<template>
  <section class="view-panel mail-detail-view">
    <div class="docs-header mail-detail-header">
      <div class="mail-detail-heading">
        <span class="eyebrow">Mail Detail</span>
        <h1 class="mail-detail-title">{{ detail?.subject || '메일 상세' }}</h1>
        <p v-if="detail" class="mail-subtitle">
          {{ formatSender(detail.from) }}
          <span v-if="detail.date"> · {{ detail.date }}</span>
        </p>
      </div>
    </div>

    <p v-if="isLoading" class="notice inline">메일 내용을 불러오는 중입니다.</p>
    <p v-if="errorMessage" class="error inline">{{ errorMessage }}</p>
    <p v-if="saveMessage" class="success inline">{{ saveMessage }}</p>

    <div class="mail-detail-toolbar">
      <button
        class="secondary-button mail-page-button"
        type="button"
        :disabled="isBusy || !hasPrev"
        @click="$emit('prev')"
      >
        이전 (⌥←)
      </button>
      <span v-if="positionLabel" class="mail-page-label">{{ positionLabel }}</span>
      <button
        class="secondary-button mail-page-button"
        type="button"
        :disabled="isBusy || !hasNext"
        @click="$emit('next')"
      >
        다음 (⌥→)
      </button>
      <div class="mail-detail-toolbar-actions">
        <button class="secondary-button mail-toolbar-button" type="button" @click="$emit('back')">
          목록
        </button>
        <button
          class="secondary-button mail-toolbar-button mail-archive-button"
          type="button"
          :disabled="isBusy || !detail"
          @click="$emit('archiveMail')"
        >
          {{ isArchiving ? '보관 중' : '보관' }}
        </button>
        <button
          class="board-submit-button mail-toolbar-button mail-delete-button"
          type="button"
          :disabled="isBusy || !detail"
          @click="$emit('deleteMail')"
        >
          {{ isDeleting ? '삭제 중' : '삭제 (⌥D)' }}
        </button>
      </div>
    </div>

    <div v-if="detail" class="mail-detail-panel" :class="{ 'is-loading': isLoading }">
      <div v-if="isLoading" class="mail-loading-overlay" aria-live="polite">
        <p>메일을 불러오는 중입니다...</p>
      </div>

      <p v-if="detail.unread" class="mail-detail-unread">읽지 않은 메일</p>

      <div
        v-if="detail.bodyHtml"
        class="mail-detail-body mail-detail-body-html"
        v-html="detail.bodyHtml"
      />
      <pre v-else-if="detail.bodyText" class="mail-detail-body mail-detail-body-text">{{ detail.bodyText }}</pre>
      <p v-else-if="detail.snippet" class="mail-detail-body mail-detail-body-text">{{ detail.snippet }}</p>
      <p v-else class="empty inline">표시할 본문이 없습니다.</p>
    </div>
  </section>
</template>
