// Run from frontend/ directory:
//   node --env-file=.env.local scripts/seed-firestore.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, deleteDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

// ── Menu items ────────────────────────────────────────────────────────────────
const menuItems = JSON.parse(readFileSync('./public/data/menu.json', 'utf8'))
console.log(`Seeding ${menuItems.length} menu items...`)
for (const item of menuItems) {
  await addDoc(collection(db, 'menu_items'), item)
  process.stdout.write('.')
}
console.log('\nDone.')

// ── WiFi config ───────────────────────────────────────────────────────────────
const wifi = JSON.parse(readFileSync('./public/data/wifi.json', 'utf8'))
await setDoc(doc(db, 'config', 'wifi'), wifi)
console.log('WiFi config seeded.')

// ── Gallery ───────────────────────────────────────────────────────────────────
const gallery = JSON.parse(readFileSync('./public/data/gallery.json', 'utf8'))
console.log(`Seeding ${gallery.length} gallery images...`)
for (let i = 0; i < gallery.length; i++) {
  await addDoc(collection(db, 'gallery'), { url: gallery[i], order: i })
  process.stdout.write('.')
}
console.log('\nGallery seeded.')

// ── Events ────────────────────────────────────────────────────────────────────
const concerts = JSON.parse(readFileSync('./public/data/concerts.json', 'utf8'))
console.log(`Seeding ${concerts.length} events...`)
for (let i = 0; i < concerts.length; i++) {
  const c = concerts[i]
  await addDoc(collection(db, 'events'), {
    title:      c.title,
    title_he:   c.title_he ?? c.title,
    date:       '',
    poster_url: `images/concerts/${c.file}`,
    order:      i,
  })
  process.stdout.write('.')
}
console.log('\nEvents seeded.')

process.exit(0)
