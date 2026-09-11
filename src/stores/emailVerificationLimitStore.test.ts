import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCookie } from '../utils/cookie'
import {
  formatLimitWindowHours,
  isAttemptLimitExceeded,
  useEmailVerificationLimitStore,
} from './emailVerificationLimitStore'

const setup = () => useEmailVerificationLimitStore.getState()

const ONE_HOUR_MS = 60 * 60 * 1000
const WINDOW_MS = 24 * ONE_HOUR_MS
const MAX_ATTEMPTS = 5

describe('emailVerificationLimitStore', () => {
  beforeEach(() => {
    document.cookie = 'emailVerificationLimit=; max-age=0; path=/'
    useEmailVerificationLimitStore.setState({ records: {} })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('recordAttempt를 처음 호출하면 count 1로 기록하고 쿠키에도 저장한다', () => {
    useEmailVerificationLimitStore
      .getState()
      .recordAttempt('register-send', 'user@test.com', WINDOW_MS)

    const { records } = useEmailVerificationLimitStore.getState()
    expect(records['register-send:user@test.com'].count).toBe(1)

    const cookieValue = getCookie('emailVerificationLimit')
    expect(cookieValue).not.toBeNull()
    expect(JSON.parse(cookieValue ?? '{}')['register-send:user@test.com'].count).toBe(1)
  })

  it('windowMs 이내에 반복 호출하면 count가 누적된다', () => {
    const store = useEmailVerificationLimitStore.getState()
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)

    const { records } = useEmailVerificationLimitStore.getState()
    expect(records['register-send:user@test.com'].count).toBe(3)
  })

  it('windowMs가 지난 뒤 recordAttempt를 호출하면 count가 1로 초기화된다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    const store = useEmailVerificationLimitStore.getState()
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
    expect(
      useEmailVerificationLimitStore.getState().records['register-send:user@test.com'].count
    ).toBe(2)

    vi.setSystemTime(WINDOW_MS + 1)
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)

    const record = useEmailVerificationLimitStore.getState().records['register-send:user@test.com']
    expect(record.count).toBe(1)
    expect(record.firstAttemptAt).toBe(WINDOW_MS + 1)
  })

  it('purpose가 다르면 같은 이메일이라도 독립적으로 카운트된다', () => {
    const store = useEmailVerificationLimitStore.getState()
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
    store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
    store.recordAttempt('login-send', 'user@test.com', WINDOW_MS)

    const { records } = useEmailVerificationLimitStore.getState()
    expect(records['register-send:user@test.com'].count).toBe(2)
    expect(records['login-send:user@test.com'].count).toBe(1)
  })

  it('이메일 대소문자/공백 차이는 같은 계정으로 취급된다', () => {
    const store = useEmailVerificationLimitStore.getState()
    store.recordAttempt('register-send', 'User@Test.com', WINDOW_MS)
    store.recordAttempt('register-send', ' user@test.com ', WINDOW_MS)

    const { records } = useEmailVerificationLimitStore.getState()
    expect(records['register-send:user@test.com'].count).toBe(2)
  })

  it('recordAttempt로 저장한 값은 쿠키에서 다시 읽어도 유지된다(브라우저 재시작 재현)', async () => {
    useEmailVerificationLimitStore
      .getState()
      .recordAttempt('register-send', 'user@test.com', WINDOW_MS)

    vi.resetModules()
    const { useEmailVerificationLimitStore: freshStore } =
      await import('./emailVerificationLimitStore')

    expect(freshStore.getState().records['register-send:user@test.com'].count).toBe(1)
  })

  describe('resetAttemptsForNewCode', () => {
    it('한도 미만일 때 새 인증번호가 발급되면 실패 기록을 지워 다시 처음부터 셀 수 있게 한다', () => {
      const store = setup()
      store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
      store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
      expect(
        useEmailVerificationLimitStore.getState().records['register-send:user@test.com'].count
      ).toBe(2)

      store.resetAttemptsForNewCode('register-send', 'user@test.com')

      expect(
        useEmailVerificationLimitStore.getState().records['register-send:user@test.com']
      ).toBeUndefined()
    })

    it('이미 한도(5회)를 초과해 잠긴 상태라도 새 인증번호가 발급되면 잠금 기록을 지운다(코드 단위로만 카운트되므로)', () => {
      const store = setup()
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
      }
      expect(
        isAttemptLimitExceeded(
          useEmailVerificationLimitStore.getState().records,
          'register-send',
          'user@test.com',
          MAX_ATTEMPTS,
          WINDOW_MS
        )
      ).toBe(true)

      store.resetAttemptsForNewCode('register-send', 'user@test.com')

      expect(
        isAttemptLimitExceeded(
          useEmailVerificationLimitStore.getState().records,
          'register-send',
          'user@test.com',
          MAX_ATTEMPTS,
          WINDOW_MS
        )
      ).toBe(false)
    })

    it('기록이 없으면 아무 동작도 하지 않는다', () => {
      const store = setup()
      store.resetAttemptsForNewCode('register-send', 'nobody@test.com')

      expect(useEmailVerificationLimitStore.getState().records).toEqual({})
    })
  })

  describe('isAttemptLimitExceeded', () => {
    it('count가 maxAttempts 미만이면 false를 반환한다', () => {
      const store = useEmailVerificationLimitStore.getState()
      for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
        store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
      }

      const { records } = useEmailVerificationLimitStore.getState()
      expect(
        isAttemptLimitExceeded(records, 'register-send', 'user@test.com', MAX_ATTEMPTS, WINDOW_MS)
      ).toBe(false)
    })

    it('count가 maxAttempts 이상이면 true를 반환한다', () => {
      const store = useEmailVerificationLimitStore.getState()
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
      }

      const { records } = useEmailVerificationLimitStore.getState()
      expect(
        isAttemptLimitExceeded(records, 'register-send', 'user@test.com', MAX_ATTEMPTS, WINDOW_MS)
      ).toBe(true)
    })

    it('기록이 없으면 false를 반환한다', () => {
      const { records } = useEmailVerificationLimitStore.getState()
      expect(
        isAttemptLimitExceeded(records, 'register-send', 'nobody@test.com', MAX_ATTEMPTS, WINDOW_MS)
      ).toBe(false)
    })

    it('windowMs가 지난 기록은 초과로 보지 않는다(false)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(0)

      const store = useEmailVerificationLimitStore.getState()
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        store.recordAttempt('register-send', 'user@test.com', WINDOW_MS)
      }
      expect(
        isAttemptLimitExceeded(
          useEmailVerificationLimitStore.getState().records,
          'register-send',
          'user@test.com',
          MAX_ATTEMPTS,
          WINDOW_MS
        )
      ).toBe(true)

      vi.setSystemTime(WINDOW_MS + 1)
      expect(
        isAttemptLimitExceeded(
          useEmailVerificationLimitStore.getState().records,
          'register-send',
          'user@test.com',
          MAX_ATTEMPTS,
          WINDOW_MS
        )
      ).toBe(false)
    })
  })

  describe('formatLimitWindowHours', () => {
    it('밀리초를 정수 시간 단위 문구로 변환한다', () => {
      expect(formatLimitWindowHours(WINDOW_MS)).toBe('24시간')
      expect(formatLimitWindowHours(ONE_HOUR_MS)).toBe('1시간')
    })
  })
})
