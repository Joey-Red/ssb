import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'src/data/frameData.generated.json')
const destination = resolve(root, 'public/data/frameData.generated.json')

await mkdir(dirname(destination), { recursive: true })
await copyFile(source, destination)
console.log('Prepared public/data/frameData.generated.json')
