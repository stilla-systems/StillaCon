const GHANA_LOCAL_PATTERN = /^0(2|5|6|7|9)\d{8}$/
const GHANA_E164_PATTERN = /^\+233(2|5|6|7|9)\d{8}$/

export function normalizePhoneNumber(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, "")
  if (GHANA_LOCAL_PATTERN.test(compact)) return `+233${compact.slice(1)}`
  if (GHANA_E164_PATTERN.test(compact)) return compact
  throw new Error("Enter a valid Ghanaian phone number, such as +233 24 123 4567.")
}

export function isValidPhoneNumber(value: string): boolean {
  try {
    normalizePhoneNumber(value)
    return true
  } catch {
    return false
  }
}
