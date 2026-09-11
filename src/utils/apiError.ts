import { ApiError } from '../api'

/**
 * ApiError에서 특정 필드의 검증 에러 메시지 목록을 꺼낸다. ValidationPipe(DTO) 검증 실패 시
 * ApiError.fieldErrors에 `{ 필드명: [메시지] }` 형태로 원본 구조가 보존되어 있다.
 * error가 ApiError가 아니거나 해당 필드에 에러가 없으면 undefined를 반환한다.
 */
export function getFieldErrors(error: unknown, field: string): string[] | undefined {
  if (!(error instanceof ApiError)) return undefined
  return error.fieldErrors?.[field]
}
