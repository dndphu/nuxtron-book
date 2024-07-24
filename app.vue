<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator :height="2" />
      <nuxt-page />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>

onMounted(async () => {
  const time = await window.ipcRenderer.invoke("app-start-time");
  console.log("App start time:", time);
});

</script>
