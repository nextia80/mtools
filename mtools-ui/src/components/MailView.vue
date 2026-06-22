<script setup lang="ts">
import { computed } from 'vue'
import type { MailMessage } from '../types'

const props = defineProps<{
  connected: boolean
  email: string | null
  messages: MailMessage[]
  unreadOnly: boolean
  pageIndex: number
  pageSize: number
  totalCount: number
  unreadCount: number
  inboxTotalCount: number
  hasNext: boolean
  errorMessage: string
  saveMessage: string
  isLoading: boolean
  isConnecting: boolean
  isDisconnecting: boolean
}>()

defineEmits<{
  refresh: []
  connect: []
  disconnect: []
  setUnreadOnly: [unreadOnly: boolean]
  prevPage: []
  nextPage: []
  selectMessage: [message: MailMessage, index: number]
}>()

const rangeStart = computed(() => {
  if (props.messages.length === 0) {
    return 0
  }

  return (props.pageIndex - 1) * props.pageSize + 1
})

const rangeEnd = computed(() => {
  if (props.messages.length === 0) {
    return 0
  }

  return rangeStart.value + props.messages.length - 1
})

const totalPages = computed(() =>
  props.totalCount === 0 ? 0 : Math.ceil(props.totalCount / props.pageSize),
)

const pageSummary = computed(() => {
  if (props.totalCount === 0) {
    return ''
  }

  const rangeLabel =
    rangeStart.value === 0 ? '0건' : `${rangeStart.value}-${rangeEnd.value}건`

  return `${rangeLabel} · ${props.pageIndex} / ${totalPages.value} 페이지`
})

const inboxSummary = computed(() => {
  const base = `받은편지함 전체 ${props.inboxTotalCount.toLocaleString()}건`

  if (!pageSummary.value) {
    return base
  }

  return `${base} · ${pageSummary.value}`
})

const listSummary = computed(() => {
  const openHint = '⌥Enter 첫 메일 열기'

  if (props.unreadOnly) {
    return `현재 필터: 읽지 않음 ${props.totalCount.toLocaleString()}건 · ${openHint}`
  }

  return `현재 필터: 받은편지함 ${props.totalCount.toLocaleString()}건 · ${openHint}`
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
  <section class="view-panel mail-view">
    <div class="docs-header">
      <div>
        <span class="eyebrow">Mail</span>
        <h1>메일관리</h1>
        <p v-if="connected && email" class="mail-subtitle">연결 계정: {{ email }}</p>
        <p v-if="connected" class="mail-subtitle">
          {{ inboxSummary }}
          <span v-if="isLoading" class="mail-loading-label">불러오는 중...</span>
        </p>
      </div>
      <div class="mail-header-actions">
        <button
          v-if="connected"
          class="refresh-button mail-refresh"
          type="button"
          :disabled="isLoading"
          @click="$emit('refresh')"
        >
          새로고침
        </button>
        <button
          v-if="!connected"
          class="board-submit-button"
          type="button"
          :disabled="isConnecting"
          @click="$emit('connect')"
        >
          {{ isConnecting ? '연결 중' : 'Gmail 연결' }}
        </button>
        <button
          v-else
          class="secondary-button"
          type="button"
          :disabled="isDisconnecting"
          @click="$emit('disconnect')"
        >
          {{ isDisconnecting ? '해제 중' : '연결 해제' }}
        </button>
      </div>
    </div>

    <p v-if="!connected && isLoading" class="notice inline">메일을 불러오는 중입니다.</p>
    <p v-if="errorMessage" class="error inline">{{ errorMessage }}</p>
    <p v-if="saveMessage" class="success inline">{{ saveMessage }}</p>

    <div v-if="!connected" class="mail-connect-panel">
      <h2>Gmail 연동</h2>
      <p>Google 계정으로 로그인하면 받은편지함 메일을 불러올 수 있습니다.</p>
      <ul>
        <li>Google Cloud Console에서 Gmail API를 활성화해야 합니다.</li>
        <li>백엔드에 <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> 환경 변수를 설정하세요.</li>
        <li>승인된 리디렉션 URI: <code>http://localhost:8080/api/mail/oauth/callback</code></li>
      </ul>
    </div>

    <div v-else class="mail-message-list" :class="{ 'is-loading': isLoading }">
      <div v-if="isLoading" class="mail-loading-overlay" aria-live="polite">
        <p>메일을 불러오는 중입니다...</p>
      </div>

      <div class="mail-filter-row">
        <div class="mail-filter-group">
          <button
            class="mail-filter-button"
            :class="{ active: unreadOnly }"
            type="button"
            :disabled="isLoading"
            @click="$emit('setUnreadOnly', true)"
          >
            읽지 않음 ({{ unreadCount.toLocaleString() }})
          </button>
          <button
            class="mail-filter-button"
            :class="{ active: !unreadOnly }"
            type="button"
            :disabled="isLoading"
            @click="$emit('setUnreadOnly', false)"
          >
            받은편지함 전체 ({{ inboxTotalCount.toLocaleString() }})
          </button>
        </div>

        <div v-if="totalCount > 0" class="mail-pagination mail-pagination-inline">
          <button
            class="secondary-button mail-page-button"
            type="button"
            :disabled="isLoading || pageIndex <= 1"
            @click="$emit('prevPage')"
          >
            {{ isLoading ? '불러오는 중' : '이전' }}
          </button>
          <span class="mail-page-label">
            {{ pageIndex }} / {{ totalPages }}
            <span v-if="isLoading" class="mail-loading-label">· 불러오는 중...</span>
          </span>
          <button
            class="secondary-button mail-page-button"
            type="button"
            :disabled="isLoading || !hasNext"
            @click="$emit('nextPage')"
          >
            {{ isLoading ? '불러오는 중' : '다음' }}
          </button>
        </div>

        <span class="mail-list-summary">{{ listSummary }}</span>
      </div>

      <article
        v-for="(message, index) in messages"
        :key="message.id"
        class="mail-message"
        :class="{ unread: message.unread }"
      >
        <p class="mail-message-line">
          <span v-if="message.unread" class="mail-unread-badge">읽지 않음</span>
          <span class="mail-message-from">{{ formatSender(message.from) }}</span>
          <button
            class="mail-message-subject"
            type="button"
            @click="$emit('selectMessage', message, index)"
          >
            {{ message.subject }}
          </button>
        </p>
        <p v-if="message.date" class="mail-message-date">{{ message.date }}</p>
        <p v-if="message.snippet" class="mail-message-snippet">{{ message.snippet }}</p>
      </article>

      <p v-if="!isLoading && messages.length === 0" class="empty inline">
        {{ unreadOnly ? '읽지 않은 메일이 없습니다.' : '받은편지함에 표시할 메일이 없습니다.' }}
      </p>

      <div v-if="totalCount > 0" class="mail-pagination">
        <button
          class="secondary-button mail-page-button"
          type="button"
          :disabled="isLoading || pageIndex <= 1"
          @click="$emit('prevPage')"
        >
          {{ isLoading ? '불러오는 중' : '이전' }}
        </button>
        <span class="mail-page-label">
          {{ pageIndex }} / {{ totalPages }} 페이지
          <span v-if="isLoading" class="mail-loading-label">· 불러오는 중...</span>
        </span>
        <button
          class="secondary-button mail-page-button"
          type="button"
          :disabled="isLoading || !hasNext"
          @click="$emit('nextPage')"
        >
          {{ isLoading ? '불러오는 중' : '다음' }}
        </button>
      </div>
    </div>
  </section>
</template>
