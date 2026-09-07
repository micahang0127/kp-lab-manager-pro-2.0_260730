import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '../test/mocks/server'
import { createPresignedUploadUrl, reviewBusinessRegistration } from './file'

describe('createPresignedUploadUrl API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('성공 시 presignedUrl과 s3Key를 포함한 응답을 반환한다', async () => {
    server.use(
      http.post('*/v1/file/presigned-upload-url', () =>
        HttpResponse.json(
          {
            result: true,
            statusCode: 201,
            data: {
              urls: [
                {
                  originFileName: '사업자등록증.pdf',
                  presignedUrl: 'https://s3.example.com/bucket/key.pdf?X-Amz-Signature=abc',
                  s3Key: 'PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf',
                },
              ],
            },
            message: null,
          },
          { status: 201 }
        )
      )
    )

    const result = await createPresignedUploadUrl({
      fileType: 'BusinessRegistration',
      originFileName: ['사업자등록증.pdf'],
    })

    expect(result.data?.urls[0]?.s3Key).toBe('PRODUCTION/BusinessRegistration/260901/xxxxxxxx.pdf')
    expect(result.data?.urls[0]?.presignedUrl).toContain('https://')
  })

  it('DTO 검증 실패 시 필드별 에러 메시지로 ApiError를 던진다', async () => {
    server.use(
      http.post('*/v1/file/presigned-upload-url', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { fileType: ['올바른 파일 타입이 아닙니다'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(
      createPresignedUploadUrl({
        fileType: 'BusinessRegistration',
        originFileName: ['사업자등록증.pdf'],
      })
    ).rejects.toThrow('올바른 파일 타입이 아닙니다')
  })

  it('서버 오류 시 ApiError를 던진다', async () => {
    server.use(
      http.post('*/v1/file/presigned-upload-url', () =>
        HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류가 발생했습니다'] },
          { status: 500 }
        )
      )
    )

    await expect(
      createPresignedUploadUrl({
        fileType: 'BusinessRegistration',
        originFileName: ['사업자등록증.pdf'],
      })
    ).rejects.toThrow('서버 오류가 발생했습니다')
  })
})

describe('reviewBusinessRegistration API', () => {
  beforeEach(() => {
    sessionStorage.clear()
    server.resetHandlers()
  })

  it('8개 필드가 전부 인식되면 정상 데이터를 반환한다', async () => {
    server.use(
      http.post('*/v1/file/business-registration/review', () =>
        HttpResponse.json(
          {
            result: true,
            statusCode: 201,
            data: {
              registrationNumber: '123-45-67890',
              corporateName: '코리아석유',
              ceoName: '홍길동',
              corporateRegistrationNumber: '110111-1234567',
              businessAddress: '서울시 ...',
              businessType: '도매',
              businessItem: '석유제품',
              issueDate: '2020-01-01',
            },
            message: null,
          },
          { status: 201 }
        )
      )
    )

    const result = await reviewBusinessRegistration({ s3Key: 'PRODUCTION/xxx.pdf' })

    expect(result.data?.corporateName).toBe('코리아석유')
    expect(result.data?.registrationNumber).toBe('123-45-67890')
  })

  it('일부 필드 인식에 실패해도 result: true로 나머지 값을 그대로 반환한다', async () => {
    server.use(
      http.post('*/v1/file/business-registration/review', () =>
        HttpResponse.json(
          {
            result: true,
            statusCode: 201,
            data: {
              registrationNumber: '123-45-67890',
              corporateName: null,
              ceoName: '홍길동',
              corporateRegistrationNumber: '110111-1234567',
              businessAddress: '서울시 ...',
              businessType: '도매,소매',
              businessItem: '석유제품,윤활유',
              issueDate: '2020-01-01',
            },
            message: null,
          },
          { status: 201 }
        )
      )
    )

    const result = await reviewBusinessRegistration({ s3Key: 'PRODUCTION/xxx.pdf' })

    expect(result.result).toBe(true)
    expect(result.data?.corporateName).toBeNull()
    expect(result.data?.businessType).toBe('도매,소매')
  })

  it('DTO 검증 실패 시 필드별 에러 메시지로 ApiError를 던진다', async () => {
    server.use(
      http.post('*/v1/file/business-registration/review', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: { s3Key: ['S3 키를 입력해주세요'] },
          },
          { status: 400 }
        )
      )
    )

    await expect(reviewBusinessRegistration({ s3Key: '' })).rejects.toThrow('S3 키를 입력해주세요')
  })

  it('서비스 로직이 직접 던지는 에러(파일 없음)를 ApiError로 던진다', async () => {
    server.use(
      http.post('*/v1/file/business-registration/review', () =>
        HttpResponse.json(
          {
            result: false,
            statusCode: 400,
            data: null,
            message: ['파일이 존재하지 않습니다.'],
          },
          { status: 400 }
        )
      )
    )

    await expect(reviewBusinessRegistration({ s3Key: 'PRODUCTION/empty.pdf' })).rejects.toThrow(
      '파일이 존재하지 않습니다.'
    )
  })

  it('서버 오류 시 ApiError를 던진다', async () => {
    server.use(
      http.post('*/v1/file/business-registration/review', () =>
        HttpResponse.json(
          { result: false, statusCode: 500, data: null, message: ['서버 오류가 발생했습니다'] },
          { status: 500 }
        )
      )
    )

    await expect(reviewBusinessRegistration({ s3Key: 'PRODUCTION/xxx.pdf' })).rejects.toThrow(
      '서버 오류가 발생했습니다'
    )
  })
})
