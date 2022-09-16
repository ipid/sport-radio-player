import { getFileFromInputElement } from '../../utils/input-element'
import { AudioManager, AudioPlayingState, AudioState } from '../../libs/audio-manager/AudioManager'
import { onBeforeUnmount, ref, watch } from 'vue'
import { mainPageStates } from './main-page-states'

export const enum PlayState {
  NO_FILE,
  PLAYING,
  PAUSING,
  DISABLE_OPERATION,
}

const inputElem = getInputElem()

function getInputElem() {
  const inputElem = document.createElement('input')
  inputElem.setAttribute('type', 'file')
  inputElem.setAttribute(
    'accept',
    'opus/flac/webm/weba/wav/ogg/m4a/mp3/wma/aac/wmv/mpg/webm/mov/mpeg/mp4/m4v/avi/3gp'.split('/').map(x => '.' + x).join(','),
  )
  return inputElem
}

export function setupCoreLogic() {
  const playState = ref<PlayState>(PlayState.NO_FILE),
    audioMan = ref<AudioManager>(null!),
    displayPlayState = ref('打开文件')

  onBeforeUnmount(() => {
    audioMan.value.dispose()
  })

  watch(audioMan, (value) => {
    value.registerPlugin({
      onTick(state: AudioState) {
        if (state.playing === AudioPlayingState.PLAYING) {
          playState.value = PlayState.PLAYING
          displayPlayState.value = `${state.position} / ${state.duration}`
        } else {
          playState.value = PlayState.PAUSING
          displayPlayState.value = '播放'
        }
      },
    })
  })

  function startPlayingAudio(url?: string): void {
    displayPlayState.value = '加载中…'
    playState.value = PlayState.DISABLE_OPERATION

    audioMan.value.play(url).catch(err => {
      console.error(err)
    })
  }

  function handleClickPlay() {
    if (audioMan.value == null) {
      return
    }

    switch (playState.value) {
      case PlayState.NO_FILE:
        inputElem.oninput = () => {
          const file = getFileFromInputElement(inputElem)
          if (file == null) {
            return
          }

          mainPageStates.fileName = file.name
          startPlayingAudio(URL.createObjectURL(file))
        }
        inputElem.click()

        break

      case PlayState.PLAYING:
        audioMan.value.pause()
        break

      case PlayState.PAUSING:
        startPlayingAudio()
        break

      case PlayState.DISABLE_OPERATION:
        // 此状态下禁止操作
        break

      default:
        throw new Error(`当前 playState 非法：${playState}`)
    }
  }

  return {
    playState,
    displayPlayState,
    audioMan,
    handleClickPlay,
  }
}
