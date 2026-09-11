/** 초 단위 남은 시간을 'MM:SS' 형식으로 변환 */
export function formatTimeLeft(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
