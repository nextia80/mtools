<script setup lang="ts">
import { computed } from 'vue'
import type { Member } from '../types'

const props = defineProps<{
  members: Member[]
  memberId: string
  password: string
  name: string
  email: string
  level: string
  ynUse: string
  editingMemberId: string | null
  errorMessage: string
  saveMessage: string
  isLoading: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  refresh: []
  save: []
  reset: []
  edit: [member: Member]
  delete: [member: Member]
  updateMemberId: [value: string]
  updatePassword: [value: string]
  updateName: [value: string]
  updateEmail: [value: string]
  updateLevel: [value: string]
  updateYnUse: [value: string]
}>()

const readInputValue = (event: Event) => (event.target as HTMLInputElement).value
const readSelectValue = (event: Event) => (event.target as HTMLSelectElement).value

const isEditing = computed(() => props.editingMemberId !== null)

const formTitle = computed(() => (isEditing.value ? '회원 수정' : '회원 등록'))

const passwordPlaceholder = computed(() =>
  isEditing.value ? '변경 시에만 입력' : '비밀번호',
)

const submitLabel = computed(() => {
  if (props.isSaving) {
    return '저장 중'
  }

  return isEditing.value ? '수정 저장' : '등록'
})

const formatOptionalDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-'

const getMemberDisplayDate = (member: Member) => member.updatedAt || member.insertedAt

const levelLabel = (level: string) => {
  if (level === '0') {
    return '관리자 (0)'
  }

  if (level === '1') {
    return '일반 (1)'
  }

  return level
}
</script>

<template>
  <section class="view-panel member-view">
    <div class="docs-header">
      <div>
        <span class="eyebrow">Member</span>
        <h1>회원관리</h1>
      </div>
      <button class="refresh-button board-refresh" type="button" @click="$emit('refresh')">
        새로고침
      </button>
    </div>

    <p v-if="isLoading" class="notice inline">회원 목록을 불러오는 중입니다.</p>
    <p v-if="errorMessage" class="error inline">{{ errorMessage }}</p>
    <p v-if="saveMessage" class="success inline">{{ saveMessage }}</p>

    <form
      class="board-form member-form"
      :class="{ 'board-form-edit': isEditing }"
      @submit.prevent="$emit('save')"
    >
      <div class="board-form-header">
        <h2>{{ formTitle }}</h2>
        <button
          v-if="isEditing"
          class="secondary-button"
          type="button"
          @click="$emit('reset')"
        >
          취소
        </button>
      </div>

      <div class="member-form-grid">
        <div class="member-form-inline">
          <label for="member-id">아이디</label>
          <input
            id="member-id"
            :value="memberId"
            type="text"
            placeholder="로그인 아이디"
            autocomplete="off"
            @input="emit('updateMemberId', readInputValue($event))"
          />
        </div>

        <div class="member-form-inline">
          <label for="member-password">비밀번호</label>
          <input
            id="member-password"
            :value="password"
            type="password"
            :placeholder="passwordPlaceholder"
            autocomplete="new-password"
            @input="emit('updatePassword', readInputValue($event))"
          />
        </div>

        <div class="member-form-inline">
          <label for="member-name">이름</label>
          <input
            id="member-name"
            :value="name"
            type="text"
            placeholder="이름"
            @input="emit('updateName', readInputValue($event))"
          />
        </div>

        <div class="member-form-inline">
          <label for="member-email">이메일</label>
          <input
            id="member-email"
            :value="email"
            type="email"
            placeholder="email@example.com"
            @input="emit('updateEmail', readInputValue($event))"
          />
        </div>

        <div class="member-form-inline">
          <label for="member-level">레벨</label>
          <input
            id="member-level"
            :value="level"
            type="text"
            placeholder="0=관리자, 1=일반"
            @input="emit('updateLevel', readInputValue($event))"
          />
        </div>

        <div class="member-form-inline">
          <label for="member-yn-use">사용</label>
          <select
            id="member-yn-use"
            :value="ynUse"
            @change="emit('updateYnUse', readSelectValue($event))"
          >
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>

      <button class="board-submit-button" type="submit" :disabled="isSaving">
        {{ submitLabel }}
      </button>
    </form>

    <div class="board-post-list">
      <article v-for="member in members" :key="member.idMember" class="board-post board-post-root">
        <div class="board-post-header">
          <h2>
            <span class="board-post-number">{{ member.idMember }}</span>
            {{ member.memberId }}
            <span class="member-level-badge">{{ levelLabel(member.level) }}</span>
          </h2>
          <div class="board-post-actions">
            <button type="button" @click="$emit('edit', member)">수정</button>
            <button class="danger-button" type="button" @click="$emit('delete', member)">
              삭제
            </button>
          </div>
        </div>

        <dl class="member-info-list">
          <div>
            <dt>이름</dt>
            <dd>{{ member.name || '-' }}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{{ member.email || '-' }}</dd>
          </div>
          <div>
            <dt>사용</dt>
            <dd>{{ member.ynUse }}</dd>
          </div>
        </dl>

        <dl class="board-post-meta">
          <div>
            <dt>{{ member.updatedAt ? '수정' : '입력' }}</dt>
            <dd>{{ formatOptionalDateTime(getMemberDisplayDate(member)) }}</dd>
          </div>
        </dl>
      </article>

      <p v-if="!isLoading && members.length === 0" class="empty inline">등록된 회원이 없습니다.</p>
    </div>
  </section>
</template>
