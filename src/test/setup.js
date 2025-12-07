import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage with actual storage
const storage = new Map()
const localStorageMock = {
  getItem: vi.fn((key) => storage.get(key) || null),
  setItem: vi.fn((key, value) => storage.set(key, value)),
  removeItem: vi.fn((key) => storage.delete(key)),
  clear: vi.fn(() => storage.clear()),
  get length() {
    return storage.size
  },
  key: vi.fn((index) => {
    const keys = Array.from(storage.keys())
    return keys[index] || null
  })
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Also set global.localStorage for compatibility
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})