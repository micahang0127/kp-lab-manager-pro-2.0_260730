import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { signUp } from '../api/user'
import checkMarkIcon from '../assets/icons/register/check-mark.svg'
import clearCircleIcon from '../assets/icons/register/clear-circle.svg'
import radioSelectedIcon from '../assets/icons/register/radio-selected.svg'
import radioUnselectedIcon from '../assets/icons/register/radio-unselected.svg'
import uploadIcon from '../assets/icons/register/upload.svg'
import { useRegisterFlowStore } from '../stores/registerFlowStore'
import { formatDate } from '../utils/date'
import { uploadBusinessRegistration } from '../utils/uploadBusinessRegistration'

// ─── Validation ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const FILE_TYPE_ERROR_MESSAGE = 'PDF 파일만 업로드할 수 있습니다.'
const FILE_SIZE_ERROR_MESSAGE = '파일 크기는 최대 20MB까지 업로드할 수 있습니다.'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 회원가입 7단계(마지막 단계) — 조직 선택/등록 + 최종 제출.
 * 6단계(비밀번호 설정) 완료 후 진입하며, 5단계(이메일 인증) 직후 조회해둔 registerFlowStore의
 * invitedOrgs로 화면을 분기한다.
 * - 초대 조직이 있으면(invitedOrgs.length > 0): 초대받은 조직 목록 중 하나를 선택해
 *   "선택한 조직으로 가입 완료"를 누르면 orgIdx/invitedIdx로 signUp을 호출한다(기존 조직에 가입).
 * - 초대 조직이 없으면(빈 배열 또는 조회 실패로 null): 사업자등록증 PDF(최대 20MB)를 드래그하거나
 *   클릭해 선택하면 즉시 S3 업로드와 Bedrock 분석을 백그라운드로 실행하고, 법인명/사업자등록번호가
 *   확인되면 registerFlowStore에 저장한다. "새 조직으로 가입 완료" 클릭 시 regFile 등 조직 정보로
 *   signUp을 호출한다(새 조직 만들기).
 * 두 경우 모두 signUp 성공 시 registerFlowStore를 초기화한 뒤 로그인 페이지로 이동한다
 * (signUp은 토큰을 내려주지 않으므로 별도 로그인이 필요하다).
 */
export function RegisterOrganizationPage() {
  const navigate = useNavigate()
  const registerMethod = useRegisterFlowStore((s) => s.registerMethod)
  const identityVerifyResult = useRegisterFlowStore((s) => s.identityVerifyResult)
  const identityVerificationCode = useRegisterFlowStore((s) => s.identityVerificationCode)
  const termsAgreement = useRegisterFlowStore((s) => s.termsAgreement)
  const registerEmail = useRegisterFlowStore((s) => s.registerEmail)
  const registerPassword = useRegisterFlowStore((s) => s.registerPassword)
  const invitedOrgs = useRegisterFlowStore((s) => s.invitedOrgs)
  const businessRegistrationReview = useRegisterFlowStore((s) => s.businessRegistrationReview)
  const businessRegistrationS3Key = useRegisterFlowStore((s) => s.businessRegistrationS3Key)
  const setBusinessRegistrationFile = useRegisterFlowStore((s) => s.setBusinessRegistrationFile)
  const setBusinessRegistrationReview = useRegisterFlowStore((s) => s.setBusinessRegistrationReview)
  const setBusinessRegistrationS3Key = useRegisterFlowStore((s) => s.setBusinessRegistrationS3Key)
  const clearBusinessRegistrationFile = useRegisterFlowStore((s) => s.clearBusinessRegistrationFile)
  const clearBusinessRegistrationReview = useRegisterFlowStore(
    (s) => s.clearBusinessRegistrationReview
  )
  const clearBusinessRegistrationS3Key = useRegisterFlowStore(
    (s) => s.clearBusinessRegistrationS3Key
  )
  const clearRegisterMethod = useRegisterFlowStore((s) => s.clearRegisterMethod)
  const clearIdentityVerifyResult = useRegisterFlowStore((s) => s.clearIdentityVerifyResult)
  const clearIdentityVerificationCode = useRegisterFlowStore((s) => s.clearIdentityVerificationCode)
  const clearTermsAgreement = useRegisterFlowStore((s) => s.clearTermsAgreement)
  const clearRegisterEmail = useRegisterFlowStore((s) => s.clearRegisterEmail)
  const clearRegisterPassword = useRegisterFlowStore((s) => s.clearRegisterPassword)
  const clearInvitedOrgs = useRegisterFlowStore((s) => s.clearInvitedOrgs)

  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // invitedOrgs가 null(조회 실패 포함)이거나 빈 배열이면 "초대 없음"으로 간주해 새 조직 만들기
  // 화면으로 안내한다. 초대 조직이 있으면 첫 번째 항목을 기본 선택 상태로 보여준다(Figma 디자인 기준).
  const hasInvitedOrgs = !!invitedOrgs && invitedOrgs.length > 0
  // invitedOrgs는 5단계(이메일 인증)에서 이미 확정돼 이 페이지에 진입할 때 store에 채워져
  // 있으므로(마운트 이후 값이 바뀌는 시나리오가 없으므로), lazy init 이후 별도 useEffect로
  // 재동기화하지 않는다.
  const [selectedInvitedIdx, setSelectedInvitedIdx] = useState<string | null>(
    invitedOrgs?.[0]?.invitedIdx ?? null
  )
  const selectedInvite =
    invitedOrgs?.find((invite) => invite.invitedIdx === selectedInvitedIdx) ?? null

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  // 로컬 file state는 두지 않는다 — mutate()에 전달된 File은 uploadMutation.variables가
  // 이미 추적하므로, onSuccess의 두 번째 인자(variables)를 그대로 쓰면 컴포넌트 state와의
  // 클로저 어긋남 없이 항상 "지금 처리된 바로 그 파일"을 저장할 수 있다.
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadBusinessRegistration(file),
    onSuccess: ({ review, s3Key }, file) => {
      setBusinessRegistrationFile(file)
      setBusinessRegistrationReview(review)
      setBusinessRegistrationS3Key(s3Key)
    },
  })
  const uploadError = uploadMutation.error instanceof Error ? uploadMutation.error.message : null

  // signUp에 실제로 전송할 값(디버그 패널 미리보기 전용) — 두 분기의 필드를 한 객체에 모아두되,
  // 현재 분기와 무관한 필드는 undefined로 둬 JSON.stringify 시 자동으로 생략되게 한다. 실제
  // 전송(mutationFn)은 이 객체를 그대로 쓰지 않고 분기별로 다시 구성한다(선택 조직 미확정 등
  // 분기별 필수값 검증이 다르기 때문).
  const signUpRequestPreview = {
    email: registerEmail ?? undefined,
    password: registerPassword ?? undefined,
    verificationCode: identityVerificationCode ?? undefined,
    orgIdx: hasInvitedOrgs && selectedInvite ? Number(selectedInvite.orgIdx) : undefined,
    invitedIdx: hasInvitedOrgs && selectedInvite ? Number(selectedInvite.invitedIdx) : undefined,
    regFile: hasInvitedOrgs ? undefined : (businessRegistrationS3Key ?? undefined),
    orgName: hasInvitedOrgs ? undefined : (businessRegistrationReview?.corporateName ?? undefined),
    regNo: hasInvitedOrgs
      ? undefined
      : (businessRegistrationReview?.registrationNumber ?? undefined),
    ceoName: hasInvitedOrgs ? undefined : (businessRegistrationReview?.ceoName ?? undefined),
    address: hasInvitedOrgs
      ? undefined
      : (businessRegistrationReview?.businessAddress ?? undefined),
    bizItem: hasInvitedOrgs ? undefined : (businessRegistrationReview?.businessItem ?? undefined),
    bizType: hasInvitedOrgs ? undefined : (businessRegistrationReview?.businessType ?? undefined),
  }

  const signUpMutation = useMutation({
    mutationFn: () => {
      const email = registerEmail ?? undefined
      const password = registerPassword ?? undefined
      const verificationCode = identityVerificationCode ?? undefined
      if (!email || !password || !verificationCode) {
        throw new Error('회원가입에 필요한 정보가 누락되었습니다. 처음부터 다시 진행해 주세요.')
      }
      if (hasInvitedOrgs) {
        if (!selectedInvite) {
          throw new Error('가입할 조직을 선택해 주세요.')
        }
        return signUp({
          email,
          password,
          verificationCode,
          orgIdx: Number(selectedInvite.orgIdx),
          invitedIdx: Number(selectedInvite.invitedIdx),
        })
      }
      const regFile = businessRegistrationS3Key ?? undefined
      if (!regFile) {
        throw new Error('사업자등록증을 먼저 업로드해 주세요.')
      }
      return signUp({
        email,
        password,
        verificationCode,
        regFile,
        orgName: businessRegistrationReview?.corporateName ?? undefined,
        regNo: businessRegistrationReview?.registrationNumber ?? undefined,
        ceoName: businessRegistrationReview?.ceoName ?? undefined,
        address: businessRegistrationReview?.businessAddress ?? undefined,
        bizItem: businessRegistrationReview?.businessItem ?? undefined,
        bizType: businessRegistrationReview?.businessType ?? undefined,
      })
    },
    onSuccess: () => {
      // 가입 완료 후에는 회원가입 플로우 상태가 남아있을 이유가 없다 — 다음에 다시 회원가입
      // 페이지에 들어와도 이전 값이 보이지 않도록 전부 초기화한다.
      clearRegisterMethod()
      clearIdentityVerifyResult()
      clearIdentityVerificationCode()
      clearTermsAgreement()
      clearRegisterEmail()
      clearRegisterPassword()
      clearInvitedOrgs()
      clearBusinessRegistrationFile()
      clearBusinessRegistrationReview()
      clearBusinessRegistrationS3Key()
      // signUp은 토큰을 내려주지 않으므로 로그인 페이지로 이동해 별도로 로그인해야 한다.
      void navigate({ to: '/login' })
    },
  })
  const signUpError = signUpMutation.error instanceof Error ? signUpMutation.error.message : null

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const applyFile = (candidate: File | undefined) => {
    if (!candidate) return
    if (candidate.type !== 'application/pdf') {
      setError(FILE_TYPE_ERROR_MESSAGE)
      return
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setError(FILE_SIZE_ERROR_MESSAGE)
      return
    }
    setError(null)
    uploadMutation.reset()
    uploadMutation.mutate(candidate)
  }

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (uploadMutation.isPending) return
    applyFile(e.dataTransfer.files[0])
  }

  const handleRemove = () => {
    uploadMutation.reset()
    clearBusinessRegistrationFile()
    clearBusinessRegistrationReview()
    clearBusinessRegistrationS3Key()
  }

  const canSubmit = hasInvitedOrgs
    ? !!selectedInvite && !signUpMutation.isPending
    : uploadMutation.isSuccess && !signUpMutation.isPending

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    signUpMutation.mutate()
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-[336px] rounded-xl border border-[#e0e0db] bg-white px-8 py-10">
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-8">
          <h1 className="w-full text-center text-xl font-bold text-[#1a1a17]">회원가입</h1>

          {hasInvitedOrgs ? (
            <div className="flex w-full flex-col items-start gap-5">
              <p className="w-full text-xl font-bold leading-7 text-[#1a1a17]">
                가입할 조직을 확인해 주세요.
              </p>

              <div className="flex w-full flex-col items-start">
                {invitedOrgs?.map((invite) => {
                  const selected = invite.invitedIdx === selectedInvitedIdx
                  return (
                    <button
                      key={invite.invitedIdx}
                      type="button"
                      onClick={() => setSelectedInvitedIdx(invite.invitedIdx)}
                      className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left ${
                        selected ? 'border-[#fec741] bg-[#fec741]/20' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={selected ? radioSelectedIcon : radioUnselectedIcon}
                        alt=""
                        aria-hidden
                        className="size-5 shrink-0"
                      />
                      <div className="flex flex-1 flex-col items-start gap-1 text-[#1a1a17]">
                        {/* 백엔드가 UserGrade enum 전체 값을 문서화하지 않아 한글 라벨 매핑을
                            만들지 않았다 — 원본 값('MEMBER' 등)을 그대로 노출한다 */}
                        <p className="text-xs font-bold leading-[18px]">
                          {invite.orgName} · {invite.orgGrade}
                        </p>
                        <p className="text-[10px] leading-[normal] opacity-50">
                          {formatDate(invite.invitedAt)} 초대
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-start gap-5">
              <div className="flex w-full flex-col items-start gap-1 text-[#1a1a17]">
                <p className="text-xl font-bold leading-7">새 조직을 등록해 주세요.</p>
                <p className="text-xs leading-[18px]">
                  회사 정보를 등록하면 새 조직이 생성되고, 최초 가입자는 시스템 관리자로 지정됩니다.
                </p>
              </div>

              <div className="flex w-full flex-col items-start gap-1">
                {uploadMutation.isSuccess && uploadMutation.data ? (
                  <div className="flex h-20 w-full items-center gap-2 rounded-xl border border-dashed border-[#c9c9c4] bg-[#fec741]/20 px-5 py-4">
                    <div className="flex flex-1 items-center gap-3">
                      <img src={checkMarkIcon} alt="" aria-hidden className="size-7 shrink-0" />
                      <div className="flex flex-1 flex-col items-start gap-1 text-[#1a1a17]">
                        <div className="flex flex-col text-xs font-bold leading-4">
                          <p>{uploadMutation.data.review.corporateName}</p>
                          <p>{uploadMutation.data.review.registrationNumber}</p>
                        </div>
                        <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] opacity-50">
                          {uploadMutation.variables?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="사업자등록증 삭제"
                      onClick={handleRemove}
                      className="flex size-4 shrink-0 items-center justify-center"
                    >
                      <img src={clearCircleIcon} alt="" aria-hidden className="size-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-busy={uploadMutation.isPending}
                    aria-disabled={uploadMutation.isPending}
                    onClick={() => {
                      if (uploadMutation.isPending) return
                      fileInputRef.current?.click()
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (uploadMutation.isPending) return
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
                        <p className="text-xs font-bold">
                          {uploadMutation.isPending ? '확인 중...' : '사업자등록증 업로드'}
                        </p>
                        <p className="text-[10px] leading-[14px] opacity-50">
                          {uploadMutation.isPending
                            ? '사업자등록증을 확인하고 있어요...'
                            : 'PDF 파일을 드래그하거나 클릭하여 업로드해 주세요'}
                        </p>
                        {!uploadMutation.isPending && (
                          <p className="text-[10px] leading-[14px] opacity-50">최대 20MB</p>
                        )}
                      </div>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  aria-label="사업자등록증 파일 선택"
                  className="hidden"
                  onChange={(e) => applyFile(e.target.files?.[0])}
                />
                {(error ?? uploadError) && (
                  <p className="text-[10px] text-red-600">{error ?? uploadError}</p>
                )}
              </div>
            </div>
          )}

          {/* [TEMP] 26.09.02 회원가입 진행 데이터 확인용 임시 디버그 패널 — 각 단계에서 수집한 값이
              최종 제출 직전 실제로 올바르게 저장돼 있는지 눈으로 확인하기 위한 것으로, 실제 사용자에게
              보여줄 UI가 아니다. QA 확인 완료 후 제거 예정 */}
          <div className="flex w-full flex-col items-start gap-1 rounded-xl border border-dashed border-red-400 bg-red-50 p-3 text-[10px] text-red-600">
            <p className="font-bold">[임시] 회원가입 진행 데이터 확인</p>
            <p>가입 방법(registerMethod): {registerMethod ?? '-'}</p>
            <p>이메일(registerEmail): {registerEmail ?? '-'}</p>
            <p>비밀번호(registerPassword): {registerPassword ?? '-'}</p>
            <p>초대 조직(invitedOrgs): {invitedOrgs ? JSON.stringify(invitedOrgs) : '-'}</p>
            <p>본인인증 키(identityVerificationCode): {identityVerificationCode ?? '-'}</p>
            <p>
              본인인증 결과(identityVerifyResult):{' '}
              {identityVerifyResult ? JSON.stringify(identityVerifyResult) : '-'}
            </p>
            <p>
              마케팅 수신 동의(termsAgreement.marketingOptIn):{' '}
              {termsAgreement ? String(termsAgreement.marketingOptIn) : '-'}
            </p>
            <p>
              사업자등록증 분석 결과(businessRegistrationReview):{' '}
              {businessRegistrationReview ? JSON.stringify(businessRegistrationReview) : '-'}
            </p>
            <p>사업자등록증 S3 키(businessRegistrationS3Key): {businessRegistrationS3Key ?? '-'}</p>
          </div>

          {/* [TEMP] 26.09.02 signUp API로 실제 전송될 request body 미리보기 — 위 데이터들이
              최종적으로 어떤 형태로 조합돼 전송되는지 확인하기 위한 것으로, 실제 사용자에게
              보여줄 UI가 아니다. QA 확인 완료 후 제거 예정 */}
          <div className="flex w-full flex-col items-start gap-1 rounded-xl border border-dashed border-red-400 bg-red-50 p-3 text-[10px] text-red-600">
            <p className="font-bold">[임시] signUp API 요청(request) 데이터</p>
            <pre className="w-full whitespace-pre-wrap break-all font-mono">
              {JSON.stringify(signUpRequestPreview, null, 2)}
            </pre>
          </div>

          <div className="flex w-full flex-col items-start gap-5">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 w-full items-center justify-center rounded bg-[#001e43] text-sm font-medium text-white hover:bg-[#00152f] disabled:opacity-50"
            >
              {signUpMutation.isPending
                ? '가입 처리 중...'
                : hasInvitedOrgs
                  ? '선택한 조직으로 가입 완료 →'
                  : uploadMutation.isSuccess
                    ? '새 조직으로 가입 완료 →'
                    : '새 조직으로 가입 →'}
            </button>
            {signUpError && <p className="text-[10px] text-red-600">{signUpError}</p>}

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
