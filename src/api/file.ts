import type { ApiResponse } from '.'
import { api } from '.'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileType =
  | 'BusinessRegistration'
  | 'ReagentImage'
  | 'ReagentEtcImage'
  | 'MSDS/USER'
  | 'InventoryEtcImage'

export interface CreatePresignedUploadUrlRequest {
  /** 업로드할 파일의 용도(도메인) */
  fileType: FileType
  /** 업로드할 파일의 원본 이름 목록 */
  originFileName: string[]
}

export interface PresignedUploadUrlItem {
  /** 업로드할 파일의 원본 이름 */
  originFileName: string
  /** 업로드할 presigned URL */
  presignedUrl: string
  /** 업로드될 S3 객체 키 (예: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf').
   *  Swagger 문서(FilePresignedUploadUrlItemPayload)엔 선언돼 있지 않지만 실제 응답에는
   *  포함된다 — business-registration/review 등 후속 API 호출 시 이 값을 그대로 사용 */
  s3Key: string
}

export interface CreatePresignedUploadUrlData {
  /** 파일별 presigned URL 발급 결과 목록 */
  urls: PresignedUploadUrlItem[]
}

export interface BusinessRegistrationReviewRequest {
  /** 분석할 사업자등록증 PDF의 S3 키 */
  s3Key: string
}

export interface BusinessRegistrationReviewData {
  /** 사업자 등록번호 (예: '123-45-67890'). 인식 실패 시 null */
  registrationNumber: string | null
  /** 법인명(단체명). 인식 실패 시 null */
  corporateName: string | null
  /** 대표자명. 인식 실패 시 null */
  ceoName: string | null
  /** 법인등록번호 (예: '110111-1234567'). 인식 실패 시 null */
  corporateRegistrationNumber: string | null
  /** 사업장 소재지. 인식 실패 시 null */
  businessAddress: string | null
  /** 업태. 8개 필드가 전부 인식되면 여러 개일 때 첫 항목만, 하나라도 실패하면 쉼표로 구분된
   *  원본 전체가 내려온다. 인식 실패 시 null */
  businessType: string | null
  /** 종목. businessType과 동일한 트리밍 규칙. 인식 실패 시 null */
  businessItem: string | null
  /** 발급일 (yyyy-mm-dd). 인식 실패 시 null */
  issueDate: string | null
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * S3 업로드용 presigned URL 발급. 백엔드가 파일을 직접 받지 않고 S3 presigned URL 방식을
 * 쓰므로, 실제 파일 업로드 전 이 API로 업로드 대상 URL(및 S3 키)을 먼저 받아야 한다.
 * 회원가입 진행 중(로그인 전)에도 호출되며 스펙상 인증 불필요(skipAuth).
 */
export const createPresignedUploadUrl = (
  body: CreatePresignedUploadUrlRequest
): Promise<ApiResponse<CreatePresignedUploadUrlData>> =>
  api.post<CreatePresignedUploadUrlData>('/v1/file/presigned-upload-url', body, {
    skipAuth: true,
  })

/** Bedrock으로 PDF를 분석하므로 공용 타임아웃(10초)보다 오래 걸릴 수 있어 40초로 늘린다 */
const REVIEW_TIMEOUT_MS = 40_000

/**
 * S3에 업로드된 사업자등록증 PDF를 Bedrock으로 분석해 사업자 정보를 반환한다.
 * 호출 전 createPresignedUploadUrl로 발급받은 presignedUrl에 파일을 먼저 PUT 업로드해둬야
 * 하며, 이 API에는 그때 함께 받은 s3Key를 전달한다.
 * 8개 필드가 전부 인식되면 정상 데이터를, 하나라도 인식 실패하면 실패한 필드만 null로 내려준다
 * (이는 서버 에러가 아니라 result: true인 정상 응답이다).
 * 회원가입 진행 중(로그인 전)에도 호출되며 스펙상 인증 불필요(skipAuth).
 *
 * 에러 응답:
 * - 400 (DTO 검증 실패, message는 `{ 필드명: [메시지] }` 객체): s3Key 누락 → '{ s3Key: ["S3
 *   키를 입력해주세요"] }', s3Key가 문자열이 아님 → '{ s3Key: ["S3 키는 문자열이어야
 *   합니다"] }'
 * - 400 (서비스 로직이 직접 던짐, message는 문자열 배열): S3에서 객체 본문을 못 읽음 →
 *   ['S3에서 파일을 찾을 수 없습니다.'], 빈 파일(0바이트) → ['파일이 존재하지 않습니다.']
 * - 500: S3 조회 실패, Bedrock 호출/응답 파싱 실패 등 → ['서버 오류가 발생했습니다']
 */
export const reviewBusinessRegistration = (
  body: BusinessRegistrationReviewRequest
): Promise<ApiResponse<BusinessRegistrationReviewData>> =>
  api.post<BusinessRegistrationReviewData>('/v1/file/business-registration/review', body, {
    skipAuth: true,
    timeoutMs: REVIEW_TIMEOUT_MS,
  })
