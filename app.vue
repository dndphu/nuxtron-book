<template>
  <div>
    <NuxtWelcome />
  </div>
</template>

<script lang="ts" setup>
onMounted(async () => {
  const time = await window.ipcRenderer.invoke("app-start-time");
  console.log("App start time:", time);
});
</script>
