export function getFileFromInputElement(input: HTMLInputElement | null): File | null {
  const files = input?.files
  if (files == null || files.length === 0) {
    return null
  }

  const file = files[0]
  if (file == null) {
    return null
  }

  return file
}
