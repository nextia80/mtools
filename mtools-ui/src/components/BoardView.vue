<script setup lang="ts">
import { computed } from 'vue'
import { getBoardDepth, isBoardRoot } from '../boardUtils'
import type { BoardPost } from '../types'

const props = defineProps<{
  posts: BoardPost[]
  title: string
  text: string
  editingBoardId: string | null
  replyParentId: string | null
  errorMessage: string
  saveMessage: string
  isLoading: boolean
  isSaving: boolean
}>()

defineEmits<{
  refresh: []
  save: []
  reset: []
  startReply: [post: BoardPost]
  cancelReply: []
  edit: [post: BoardPost]
  delete: [post: BoardPost]
  updateTitle: [value: string]
  updateText: [value: string]
}>()

const replyParentPost = computed(() =>
  props.posts.find((post) => post.idBoard === props.replyParentId) ?? null,
)

const formatOptionalDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-'

const getBoardDisplayDate = (post: BoardPost) => post.updatedAt || post.insertedAt

const getBoardIndentStyle = (post: BoardPost) => ({
  marginLeft: `${getBoardDepth(post) * 1.75}rem`,
})
</script>

<template>
  <section class="view-panel board-view">
    <div class="docs-header">
      <div>
        <span class="eyebrow">Board</span>
        <h1>게시판</h1>
      </div>
      <button class="refresh-button board-refresh" type="button" @click="$emit('refresh')">
        새로고침
      </button>
    </div>

    <p v-if="isLoading" class="notice inline">게시글을 불러오는 중입니다.</p>
    <p v-if="errorMessage" class="error inline">{{ errorMessage }}</p>
    <p v-if="saveMessage" class="success inline">{{ saveMessage }}</p>

    <form
      v-if="editingBoardId === null && replyParentId === null"
      class="board-form"
      @submit.prevent="$emit('save')"
    >
      <div class="board-form-header">
        <h2>게시글 작성</h2>
      </div>

      <label for="board-title">제목</label>
      <input
        id="board-title"
        :value="title"
        type="text"
        placeholder="제목을 입력하세요"
        @input="$emit('updateTitle', ($event.target as HTMLInputElement).value)"
      />

      <label for="board-text">내용</label>
      <textarea
        id="board-text"
        :value="text"
        class="board-textarea"
        placeholder="내용을 입력하세요"
        @input="$emit('updateText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <button class="board-submit-button" type="submit" :disabled="isSaving">
        {{ isSaving ? '저장 중' : '등록' }}
      </button>
    </form>

    <form
      v-else-if="editingBoardId !== null"
      class="board-form board-form-edit"
      @submit.prevent="$emit('save')"
    >
      <div class="board-form-header">
        <h2>게시글 수정</h2>
        <button class="secondary-button" type="button" @click="$emit('reset')">취소</button>
      </div>

      <label for="board-edit-title">제목</label>
      <input
        id="board-edit-title"
        :value="title"
        type="text"
        placeholder="제목을 입력하세요"
        @input="$emit('updateTitle', ($event.target as HTMLInputElement).value)"
      />

      <label for="board-edit-text">내용</label>
      <textarea
        id="board-edit-text"
        :value="text"
        class="board-textarea"
        placeholder="내용을 입력하세요"
        @input="$emit('updateText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <button class="board-submit-button" type="submit" :disabled="isSaving">
        {{ isSaving ? '저장 중' : '수정 저장' }}
      </button>
    </form>

    <form
      v-else-if="replyParentId !== null"
      class="board-form board-form-reply"
      @submit.prevent="$emit('save')"
    >
      <div class="board-form-header">
        <h2>댓글 작성</h2>
        <button class="secondary-button" type="button" @click="$emit('cancelReply')">취소</button>
      </div>

      <label for="board-reply-parent">원글 ID</label>
      <input id="board-reply-parent" :value="replyParentId" type="text" readonly />

      <p v-if="replyParentPost" class="board-reply-target">
        대상: {{ replyParentPost.title || '제목 없음' }}
      </p>

      <label for="board-reply-title">제목</label>
      <input
        id="board-reply-title"
        :value="title"
        type="text"
        placeholder="제목을 입력하세요"
        @input="$emit('updateTitle', ($event.target as HTMLInputElement).value)"
      />

      <label for="board-reply-text">내용</label>
      <textarea
        id="board-reply-text"
        :value="text"
        class="board-textarea"
        placeholder="내용을 입력하세요"
        @input="$emit('updateText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>

      <button class="board-submit-button" type="submit" :disabled="isSaving">
        {{ isSaving ? '저장 중' : '등록' }}
      </button>
    </form>

    <div class="board-post-list">
      <article
        v-for="post in posts"
        :key="post.idBoard"
        class="board-post"
        :class="{ 'board-post-root': isBoardRoot(post), 'board-post-reply': !isBoardRoot(post) }"
        :style="getBoardIndentStyle(post)"
      >
        <div class="board-post-header">
          <h2>
            <span v-if="isBoardRoot(post)" class="board-post-number">{{ post.idBoard }}</span>
            {{ post.title || '제목 없음' }}
          </h2>
          <div class="board-post-actions">
            <button type="button" @click="$emit('startReply', post)">댓글추가</button>
            <button type="button" @click="$emit('edit', post)">수정</button>
            <button class="danger-button" type="button" @click="$emit('delete', post)">
              삭제
            </button>
          </div>
        </div>

        <p class="board-post-body">{{ post.text || '내용이 없습니다.' }}</p>

        <dl class="board-post-meta">
          <div>
            <dt>{{ post.updatedAt ? '수정' : '입력' }}</dt>
            <dd>{{ formatOptionalDateTime(getBoardDisplayDate(post)) }}</dd>
          </div>
        </dl>
      </article>

      <p v-if="!isLoading && posts.length === 0" class="empty inline">게시글이 없습니다.</p>
    </div>
  </section>
</template>
