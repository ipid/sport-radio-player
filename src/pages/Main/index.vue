<template>
  <button class="sporty" @click="handleClickPlay">{{ displayPlayState }}</button>
  <button :style="understandButtonStyle" class="sporty" @click="handleClickUnderstand">听懂了</button>
  <button :style="notUnderstandButtonStyle" class="sporty" @click="handleClickNotUnderstand">没听懂</button>

  <div>
    <template v-for="(elem, i) in notUnderstandNoteList">
      <p>#{{ i + 1 }}</p>
      <ul>
        <li>文件名：{{ elem.fileName }}</li>
        <li>范围：{{ elem.start }} - {{ elem.end }}</li>
      </ul>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { setupCoreLogic } from './setupCoreLogic'
import { AudioManager } from '../../libs/audio-manager/AudioManager'
import { setupGoBackPlugin } from './pluginAutoGoBack'

const {
  playState,
  displayPlayState,
  audioMan,
  handleClickPlay,
} = setupCoreLogic()

const {
  notUnderstandNoteList,
  goBackPlugin,
  handleClickUnderstand,
  handleClickNotUnderstand,
  understandButtonStyle,
  notUnderstandButtonStyle,
} = setupGoBackPlugin()

function createAudioManager() {
  if (audioMan.value != null) {
    return
  }

  audioMan.value = new AudioManager()
  audioMan.value.registerPlugin(goBackPlugin)
}

document.addEventListener('pointerdown', createAudioManager, {
  capture: true,
  once: true,
  passive: true,
})
document.addEventListener('keydown', createAudioManager, {
  capture: true,
  once: true,
  passive: true,
})
</script>

<style lang="scss" scoped>
// TODO
</style>
