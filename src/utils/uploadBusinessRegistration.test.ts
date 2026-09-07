import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BusinessRegistrationReviewData } from '../api/file'
import { createPresignedUploadUrl, reviewBusinessRegistration } from '../api/file'
import { uploadBusinessRegistration } from './uploadBusinessRegistration'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../api/file', () => ({
  createPresignedUploadUrl: vi.fn(),
  reviewBusinessRegistration: vi.fn(),
}))

const createPdfFile = (name = '사업자등록증.pdf') =>
  new File([new Uint8Array(1024)], name, {
    type: 'application/pdf',
  })

const fullReview: BusinessRegistrationReviewData = {
  registrationNumber: '123-45-67890',
  corporateName: '코리아석유',
  ceoName: '홍길동',
  corporateRegistrationNumber: '110111-1234567',
  businessAddress: '서울시 ...',
  businessType: '도매',
  businessItem: '석유제품',
  issueDate: '2020-01-01',
}

const mockPresignedSuccess = (s3Key = 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf') => {
  vi.mocked(createPresignedUploadUrl).mockResolvedValue({
    result: true,
    statusCode: 201,
    data: {
      urls: [
        {
          originFileName: '사업자등록증.pdf',
          presignedUrl: 'https://s3.example.com/bucket/key.pdf?X-Amz-Signature=abc',
          s3Key,
        },
      ],
    },
    message: null,
  })
}

describe('uploadBusinessRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('업로드~분석에 성공하면 review와 s3Key를 반환한다', async () => {
    mockPresignedSuccess()
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }))
    vi.mocked(reviewBusinessRegistration).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: fullReview,
      message: null,
    })

    const result = await uploadBusinessRegistration(createPdfFile())

    expect(result.review).toEqual(fullReview)
    expect(result.s3Key).toBe('PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf')
    expect(fetch).toHaveBeenCalledWith(
      'https://s3.example.com/bucket/key.pdf?X-Amz-Signature=abc',
      expect.objectContaining({ method: 'PUT', headers: { 'Content-Type': 'application/pdf' } })
    )
  })

  it('presigned URL 발급에 실패하면 에러를 던진다', async () => {
    vi.mocked(createPresignedUploadUrl).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: { urls: [] },
      message: null,
    })

    await expect(uploadBusinessRegistration(createPdfFile())).rejects.toThrow(
      '업로드 URL 발급에 실패했습니다.'
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('S3 업로드가 실패하면(ok: false) 에러를 던진다', async () => {
    mockPresignedSuccess()
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 403 }))

    await expect(uploadBusinessRegistration(createPdfFile())).rejects.toThrow(
      '파일 업로드에 실패했습니다.'
    )
    expect(reviewBusinessRegistration).not.toHaveBeenCalled()
  })

  it('S3 업로드가 타임아웃(AbortError)되면 시간 초과 안내 메시지를 던진다', async () => {
    mockPresignedSuccess()
    // 실제 fetch(Node/브라우저 네이티브 구현)가 던지는 AbortError는 Error를 상속한 DOMException이다.
    // jsdom이 자체 제공하는 전역 DOMException은 Error를 상속하지 않아 이를 그대로 쓰면 실제 런타임
    // 동작과 어긋나므로, name만 'AbortError'로 지정한 일반 Error로 시뮬레이션한다
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    vi.mocked(fetch).mockRejectedValue(abortError)

    await expect(uploadBusinessRegistration(createPdfFile())).rejects.toThrow(
      '파일 업로드 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    )
  })

  it('S3 업로드가 타임아웃이 아닌 네트워크 오류로 실패하면 일반 오류 메시지를 던진다', async () => {
    mockPresignedSuccess()
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(uploadBusinessRegistration(createPdfFile())).rejects.toThrow(
      '파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    )
  })

  it('법인명 또는 사업자등록번호를 인식하지 못하면 재업로드 에러를 던진다', async () => {
    mockPresignedSuccess()
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }))
    vi.mocked(reviewBusinessRegistration).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: { ...fullReview, corporateName: null },
      message: null,
    })

    await expect(uploadBusinessRegistration(createPdfFile())).rejects.toThrow(
      '사업자등록증을 인식할 수 없습니다. 다시 업로드해주세요.'
    )
  })

  it('법인명·사업자등록번호 외 다른 필드만 null이면 정상 성공 처리한다', async () => {
    mockPresignedSuccess()
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }))
    vi.mocked(reviewBusinessRegistration).mockResolvedValue({
      result: true,
      statusCode: 201,
      data: { ...fullReview, ceoName: null, businessAddress: null },
      message: null,
    })

    const result = await uploadBusinessRegistration(createPdfFile())

    expect(result.review.corporateName).toBe('코리아석유')
    expect(result.review.ceoName).toBeNull()
  })
})
