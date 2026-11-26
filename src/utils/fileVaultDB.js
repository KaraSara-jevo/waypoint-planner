import { createId } from '../data/sampleData'

const DATABASE_NAME = 'WaypointFileVault'
const DATABASE_VERSION = 1
const STORE_NAME = 'attachments'

let databasePromise

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'))
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        databasePromise = undefined
        reject(request.error ?? new Error('Could not open the file vault.'))
      }
      request.onblocked = () => {
        databasePromise = undefined
        reject(new Error('The file vault is blocked by another open tab.'))
      }
    })
  }

  return databasePromise
}

function getFileMetadata(record) {
  return {
    id: record.id,
    fileName: record.fileName,
    fileType: record.fileType,
    fileSize: record.fileSize,
    createdAt: record.createdAt,
  }
}

export const WaypointFileVault = {
  async saveFile(file) {
    if (!file || typeof file.size !== 'number') {
      throw new TypeError('Choose a valid file to save.')
    }

    const record = {
      id: createId(),
      fileName: file.name || `attachment-${Date.now()}`,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      blob: file,
      createdAt: new Date().toISOString(),
    }
    const database = await openDatabase()

    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(record)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this file.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Saving this file was cancelled.'))
    })

    return getFileMetadata(record)
  },

  async getFile(id) {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(id)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error ?? new Error('Could not load this file.'))
    })
  },

  async deleteFile(id) {
    if (!id) return
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(id)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete this file.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Deleting this file was cancelled.'))
    })
  },
}

export default WaypointFileVault
