import { durationSecondToText } from '../../utils/duration'

export const enum AudioPlayingState {
  // 音频播放中
  PLAYING = 'PLAYING',

  // 音频暂停
  PAUSED = 'PAUSED',

  // 音频尚未加载
  NOT_LOADED = 'NOT_LOADED'
}

export interface AudioState {
  // 音频到底是播放还是暂停，还是根本就没加载
  readonly playing: AudioPlayingState

  // 音频的时间长度，用形如 1:02:45 的字符串表示
  readonly duration: `${string}:${string}`

  // 音频的当前位置，用形如 1:02:45 的字符串表示
  readonly position: `${string}:${string}`
}

const DEFAULT_AUDIO_STATE = Object.freeze({
  playing: AudioPlayingState.NOT_LOADED,
  position: '--:--',
  duration: '--:--',
})

export interface AudioManagerPlugin {
  // 当音频被播放时，调用此回调
  readonly onPlay?: (state: AudioState, self: AudioManager) => void

  // 当音频被暂停时，调用此回调
  readonly onPause?: (state: AudioState, self: AudioManager) => void

  // 当音频正在播放时，每隔一段时间调用此回调，可以用于更新当前 UI 上显示的音频播放时间
  // 保证尽量每整秒调用一次（有轻微误差）
  readonly onTick?: (state: AudioState, self: AudioManager) => void

  // 当 AudioManager 被销毁时，调用此回调，插件可用于销毁自身
  readonly dispose?: (self: AudioManager) => void
}

export class AudioManager {
  private audio: HTMLAudioElement
  // #timer: ReturnType<typeof setTimeout> = null!
  private plugins: AudioManagerPlugin[] = []

  constructor() {
    // 这里如果 constructor 是在 click 的函数栈里调用的，那这个操作就能解锁
    this.audio = new Audio()

    // 从 Howler.js 里看来的，说这样就能解锁，我也不知道为啥
    this.audio.load()

    this.addAudioHandlers()
  }

  async play(src?: string): Promise<void> {
    if (src == null) {
      return this.audio.play()
    }

    return new Promise<void>(resolve => {
      const onCanPlayThrough = () => {
        this.audio.removeEventListener('canplaythrough', onCanPlayThrough)
        resolve()
      }

      this.audio.addEventListener('canplaythrough', onCanPlayThrough)
      this.audio.src = src
      this.audio.load()
    }).then(() => {
      return this.audio.play()
    })
  }

  get currentTime(): number {
    return this.audio.currentTime
  }

  set currentTime(value: number) {
    this.audio.currentTime = value
  }

  pause() {
    this.audio.pause()
  }

  registerPlugin(plugin: AudioManagerPlugin) {
    this.plugins.push(plugin)
  }

  unregisterPlugin(plugin: AudioManagerPlugin) {
    const index = this.plugins.indexOf(plugin)
    if (index >= 0) {
      this.plugins.splice(index, 1)
    }
  }

  dispose() {
    this.removeAudioHandlers()
    this.audio.pause()

    for (const plugin of this.plugins) {
      plugin.onPause?.(DEFAULT_AUDIO_STATE, this)
      plugin.onTick?.(DEFAULT_AUDIO_STATE, this)
      plugin.dispose?.(this)
    }

    // 参考：https://stackoverflow.com/questions/3258587/how-to-properly-unload-destroy-a-video-element
    this.audio.removeAttribute('src')
    this.audio.load()
    this.audio = null!
  }

  private addAudioHandlers() {
    this.audio.addEventListener('play', this.handlePlay.bind(this))
    this.audio.addEventListener('pause', this.handlePause.bind(this))
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this))
    this.audio.addEventListener('durationchange', this.handleDurationChange.bind(this))
  }

  private removeAudioHandlers() {
    this.audio.removeEventListener('play', this.handlePlay.bind(this))
    this.audio.removeEventListener('pause', this.handlePause.bind(this))
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate.bind(this))
    this.audio.removeEventListener('durationchange', this.handleDurationChange.bind(this))
  }

  calculateState(): AudioState {
    if (!Number.isFinite(this.audio.duration) || this.audio.duration <= 0) {
      return DEFAULT_AUDIO_STATE
    }

    return {
      playing: this.audio.paused ? AudioPlayingState.PAUSED : AudioPlayingState.PLAYING,
      position: durationSecondToText(this.audio.currentTime),
      duration: durationSecondToText(this.audio.duration),
    }
  }

  handlePause() {
    // clearTimeout(this.#timer)
    const state = this.calculateState()

    for (const plugin of this.plugins) {
      plugin.onPause?.(state, this)
    }

    this.tick(state)
  }

  handleTimeUpdate() {
    const state = this.calculateState()
    this.tick(state)
  }

  handleDurationChange() {
    const state = this.calculateState()
    this.tick(state)
  }

  handlePlay() {
    const state = this.calculateState()

    for (const plugin of this.plugins) {
      plugin.onPlay?.(state, this)
    }

    this.tick(state)
  }

  tick(state: AudioState) {
    for (const plugin of this.plugins) {
      plugin.onTick?.(state, this)
    }

    // if (!this.#audio.paused) {
    //   let nextSecond = Math.ceil(this.#audio.currentTime)
    //   if (nextSecond === this.#audio.currentTime) {
    //     nextSecond += 1
    //   }
    //
    //   const timeToSleep = Math.min(this.#audio.duration, nextSecond) - this.#audio.currentTime
    //
    //   // 剩余时间 >= 100ms
    //   if (timeToSleep >= 0.01) {
    //     console.log(`[AudioManager][#tick()] 当前播放时间：${this.#audio.currentTime.toFixed(3)}，目标时间：${nextSecond}，开启 ${timeToSleep.toFixed(3)}s 的定时器`)
    //
    //     clearTimeout(this.#timer)
    //     this.#timer = setTimeout(() => {
    //       this.#tick(this.#calculateState(), true, timeToSleep)
    //     }, timeToSleep * 1000)
    //   }
    // }
  }
}
