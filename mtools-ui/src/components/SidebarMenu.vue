<script setup lang="ts">
import type { ActiveView, MdFile, MdFileGroup } from '../types'

defineProps<{
  activeView: ActiveView
  mdFiles: MdFile[]
  mdFilesByDate: MdFileGroup[]
  openMdDate: string
  selectedMdPath: string
  isMdLoading: boolean
  mdErrorMessage: string
}>()

defineEmits<{
  setActiveView: [view: ActiveView]
  refreshMdFiles: []
  openDateGroup: [date: string]
  selectMdFile: [path: string]
}>()

const formatDateLabel = (date: string) => date.replace(/-/g, '')

const formatMdMenuFileName = (name: string) =>
  name.replace(/^\d{4}-\d{2}-\d{2}[_-]/, '').replace(/^(\d{2})-(\d{2})_/, '($1:$2) ')
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">M</span>
      <div>
        <strong>mtools</strong>
        <span>workspace</span>
      </div>
    </div>

    <nav class="primary-menu" aria-label="주요 메뉴">
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'home' }"
        type="button"
        @click="$emit('setActiveView', 'home')"
      >
        <span class="menu-icon">H</span>
        <strong>홈</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'board' }"
        type="button"
        @click="$emit('setActiveView', 'board')"
      >
        <span class="menu-icon">B</span>
        <strong>게시판</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'member' }"
        type="button"
        @click="$emit('setActiveView', 'member')"
      >
        <span class="menu-icon">M</span>
        <strong>회원관리</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'schedule' }"
        type="button"
        @click="$emit('setActiveView', 'schedule')"
      >
        <span class="menu-icon">S</span>
        <strong>일정관리</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'swagger' }"
        type="button"
        @click="$emit('setActiveView', 'swagger')"
      >
        <span class="menu-icon">SW</span>
        <strong>API 스웨거</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'api' }"
        type="button"
        @click="$emit('setActiveView', 'api')"
      >
        <span class="menu-icon">API</span>
        <strong>API 테스트</strong>
      </button>
      <div class="docs-menu-row">
        <button
          class="primary-menu-item docs-menu-button"
          :class="{ active: activeView === 'docs' }"
          type="button"
          @click="$emit('setActiveView', 'docs')"
        >
          <span class="menu-icon">MD</span>
          <strong>일자별LOG <span class="menu-count">({{ mdFiles.length }})</span></strong>
        </button>
        <button class="refresh-button compact docs-inline-refresh" type="button" @click="$emit('refreshMdFiles')">
          새로고침
        </button>
      </div>

      <div class="nested-md-menu" :class="{ open: activeView === 'docs' }">
        <p v-if="isMdLoading" class="sidebar-message">MD 목록을 확인하는 중입니다.</p>
        <p v-if="mdErrorMessage" class="sidebar-message error">{{ mdErrorMessage }}</p>

        <details
          v-for="group in mdFilesByDate"
          :key="group.date"
          class="date-menu-group"
          :open="openMdDate === group.date"
        >
          <summary @click.prevent="$emit('openDateGroup', group.date)">
            <span>{{ formatDateLabel(group.date) }}</span>
            <strong>{{ group.files.length }}</strong>
          </summary>

          <button
            v-for="file in group.files"
            :key="file.path"
            class="date-file-item"
            :class="{ active: file.path === selectedMdPath }"
            type="button"
            @click="$emit('selectMdFile', file.path)"
          >
            {{ formatMdMenuFileName(file.name) }}
          </button>
        </details>

        <p v-if="!isMdLoading && mdFiles.length === 0" class="sidebar-message">
          MD 파일이 없습니다.
        </p>
      </div>
    </nav>

    <div class="sidebar-footer">
      <span class="status-dot">localhost:8080</span>
      <p>MD 목록은 1분마다 자동 갱신됩니다.</p>
    </div>
  </aside>
</template>
