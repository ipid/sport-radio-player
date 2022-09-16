function pad(str: number | string): string {
  return str.toString().padStart(2, '0')
}

export function durationSecondToText(duration: number): `${string}:${string}` {
  let hour = 0, minute = 0, second = 0

  duration = Math.floor(duration)
  second = duration % 60
  duration = Math.floor(duration / 60)
  minute = duration % 60
  duration = Math.floor(duration / 60)
  hour = duration

  if (hour > 0) {
    return `${hour}:${pad(minute)}:${pad(second)}`
  } else {
    return `${pad(minute)}:${pad(second)}`
  }
}
