import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import uploadIcon from '../assets/icons/register/upload.svg'
import { useRegisterFlowStore } from '../stores/registerFlowStore'

// ─── Validation ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const FILE_TYPE_ERROR_MESSAGE = 'PDF 파일만 업로드할 수 있습니다.'
const FILE_SIZE_ERROR_MESSAGE = '파일 크기는 최대 20MB까지 업로드할 수 있습니다.'

/** 바이트 단위 파일 크기를 'N.N MB' 형식으로 변환 */
function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 7단계 — 새 조직 등록 (사업자등록증 업로드).
 * 6단계(비밀번호 설정) 완료 후, registerMethod가 'new'(새 조직 만들기)인 경우에만 진입한다.
 * 사업자등록증 PDF(최대 20MB)를 드래그하거나 클릭해 업로드하면 registerFlowStore에 저장한다.
 */
export function RegisterOrganizationPage() {
  const navigate = useNavigate()
  const setBusinessRegistrationFile = useRegisterFlowStore((s) => s.setBusinessRegistrationFile)

  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applyFile = (candidate: File | undefined) => {
    if (!candidate) return
    if (candidate.type !== 'application/pdf') {
      setError(FILE_TYPE_ERROR_MESSAGE)
      setFile(null)
      return
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setError(FILE_SIZE_ERROR_MESSAGE)
      setFile(null)
      return
    }
    setError(null)
    setFile(candidate)
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    applyFile(e.dataTransfer.files[0])
  }

  const canSubmit = Boolean(file)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setBusinessRegistrationFile(file)
    // [TEMP] 26.08.25 8단계(회원가입 최종 제출) Figma 디자인 및 새 조직 등록 API가 아직 없어
    // 이동 로직은 보류. 디자인/API가 나오면 businessRegistrationFile을 포함해 최종 제출
    // 단계로 라우팅을 연결한다.
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          <div className="flex w-full flex-col items-start gap-5">
            <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
              <p className="text-xl font-bold leading-7">새 조직을 등록해 주세요.</p>
              <p className="text-xs leading-[18px]">
                회사 정보를 등록하면 새 조직이 생성되고, 최초 가입자는 시스템 관리자로 지정됩니다.
              </p>
            </div>

            <div className="flex w-full flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex h-20 w-full items-center rounded-xl border border-dashed px-5 py-4 text-left ${
                  isDragOver ? 'border-[#001e43] bg-[#f4f4f3]' : 'border-[#c9c9c4] bg-white'
                }`}
              >
                <div className="flex flex-1 items-center gap-3">
                  <img src={uploadIcon} alt="" aria-hidden className="size-7 shrink-0" />
                  <div className="flex flex-col items-start gap-1 text-[#1a1a17]">
                    <p className="text-xs font-bold">{file ? file.name : '사업자등록증 업로드'}</p>
                    <p className="text-[10px] leading-[14px] opacity-50">
                      {file
                        ? `${formatFileSize(file.size)} · 다시 선택하려면 클릭하세요`
                        : 'PDF 파일을 드래그하거나 클릭하여 업로드해 주세요'}
                    </p>
                    {!file && <p className="text-[10px] leading-[14px] opacity-50">최대 20MB</p>}
                  </div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                aria-label="사업자등록증 파일 선택"
                className="hidden"
                onChange={(e) => applyFile(e.target.files?.[0])}
              />
              {error && <p className="text-[10px] text-red-600">{error}</p>}
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f] disabled:opacity-50"
            >
              새 조직으로 가입 →
            </button>

            <div className="flex w-full items-center justify-between text-xs font-medium text-[#1a1a17]">
              <button
                type="button"
                onClick={() => {
                  void navigate({ to: '/register-password' })
                }}
                className="opacity-50"
              >
                ← 이전
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
