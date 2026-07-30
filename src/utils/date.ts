import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// dayjs 플러그인 로드
dayjs.extend(utc)
dayjs.extend(timezone)

const KST = 'Asia/Seoul'

/** UTC 날짜 → 'YYYY.MM.DD' (예: 2024.01.15) */
export function formatDate(utcDate: string | Date): string {
  return dayjs.utc(utcDate).tz(KST).format('YYYY.MM.DD')
}

/** UTC 날짜 → 'YYYY.MM.DD HH:mm' (예: 2024.01.15 18:00) */
export function formatDateTime(utcDate: string | Date): string {
  return dayjs.utc(utcDate).tz(KST).format('YYYY.MM.DD HH:mm')
}
