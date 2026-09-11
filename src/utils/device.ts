import type { LoginDevice } from '../api/auth'

// tailwind.config.js에 정의된 프로젝트 브레이크포인트와 동일한 기준
// (모바일 <768px, 태블릿 768~1023px, 웹 1024px~)
const TABLET_MIN_WIDTH = 768
const WEB_MIN_WIDTH = 1024

/**
 * 현재 실행 환경을 로그인 API의 device 값으로 변환한다.
 * user-agent 문자열 판별은 브라우저/기기마다 예외가 많아 신뢰하기 어렵고, 이 값은 "서버가
 * 기록하는 접속 환경" 용도라 화면 너비 기준으로 충분하다. 로그인과 2차 인증 사이에 창 크기가
 * 바뀌어도 같은 값이 전송되도록, 호출 측은 로그인 시점에 한 번 구해 loginFlowStore.pending에
 * 담아 재사용해야 한다.
 */
export function getLoginDevice(): LoginDevice {
  const width = window.innerWidth
  if (width >= WEB_MIN_WIDTH) return 'W'
  if (width >= TABLET_MIN_WIDTH) return 'T'
  return 'M'
}
