const STORAGE_KEY = 'super-hexagon'
const PASSPHRASE = 'super-hexagon-2025-crypto-key'
const IV_LENGTH = 12

async function getKey(): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const baseKey = await window.crypto.subtle.importKey('raw', enc.encode(PASSPHRASE), { name: 'PBKDF2' }, false, ['deriveKey'])
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('super-hexagon-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

export async function saveBestScore(score: number): Promise<void> {
    const key = await getKey()
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const enc = new TextEncoder()
    const data = enc.encode(score.toFixed(2))
    const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    const buffer = new Uint8Array(iv.length + ciphertext.byteLength)
    buffer.set(iv, 0)
    buffer.set(new Uint8Array(ciphertext), iv.length)
    const b64 = btoa(String.fromCharCode(...buffer))
    localStorage.setItem(STORAGE_KEY, b64)
}

export async function loadBestScore(): Promise<number> {
    const b64 = localStorage.getItem(STORAGE_KEY)
    if (!b64) {
        return 0.0
    }
    try {
        const buffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
        if (buffer.length <= IV_LENGTH) {
            return 0.0
        }
        const iv = buffer.slice(0, IV_LENGTH)
        const ciphertext = buffer.slice(IV_LENGTH)
        const key = await getKey()
        const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
        const dec = new TextDecoder()
        const scoreStr = dec.decode(decrypted)
        const score = parseFloat(scoreStr)
        if (!isFinite(score) || score < 0) {
            return 0.0
        }
        return parseFloat(score.toFixed(2))
    } catch {
        return 0.0
    }
}
