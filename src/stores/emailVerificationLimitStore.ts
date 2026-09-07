import { create } from 'zustand'

import { getCookie, setCookie } from '../utils/cookie'

// ─── Types ────────────────────────────────────────────────────────────────────

/** 이 스토어가 관리하는 프론트 전용 횟수 제한 용도. 실제 방어는 서버가 담당하며(한도 초과 시
 *  409 응답), 이 스토어는 한도 초과가 확실한 요청을 API 호출 전에 화면에서 먼저 막기 위한
 *  보조 가드일 뿐이다. 서버가 잔여 횟수/초기화 시각을 응답에 내려주지 않아 프론트가 자체
 *  추정하는 것이므로, 서버의 실제 판단 기준과 100% 일치하지 않을 수 있다(서버 에러 메시지가
 *  오면 항상 그것을 우선 표시할 것). */
export type EmailVerificationLimitPurpose = 'register-send' | 'register-verify-fail'

interface AttemptRecord {
  count: number
  /** 이 구간의 첫 시도 시각(epoch ms). 이 시각으로부터 windowMs가 지나면 새 구간으로 취급한다 */
  firstAttemptAt: number
}

type AttemptRecordMap = Record<string, AttemptRecord>

// ─── Cookie ───────────────────────────────────────────────────────────────────
// 브라우저를 완전히 닫았다 다시 열어도 한도가 유지되어야 하므로 sessionStorage가 아닌 쿠키를
// 사용한다(utils/cookie.ts에 문서화된 예외 — 브라우저 재시작 후에도 유지가 필요한 비민감 값).

const COOKIE_KEY = 'emailVerificationLimit'
// 쿠키 자체의 물리적 만료는 "오래된 기록 정리용" 버퍼일 뿐이며, 실제 24시간(또는 화면별
// windowMs) 한도 판정은 저장된 firstAttemptAt을 기준으로 아래 isAttemptLimitExceeded가
// 직접 비교한다. 여러 purpose/email 기록이 한 쿠키에 섞여 있어도 한 기록을 갱신했다고
// 다른 기록의 논리적 만료가 함께 늘어나지 않도록, 물리적 만료는 지원 가능한 가장 긴
// windowMs보다 넉넉하게(48시간) 잡는다.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 48

function toKey(purpose: EmailVerificationLimitPurpose, email: string): string {
  return `${purpose}:${email.trim().toLowerCase()}`
}

function readRecords(): AttemptRecordMap {
  const raw = getCookie(COOKIE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AttemptRecordMap
  } catch {
    return {}
  }
}

/** 쿠키가 무한정 커지지 않도록, 물리적 정리 기준(COOKIE_MAX_AGE_SECONDS)을 넘긴 오래된
 *  기록은 저장 시 함께 제거한다 */
function pruneStale(records: AttemptRecordMap, now: number): AttemptRecordMap {
  const entries = Object.entries(records).filter(
    ([, record]) => now - record.firstAttemptAt < COOKIE_MAX_AGE_SECONDS * 1000
  )
  return Object.fromEntries(entries)
}

function writeRecords(records: AttemptRecordMap): void {
  setCookie(COOKIE_KEY, JSON.stringify(records), COOKIE_MAX_AGE_SECONDS)
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface EmailVerificationLimitState {
  records: AttemptRecordMap
  /** purpose+email 조합으로 시도 1회를 기록한다. 마지막 기록 후 windowMs가 지났으면 새 구간으로
   *  간주해 1부터 다시 센다 */
  recordAttempt: (purpose: EmailVerificationLimitPurpose, email: string, windowMs: number) => void
  /** 새 인증번호가 발급되는 시점(발송 성공)에 호출한다. 실패 카운트는 "해당 인증번호"
   *  단위로만 유효하므로, 새 인증번호를 받으면 이전 실패 기록은 무조건 지우고 다시 처음부터
   *  셀 수 있게 한다. 호출 측은 실제로 새 인증번호가 발급된 시점(예: 발송 mutation의
   *  onSuccess)에만 호출해야 하며, 단순히 이메일 입력값이 바뀌는 것만으로는 호출하면 안 된다
   *  (그러면 인증번호를 받지 않고도 잠금이 풀려버린다) */
  resetAttemptsForNewCode: (purpose: EmailVerificationLimitPurpose, email: string) => void
}

/** fingerprintStore와 동일하게 "쿠키 read → state로 미러링 → 액션에서 쿠키+state 동시 갱신"
 *  패턴을 따른다. */
export const useEmailVerificationLimitStore = create<EmailVerificationLimitState>((set, get) => ({
  records: readRecords(),
  recordAttempt: (purpose, email, windowMs) => {
    const key = toKey(purpose, email)
    const now = Date.now()
    const existing = get().records[key]
    const isExpired = !existing || now - existing.firstAttemptAt >= windowMs
    const nextRecord: AttemptRecord = isExpired
      ? { count: 1, firstAttemptAt: now }
      : { count: existing.count + 1, firstAttemptAt: existing.firstAttemptAt }

    const records = pruneStale({ ...get().records, [key]: nextRecord }, now)
    writeRecords(records)
    set({ records })
  },
  resetAttemptsForNewCode: (purpose, email) => {
    const key = toKey(purpose, email)
    if (!(key in get().records)) return

    const records = { ...get().records }
    delete records[key]
    writeRecords(records)
    set({ records })
  },
}))

/** windowMs(밀리초)를 "24시간"처럼 정수 시간 단위 한국어 문구로 변환한다. 한도 초과 안내
 *  문구에서 사용한다 */
export function formatLimitWindowHours(windowMs: number): string {
  return `${Math.round(windowMs / (60 * 60 * 1000))}시간`
}

/**
 * purpose+email 조합의 현재 시도 횟수가 maxAttempts 이상인지 순수 함수로 판단한다. windowMs가
 * 지난 기록은 만료된 것으로 보아 false를 반환한다(값 자체는 다음 recordAttempt 호출 시 초기화).
 * 컴포넌트에서는 useEmailVerificationLimitStore(s => s.records)로 구독한 뒤 이 함수로 판정해야
 * 기록이 바뀔 때마다 올바르게 리렌더링된다(store 메서드로 만들면 함수 참조가 고정돼 리렌더링을
 * 못 감지한다).
 */
export function isAttemptLimitExceeded(
  records: AttemptRecordMap,
  purpose: EmailVerificationLimitPurpose,
  email: string,
  maxAttempts: number,
  windowMs: number,
  now = Date.now()
): boolean {
  const record = records[toKey(purpose, email)]
  if (!record) return false
  if (now - record.firstAttemptAt >= windowMs) return false
  return record.count >= maxAttempts
}
