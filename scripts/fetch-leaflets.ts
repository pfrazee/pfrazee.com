import {fileURLToPath} from 'node:url'
import * as path from 'node:path'
import * as fsp from 'node:fs/promises'
import { IdResolver } from '@atproto/identity'
import { Client } from '@atproto/lex'
import type { ListRecord, DidString, LexMap } from '@atproto/lex'
import { lexStringify } from '@atproto/lex-json'
import * as leaflet from '../util/pub/leaflet.ts'
import { toExt, enumBlobRefs } from '../util/helpers.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

;(async()=>{
  console.log('=================')
  console.log('Fetching leaflets')
  console.log('=================')

  // Resolve DID and PDS
  const resolver = new IdResolver()
  const did = (await resolver.handle.resolve('pfrazee.com')) as DidString
  console.log('Resolved pfrazee.com to', did)
  const pds = (await resolver.did.resolveAtprotoData(did!)).pds
  console.log('Resolved pds to', pds)

  const client = new Client(pds)

  // Fetch all leaflets
  let leaflets: ListRecord<typeof leaflet.document.$defs.main>[] = []
  let invalids: LexMap[] = []
  let cursor: string | undefined = undefined
  let i = 0
  do {
    const result = await client.list(leaflet.document, {
      repo: did!,
      limit: 50,
      reverse: true,
      cursor
    })
    cursor = result.cursor
    leaflets = leaflets.concat(result.records)
    invalids = invalids.concat(result.invalid)
  } while(cursor && (++i < 100))
  console.log('Fetched', leaflets.length, 'leaflets.', invalids.length, 'failed validation.')

  // Write the leaflets to `/data/leaflets/*.json`
  const leafletDataDir = path.join(__dirname, '..', 'data', 'leaflets')
  if ((await fsp.stat(leafletDataDir).catch(e => undefined))) {
    await fsp.rm(leafletDataDir, {recursive: true})
  }
  await fsp.mkdir(leafletDataDir).catch(e => undefined)
  for (const leaflet of leaflets) {
    const rkey = leaflet.uri.split('/').pop()
    await fsp.writeFile(
      path.join(leafletDataDir, rkey + '.json'),
      lexStringify(leaflet.value),
      'utf-8'
    )
  }

  // Enumerate and fetch all missing images
  const imageDir = path.join(__dirname, '..', 'public', 'static', 'images', 'leaflets')
  await fsp.mkdir(imageDir).catch(e => undefined)
  for (const leaflet of leaflets) {
    const rkey = leaflet.uri.split('/').pop()!

    for (const blobRef of enumBlobRefs(leaflet.value)) {
       // images only
      if (!blobRef.mimeType.startsWith('image/')) {
        continue
      }

      // construct a filename
      const ext = toExt(blobRef.mimeType)
      if (!ext) {
        console.warn('Unsupported mimetype', blobRef)
        continue
      }
      const filename = `${blobRef.ref.toString()}.${ext}`.replaceAll('/', '' /* juuust in case */)
      const imagePath = path.join(imageDir, filename)

      // make sure the dir exists
      await fsp.mkdir(imageDir).catch(e => undefined)

      // check if the image exists
      if ((await fsp.stat(imagePath).catch(e => undefined))) {
        continue
      }

      // doesn't exist, fetch it
      console.log('Fetching', filename, 'for leaflet', rkey, '...')
      const blobRes = await client.getBlob(did, blobRef.ref.toString())

      // sanity
      if (blobRes.payload.encoding !== blobRef.mimeType) {
        console.error('Response mimetype does not match blobref mimetype, skipping', blobRes.payload.encoding, blobRef)
        continue
      }

      // write to disk
      await fsp.writeFile(imagePath, blobRes.payload.body)
      console.log('Fetched', blobRes.payload.body.byteLength, 'bytes')
    }
  }
})()

export {}