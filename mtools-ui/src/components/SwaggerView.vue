<script setup lang="ts">
defineProps<{
  swaggerUrl: string
}>()
</script>

<template>
  <section class="view-panel swagger-view">
    <div class="docs-header">
      <div>
        <span class="eyebrow">Swagger</span>
        <h1>API 스웨거</h1>
      </div>
      <a class="swagger-open-link" :href="swaggerUrl" target="_blank" rel="noreferrer">
        새 창으로 열기
      </a>
    </div>

    <iframe class="swagger-frame" :src="swaggerUrl" title="API Swagger UI"></iframe>
  </section>
</template>
