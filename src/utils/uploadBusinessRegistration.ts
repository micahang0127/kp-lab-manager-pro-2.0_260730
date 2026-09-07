import type { BusinessRegistrationReviewData } from '../api/file'
import { createPresignedUploadUrl, reviewBusinessRegistration } from '../api/file'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedBusinessRegistration {
  review: BusinessRegistrationReviewData
  /** review API가 요구하는 값이자, 8단계(최종 제출)에서 재업로드 없이 같은 파일을 참조할 때 필요 */
  s3Key: string
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/** 20MB 파일이 느린 네트워크에서 무한 대기하지 않도록 S3 PUT 자체에도 타임아웃을 둔다 */
const S3_UPLOAD_TIMEOUT_MS = 60_000

/**
 * 카드 UI가 표시하는 두 필드(법인명/사업자등록번호) 중 하나라도 인식되지 않았으면
 * 카드를 렌더링할 수 없으므로 재업로드가 필요한 것으로 판단한다.
 * (8개 필드가 전부 null인 완전 인식 실패도 이 조건에 포함된다)
 */
function needsReupload(data: BusinessRegistrationReviewData): boolean {
  return data.corporateName === null || data.registrationNumber === null
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * 사업자등록증 PDF를 S3에 업로드하고 분석 결과와 s3Key를 반환한다.
 * 1) presigned URL 발급 (s3Key도 함께 응답으로 옴)
 * 2) S3에 직접 PUT — 백엔드 API가 아니므로 api 클라이언트를 쓰지 않고 fetch를 직접 사용한다.
 *    Content-Type은 PDF로 고정하고, AbortController로 60초 타임아웃을 둔다
 * 3) 분석 API 호출
 * 법인명/사업자등록번호를 인식하지 못했으면 재업로드를 요구하는 에러를 던진다.
 */
export async function uploadBusinessRegistration(
  file: File
): Promise<UploadedBusinessRegistration> {
  const presignedRes = await createPresignedUploadUrl({
    fileType: 'BusinessRegistration',
    originFileName: [file.name],
  })
  const uploadTarget = presignedRes.data?.urls[0]
  if (!uploadTarget) throw new Error('업로드 URL 발급에 실패했습니다.')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), S3_UPLOAD_TIMEOUT_MS)
  let uploadRes: Response
  try {
    uploadRes = await fetch(uploadTarget.presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
      signal: controller.signal,
    })
  } catch (err) {
    // AbortController가 끊은 경우(시간 초과)만 안내 문구를 구분한다. 그 외(오프라인, DNS 실패
    // 등)는 src/api/index.ts의 request()와 동일하게 공통 문구로 대체한다
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('파일 업로드 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')
    }
    throw new Error('파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    clearTimeout(timeoutId)
  }
  if (!uploadRes.ok) throw new Error('파일 업로드에 실패했습니다.')

  const reviewRes = await reviewBusinessRegistration({ s3Key: uploadTarget.s3Key })
  if (!reviewRes.data || needsReupload(reviewRes.data)) {
    throw new Error('사업자등록증을 인식할 수 없습니다. 다시 업로드해주세요.')
  }
  return { review: reviewRes.data, s3Key: uploadTarget.s3Key }
}
