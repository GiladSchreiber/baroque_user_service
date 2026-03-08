// Upload all existing images to Firebase Storage and update Firestore references.
// Run from frontend/ directory:
//   node --env-file=.env.local scripts/upload-images.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc, query, orderBy } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { extname } from 'path'

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

const app    = initializeApp(firebaseConfig)
const db     = getFirestore(app)
const BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET
const API_KEY = process.env.VITE_FIREBASE_API_KEY

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.JPG': 'image/jpeg',
  '.png': 'image/png',  '.gif': 'image/gif',
}

// Firebase Storage REST API — works in Node.js without browser polyfills
async function upload(localPath, storagePath) {
  const buffer    = readFileSync(localPath)
  const mimeType  = MIME[extname(localPath)] ?? 'image/jpeg'
  const encoded   = encodeURIComponent(storagePath)
  const url       = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?uploadType=media&name=${encoded}&key=${API_KEY}`
  const res       = await fetch(url, { method: 'POST', headers: { 'Content-Type': mimeType }, body: buffer })
  const data      = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? JSON.stringify(data))
  const token = data.downloadTokens
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`
}

// ── 1. Upload all images in public/images (preserving paths) ──────────────────
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

function walkDir(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (!entry.startsWith('.') && !entry.endsWith('.svg')) results.push(full)
  }
  return results
}

const imageFiles = walkDir('./public/images').filter(f => !f.includes('.DS_Store'))
console.log(`\nUploading ${imageFiles.length} images to Firebase Storage...`)

const urlMap = {} // localRelativePath → storage URL
for (const file of imageFiles) {
  const relativePath = file.replace(/^public\//, '') // e.g. "images/cover_app1.jpg"
  try {
    const url = await upload(file, relativePath)
    urlMap[relativePath] = url
    process.stdout.write('.')
  } catch (e) {
    console.error(`\nFailed: ${relativePath} — ${e.message}`)
  }
}
console.log('\nAll images uploaded.\n')

// ── 2. Update Firestore gallery documents ─────────────────────────────────────
console.log('Updating gallery Firestore docs...')
const gallerySnap = await getDocs(query(collection(db, 'gallery'), orderBy('order')))
for (const docSnap of gallerySnap.docs) {
  const { url } = docSnap.data()
  if (url.startsWith('http')) { process.stdout.write('-'); continue } // already a Storage URL
  const storageUrl = urlMap[url]
  if (storageUrl) {
    await updateDoc(doc(db, 'gallery', docSnap.id), { url: storageUrl })
    process.stdout.write('.')
  } else {
    console.warn(`\nNo upload for gallery: ${url}`)
  }
}
console.log('\nGallery updated.')

// ── 3. Update Firestore events documents ──────────────────────────────────────
console.log('Updating events Firestore docs...')
const eventsSnap = await getDocs(query(collection(db, 'events'), orderBy('order')))
for (const docSnap of eventsSnap.docs) {
  const { poster_url } = docSnap.data()
  if (poster_url.startsWith('http')) { process.stdout.write('-'); continue }
  const storageUrl = urlMap[poster_url]
  if (storageUrl) {
    await updateDoc(doc(db, 'events', docSnap.id), { poster_url: storageUrl })
    process.stdout.write('.')
  } else {
    console.warn(`\nNo upload for event poster: ${poster_url}`)
  }
}
console.log('\nEvents updated.')

// ── 4. Seed covers collection ─────────────────────────────────────────────────
console.log('Seeding covers collection...')
const coverPaths = [
  'images/cover_app1.jpg',
  'images/cover_app2.jpg',
  'images/cover_app3.jpg',
  'images/cover_app4.jpg',
]
for (let i = 0; i < coverPaths.length; i++) {
  const url = urlMap[coverPaths[i]]
  if (url) {
    await addDoc(collection(db, 'covers'), { url, order: i })
    process.stdout.write('.')
  }
}
console.log('\nCovers seeded.')

process.exit(0)
