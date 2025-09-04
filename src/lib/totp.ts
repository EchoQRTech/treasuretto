import crypto from 'crypto'

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  // Pad with '=' to a multiple of 8 chars if desired by clients; we skip padding to keep secrets compact
  return output
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i])
    if (idx === -1) continue

    value = (value << 5) | idx
    bits += 5

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

export class TOTP {
  private static readonly DIGITS = 6
  private static readonly PERIOD = 30 // 30 seconds
  private static readonly ALGORITHM = 'sha1'

  /**
   * Generate a TOTP secret key (Base32 encoded)
   */
  static generateSecret(): string {
    const raw = crypto.randomBytes(20)
    return base32Encode(raw)
  }

  /**
   * Generate a TOTP code for the current time
   */
  static generateCode(secret: string, time?: number): string {
    const counter = Math.floor((time || Date.now()) / 1000 / this.PERIOD)
    return this.generateCodeForCounter(secret, counter)
  }

  /**
   * Generate a TOTP code for a specific counter
   */
  static generateCodeForCounter(secret: string, counter: number): string {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(counter), 0)

    const key = base32Decode(secret)
    const hmac = crypto.createHmac(this.ALGORITHM, key)
    hmac.update(buffer)
    const hash = hmac.digest()

    const offset = hash[hash.length - 1] & 0xf
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff)

    return (code % Math.pow(10, this.DIGITS)).toString().padStart(this.DIGITS, '0')
  }

  /**
   * Verify a TOTP code with tolerance for clock skew
   */
  static verifyCode(secret: string, code: string, tolerance: number = 1): boolean {
    const now = Math.floor(Date.now() / 1000 / this.PERIOD)
    
    for (let i = -tolerance; i <= tolerance; i++) {
      const expectedCode = this.generateCodeForCounter(secret, now + i)
      if (expectedCode === code) {
        return true
      }
    }
    
    return false
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  static generateQRUrl(secret: string, accountName: string, issuer: string = 'TreasureTto'): string {
    const encodedIssuer = encodeURIComponent(issuer)
    const encodedAccount = encodeURIComponent(accountName)
    const encodedSecret = encodeURIComponent(secret)
    
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.DIGITS}&period=${this.PERIOD}`
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(providedCode: string, storedCodes: string[]): boolean {
    const normalizedCode = providedCode.toUpperCase().replace(/\s/g, '')
    return storedCodes.includes(normalizedCode)
  }
}
