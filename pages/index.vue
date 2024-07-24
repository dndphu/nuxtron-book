<template>
  <div>
    <DpButton @click="onClick">+</DpButton>
  </div>
</template>

<script lang="ts" setup>
const onClick = async () => {
  try {
    const filePath = await window.ipcRenderer.invoke("open-file-dialog");

    console.log("filePath :>> ", filePath);
  } catch (error) {
    console.log("error :>> ", error);
  }
};
</script>

<style></style>
