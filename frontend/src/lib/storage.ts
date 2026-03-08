import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/** Resize + compress a File using a canvas before uploading. Max 1200px, quality 0.82. */
async function compressImage(file: File, maxPx = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', 0.82)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const compressed = await compressImage(file)
  const path       = `${folder}/${Date.now()}_${file.name.replace(/\.[^.]+$/, '.jpg')}`
  const storeRef   = ref(storage, path)
  await uploadBytes(storeRef, compressed, { contentType: 'image/jpeg' })
  return getDownloadURL(storeRef)
}
