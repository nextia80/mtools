<script setup lang="ts">
import type { ActiveView, MdFile, MdFileGroup } from '../types'

defineProps<{
  activeView: ActiveView
  collapsed: boolean
  canAccessMenus: boolean
  mdFiles: MdFile[]
  mdFilesByDate: MdFileGroup[]
  openMdDate: string
  selectedMdPath: string
  isMdLoading: boolean
  mdErrorMessage: string
}>()

defineEmits<{
  setActiveView: [view: ActiveView]
  toggleCollapsed: []
  refreshMdFiles: []
  openDateGroup: [date: string]
  selectMdFile: [path: string]
}>()

const formatDateLabel = (date: string) => date.replace(/-/g, '')

const formatMdMenuFileName = (name: string) =>
  name.replace(/^\d{4}-\d{2}-\d{2}[_-]/, '').replace(/^(\d{2})-(\d{2})_/, '($1:$2) ')
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="brand">
      <span class="brand-mark">M</span>
      <div class="brand-text">
        <strong>mtools</strong>
        <span>workspace</span>
      </div>
    </div>

    <nav class="primary-menu" aria-label="주요 메뉴">
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'home' }"
        type="button"
        title="터미널"
        @click="$emit('setActiveView', 'home')"
      >
        <span class="menu-icon">1</span>
        <strong>터미널</strong>
      </button>
      <template v-if="canAccessMenus">
      <div class="docs-menu-row">
        <button
          class="primary-menu-item docs-menu-button"
          :class="{ active: activeView === 'docs' }"
          type="button"
          title="일자별LOG"
          @click="$emit('setActiveView', 'docs')"
        >
          <span class="menu-icon">2</span>
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
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'schedule' }"
        type="button"
        title="일정관리"
        @click="$emit('setActiveView', 'schedule')"
      >
        <span class="menu-icon">3</span>
        <strong>일정관리</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'mail' }"
        type="button"
        title="메일관리"
        @click="$emit('setActiveView', 'mail')"
      >
        <span class="menu-icon">4</span>
        <strong>메일관리</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'board' }"
        type="button"
        title="게시판"
        @click="$emit('setActiveView', 'board')"
      >
        <span class="menu-icon">5</span>
        <strong>게시판</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'member' }"
        type="button"
        title="회원관리"
        @click="$emit('setActiveView', 'member')"
      >
        <span class="menu-icon">6</span>
        <strong>회원관리</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'swagger' }"
        type="button"
        title="API 스웨거"
        @click="$emit('setActiveView', 'swagger')"
      >
        <span class="menu-icon">7</span>
        <strong>API 스웨거</strong>
      </button>
      <button
        class="primary-menu-item"
        :class="{ active: activeView === 'api' }"
        type="button"
        title="API 테스트"
        @click="$emit('setActiveView', 'api')"
      >
        <span class="menu-icon">8</span>
        <strong>API 테스트</strong>
      </button>
      </template>
    </nav>

    <div class="sidebar-footer">
      <span class="status-dot">localhost:8080</span>
      <p>MD 목록은 1분마다 자동 갱신됩니다.</p>
      <button
        class="sidebar-toggle-button"
        type="button"
        :title="collapsed ? '메뉴 펼치기' : '메뉴 접기'"
        :aria-label="collapsed ? '메뉴 펼치기' : '메뉴 접기'"
        @click="$emit('toggleCollapsed')"
      >
        {{ collapsed ? '>>' : '<<' }}
      </button>
    </div>
  </aside>
</template>
