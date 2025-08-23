import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)
const sizes = [128, 256, 512]

export async function cacheImage(srcUrl, key) {
  const res = await fetch(srcUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  const sharp = await import('sharp')
  for (const size of sizes) {
    const resized = await sharp.default(buffer).resize(size).toBuffer()
    await supabase.storage
      .from('product-images')
      .upload(`${key}_${size}.jpg`, resized, {
        contentType: 'image/jpeg',
        upsert: true
      })
  }
}

if (process.argv[2] && process.argv[3]) {
  cacheImage(process.argv[2], process.argv[3])
    .then(() => console.log('Cached image', process.argv[3]))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
