import { AudioManagerPlugin } from '../../libs/audio-manager/AudioManager'
import { computed, reactive, ref } from 'vue'
import { durationSecondToText } from '../../utils/duration'
import { mainPageStates } from './main-page-states'

export const enum UnderstandMark {
  NOT_MARKED = 'NOT_MARKED',
  UNDERSTOOD = 'UNDERSTOOD',
  NOT_UNDERSTOOD = 'NOT_UNDERSTOOD',
}

export interface Note {
  fileName: string
  start: `${string}:${string}`
  end: `${string}:${string}`
}

const GO_BACK_INTERVAL_SECOND = 10

interface NoteStorageFormat {
  fileNames: string[]
  notes: [number, `${string}:${string}`, `${string}:${string}`][]
}

const NOTE_STORAGE_KEY = 'ipid__sport-player__note'

function readNoteListFromStorage(): Note[] {
  const rawNoteString = localStorage.getItem(NOTE_STORAGE_KEY)
  if (rawNoteString == null) {
    return []
  }

  let rawNote: NoteStorageFormat
  try {
    rawNote = JSON.parse(rawNoteString)
  } catch {
    return []
  }

  const noteList: Note[] = [], fileNames = rawNote.fileNames

  for (const item of rawNote.notes) {
    noteList.push({
      fileName: fileNames[item[0]],
      start: item[1],
      end: item[2],
    })
  }

  return noteList
}

function saveNoteListIntoStorage(noteList: Note[]): void {
  const storage: NoteStorageFormat = {
    fileNames: [],
    notes: [],
  }
  const mapFileNameToNumber = new Map<string, number>()
  let counter = 0

  for (const note of noteList) {
    if (!mapFileNameToNumber.has(note.fileName)) {
      mapFileNameToNumber.set(note.fileName, counter)
      storage.fileNames.push(note.fileName)
      counter++
    }
  }

  for (const note of noteList) {
    storage.notes.push([mapFileNameToNumber.get(note.fileName)!, note.start, note.end])
  }

  localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(storage))
}

export function setupGoBackPlugin() {
  let checkPoint = 0
  const mark = ref(UnderstandMark.NOT_MARKED)
  const notUnderstandNoteList = reactive<Note[]>(readNoteListFromStorage())

  const goBackPlugin: AudioManagerPlugin = {
    onTick(state, audioMan) {
      if (audioMan.currentTime >= checkPoint + GO_BACK_INTERVAL_SECOND) {
        // 如果当前已经过了上一个检查点后若干秒

        if (mark.value === UnderstandMark.NOT_MARKED) {
          // 但是没按「听懂」或者「未听懂」，就直接回退到检查点
          audioMan.currentTime = checkPoint
        } else {
          if (mark.value === UnderstandMark.NOT_UNDERSTOOD) {
            notUnderstandNoteList.push({
              fileName: mainPageStates.fileName,
              start: durationSecondToText(checkPoint),
              end: durationSecondToText(checkPoint + GO_BACK_INTERVAL_SECOND),
            })
            saveNoteListIntoStorage(notUnderstandNoteList)
          }

          // 如果按了，就将检查点前进若干秒
          mark.value = UnderstandMark.NOT_MARKED
          checkPoint += GO_BACK_INTERVAL_SECOND
        }
      }
    },
  }

  function handleClickUnderstand(): void {
    if (mark.value === UnderstandMark.UNDERSTOOD) {
      mark.value = UnderstandMark.NOT_MARKED
    } else {
      mark.value = UnderstandMark.UNDERSTOOD
    }
  }

  function handleClickNotUnderstand(): void {
    if (mark.value === UnderstandMark.NOT_UNDERSTOOD) {
      mark.value = UnderstandMark.NOT_MARKED
    } else {
      mark.value = UnderstandMark.NOT_UNDERSTOOD
    }
  }

  const understandButtonStyle = computed(() => {
    if (mark.value === UnderstandMark.UNDERSTOOD) {
      return {'border-color': '#94ddde'}
    }
    return {}
  })

  const notUnderstandButtonStyle = computed(() => {
    if (mark.value === UnderstandMark.NOT_UNDERSTOOD) {
      return {'border-color': '#94ddde'}
    }
    return {}
  })

  return {
    notUnderstandNoteList,
    goBackPlugin,
    handleClickUnderstand,
    handleClickNotUnderstand,
    understandButtonStyle,
    notUnderstandButtonStyle,
  }
}
