<script lang="ts" setup>
import Main from './pages/Main/index.vue'
</script>

<template>
  <Main/>
</template>

<style lang="scss">
button.sporty {
  border: 3px solid #dadada;
  background: white;
  padding: 20px 50px;
  font-size: 32px;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color .03s ease-in-out;

  &:hover {
    background-color: #f1f1f1;
  }

  &:active {
    background-color: #e5e5e5;
  }
}
</style>
