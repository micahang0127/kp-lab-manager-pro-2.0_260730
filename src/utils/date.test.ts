import { describe, expect, it } from 'vitest'

import { formatDate, formatDateTime } from './date'

describe('formatDate', () => {
  it('UTC 날짜를 KST YYYY.MM.DD 형식으로 변환한다', () => {
    // UTC 00:00 → KST 09:00 이므로 날짜가 같아야 함
    expect(formatDate('2024-01-15T00:00:00Z')).toBe('2024.01.15')
  })

  it('UTC 14:59 → KST 23:59 (같은 날)', () => {
    // UTC 2024-01-15T14:59:00Z → KST 2024-01-15T23:59:00
    expect(formatDate('2024-01-15T14:59:00Z')).toBe('2024.01.15')
  })

  it('UTC 15:00 → KST 다음날로 변환된다 (경계값)', () => {
    // UTC 2024-01-15T15:00:00Z → KST 2024-01-16T00:00:00
    expect(formatDate('2024-01-15T15:00:00Z')).toBe('2024.01.16')
  })

  it('UTC 23:59 → KST 다음날 08:59', () => {
    // UTC 2024-01-15T23:59:00Z → KST 2024-01-16T08:59:00
    expect(formatDate('2024-01-15T23:59:00Z')).toBe('2024.01.16')
  })

  it('Date 객체도 입력받을 수 있다', () => {
    const date = new Date('2024-01-15T00:00:00Z')
    expect(formatDate(date)).toBe('2024.01.15')
  })

  it('월/일 경계값을 처리한다 (월 말일)', () => {
    // 1월 31일 23:00 UTC → 2월 1일 08:00 KST
    expect(formatDate('2024-01-31T15:00:00Z')).toBe('2024.02.01')
  })

  it('연도 경계값을 처리한다 (12월 31일)', () => {
    // 2023년 12월 31일 15:00 UTC → 2024년 1월 1일 00:00 KST
    expect(formatDate('2023-12-31T15:00:00Z')).toBe('2024.01.01')
  })

  it('윤년 2월을 처리한다', () => {
    // 2024년 2월 29일 (윤년)
    expect(formatDate('2024-02-29T00:00:00Z')).toBe('2024.02.29')
  })
})

describe('formatDateTime', () => {
  it('UTC 날짜시간을 KST YYYY.MM.DD HH:mm 형식으로 변환한다', () => {
    expect(formatDateTime('2024-01-15T00:00:00Z')).toBe('2024.01.15 09:00')
  })

  it('UTC 12:30 → KST 21:30 (시간 변환)', () => {
    expect(formatDateTime('2024-01-15T12:30:00Z')).toBe('2024.01.15 21:30')
  })

  it('UTC 14:59 → KST 23:59 (경계값)', () => {
    expect(formatDateTime('2024-01-15T14:59:00Z')).toBe('2024.01.15 23:59')
  })

  it('UTC 15:00 → KST 다음날 00:00로 변환된다 (경계값)', () => {
    expect(formatDateTime('2024-01-15T15:00:00Z')).toBe('2024.01.16 00:00')
  })

  it('UTC 23:00 → KST 다음날 08:00', () => {
    expect(formatDateTime('2024-01-15T23:00:00Z')).toBe('2024.01.16 08:00')
  })

  it('Date 객체도 입력받을 수 있다', () => {
    const date = new Date('2024-01-15T12:30:00Z')
    expect(formatDateTime(date)).toBe('2024.01.15 21:30')
  })

  it('분 단위를 정확히 표시한다', () => {
    expect(formatDateTime('2024-01-15T00:05:30Z')).toBe('2024.01.15 09:05')
    expect(formatDateTime('2024-01-15T00:55:30Z')).toBe('2024.01.15 09:55')
  })
})
