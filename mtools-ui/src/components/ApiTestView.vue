<script setup lang="ts">
defineProps<{
  endpoint: string
  input: string
  result: string
  errorMessage: string
}>()

defineEmits<{
  updateEndpoint: [value: string]
  updateInput: [value: string]
  callApi: []
}>()
</script>

<template>
  <section class="view-panel">
    <article class="card api-card">
      <div class="card-header">
        <div>
          <span class="eyebrow">API</span>
          <h1>API 호출 테스트</h1>
        </div>
      </div>

      <p class="description">
        End point와 입력값을 지정해서 Spring Boot API를 호출하고 응답 결과를 확인합니다.
      </p>

      <div class="api-form">
        <label for="api-endpoint">End point</label>
        <input
          id="api-endpoint"
          :value="endpoint"
          type="text"
          placeholder="/api/echo"
          @input="$emit('updateEndpoint', ($event.target as HTMLInputElement).value)"
        />

        <label for="api-input">입력값(JSON)</label>
        <textarea
          id="api-input"
          :value="input"
          class="api-input"
          spellcheck="false"
          placeholder='{"id":"a"}'
          @input="$emit('updateInput', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>

        <button type="button" @click="$emit('callApi')">실행</button>
      </div>

      <div v-if="result || errorMessage" class="response-box" :class="{ error: errorMessage }">
        <span>{{ errorMessage ? '오류' : '결과' }}</span>
        <pre>{{ errorMessage || result }}</pre>
      </div>
    </article>
  </section>
</template>
