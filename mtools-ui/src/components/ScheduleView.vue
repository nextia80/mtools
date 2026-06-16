<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '../types'

const props = defineProps<{
  connected: boolean
  email: string | null
  events: CalendarEvent[]
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
}>()

const getEventDateKey = (event: CalendarEvent) => event.start.slice(0, 10)

const eventsByDate = computed(() => {
  const groups = new Map<string, CalendarEvent[]>()

  props.events.forEach((event) => {
    const date = getEventDateKey(event)
    const list = groups.get(date) ?? []

    list.push(event)
    groups.set(date, list)
  })

  return Array.from(groups.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, events]) => ({
      date,
      label: formatDateGroupLabel(date),
      events: [...events].sort((eventA, eventB) => eventA.start.localeCompare(eventB.start)),
    }))
})

const formatDateGroupLabel = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`)

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

const formatKoreanTimeCompact = (value: string) =>
  new Date(value)
    .toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\s*([오전오후])\s*/g, '$1')
    .replace(/\s/g, '')

const formatMonthDay = (dateKey: string, compact = false) => {
  const date = new Date(`${dateKey}T00:00:00`)
  const month = date.getMonth() + 1
  const day = date.getDate()

  return compact ? `${month}월${day}일` : `${month}월 ${day}일`
}

const formatAllDayRange = (event: CalendarEvent) => {
  const startDate = event.start.slice(0, 10)
  const endDate = new Date(`${event.end.slice(0, 10)}T00:00:00`)
  endDate.setDate(endDate.getDate() - 1)
  const endYear = endDate.getFullYear()
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
  const endDay = String(endDate.getDate()).padStart(2, '0')
  const endDateKey = `${endYear}-${endMonth}-${endDay}`

  if (startDate === endDateKey) {
    return ''
  }

  return `${formatMonthDay(startDate)}~${formatMonthDay(endDateKey, true)}`
}

const formatTimedRange = (event: CalendarEvent) =>
  `${formatKoreanTimeCompact(event.start)}~${formatKoreanTimeCompact(event.end)}`

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '')

  if (normalized.length !== 6) {
    return `rgba(66, 184, 131, ${alpha})`
  }

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const getCalendarBadgeStyle = (event: CalendarEvent) => {
  if (!event.calendarBackgroundColor) {
    return undefined
  }

  const backgroundColor = event.calendarBackgroundColor

  return {
    backgroundColor: hexToRgba(backgroundColor, 0.16),
    color: '#0f172a',
    boxShadow: `inset 0 0 0 1px ${hexToRgba(backgroundColor, 0.45)}`,
  }
}
</script>

<template>
  <section class="view-panel schedule-view">
    <div class="docs-header">
      <div>
        <span class="eyebrow">Schedule</span>
        <h1>일정관리</h1>
        <p v-if="connected && email" class="schedule-subtitle">연결 계정: {{ email }}</p>
      </div>
      <div class="schedule-header-actions">
        <button
          v-if="connected"
          class="refresh-button schedule-refresh"
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
          {{ isConnecting ? '연결 중' : 'Google Calendar 연결' }}
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

    <p v-if="isLoading" class="notice inline">일정을 불러오는 중입니다.</p>
    <p v-if="errorMessage" class="error inline">{{ errorMessage }}</p>
    <p v-if="saveMessage" class="success inline">{{ saveMessage }}</p>

    <div v-if="!connected" class="schedule-connect-panel">
      <h2>Google Calendar 연동</h2>
      <p>Google 계정으로 로그인하면 앞으로 1주일간의 일정을 불러올 수 있습니다.</p>
      <ul>
        <li>Google Cloud Console에서 OAuth 클라이언트 ID를 발급받아야 합니다.</li>
        <li>백엔드에 <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> 환경 변수를 설정하세요.</li>
        <li>승인된 리디렉션 URI: <code>http://localhost:8080/api/calendar/oauth/callback</code></li>
      </ul>
    </div>

    <div v-else class="schedule-event-list">
      <section v-for="group in eventsByDate" :key="group.date" class="schedule-date-group">
        <h2 class="schedule-date-heading">{{ group.label }}</h2>

        <div class="schedule-date-events">
          <article
            v-for="event in group.events"
            :key="`${event.calendarId}-${event.id}`"
            class="schedule-event"
          >
            <p class="schedule-event-line">
              <template v-if="event.allDay">
                <span v-if="formatAllDayRange(event)" class="schedule-event-datetime">
                  {{ formatAllDayRange(event) }}
                </span>
              </template>
              <template v-else>
                <span class="schedule-event-datetime">{{ formatTimedRange(event) }}</span>
              </template>
              <span class="schedule-calendar-name" :style="getCalendarBadgeStyle(event)">
                {{ event.calendarName }}
              </span>
              <span class="schedule-event-summary">{{ event.summary }}</span>
            </p>
            <p v-if="event.description" class="schedule-event-memo">{{ event.description }}</p>
          </article>
        </div>
      </section>

      <p v-if="!isLoading && events.length === 0" class="empty inline">
        표시할 일정이 없습니다.
      </p>
    </div>
  </section>
</template>
