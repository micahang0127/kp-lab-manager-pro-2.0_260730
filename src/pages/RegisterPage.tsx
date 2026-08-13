import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { VerifiedCustomer } from '../api/auth'
import { checkExistingAccount, deleteExistingAccount } from '../api/auth'
import type { SignupRequest } from '../api/user'
import { sendEmailVerificationCode, signup, verifyEmailVerificationCode } from '../api/user'
import type { BusinessRegistrationFormValue } from '../components/businessRegistration'
import { BusinessRegistrationSection } from '../components/businessRegistration'
import { FormCheckbox, FormInput, RequiredMark } from '../components/form'
import { IdentityVerificationButton } from '../components/identityVerification'
import {
  EMAIL_CODE_LENGTH,
  EMAIL_CODE_RULE_MESSAGE,
  EMAIL_MAX_LENGTH,
  EMAIL_RULE_MESSAGE,
  isValidBusinessNumber,
  isValidEmail,
  isValidEmailCode,
  isValidPassword,
  isValidRepresentativeName,
  PASSWORD_RULE_MESSAGE,
} from '../utils/rules/validationRules'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterForm {
  name: string
  phoneNumber: string
  birthDate: string
  gender: string
  email: string
  emailCode: string
  password: string
  confirmPassword: string
}

interface Agreements {
  terms: boolean
  privacy: boolean
  marketingEmail: boolean
  marketingSms: boolean
}

// ─── 약관 샘플 텍스트 ────────────────────────────────────────────────────────────
// [TEMP] 26.08.05 실제 법무 검토를 거친 약관 문구가 아님. 서비스 오픈 전 반드시 교체할 것

const TERMS_SAMPLE_TEXT =
  '(샘플) 제1조(목적) 이 약관은 KP Lab Manager(이하 "회사")가 제공하는 서비스의 이용조건 및 절차, ' +
  '회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.'

const PRIVACY_SAMPLE_TEXT =
  '(샘플) 회사는 회원가입 시 이름, 이메일, 휴대폰번호를 수집하며, 수집한 정보는 회원 식별 및 ' +
  '서비스 제공 목적으로만 이용하고 목적 달성 후 지체 없이 파기합니다.'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** 본인인증 성별 코드('M'/'F')를 한국어 표시용 문자열로 변환한다. 알려지지 않은 값은 그대로 표시한다 */
function formatGender(gender: string): string {
  if (gender === 'M') return '남성'
  if (gender === 'F') return '여성'
  return gender
}

/** 본인인증 생년월일('YYYY-MM-DD')을 화면 표시용 형식('YYYY.MM.DD')으로 변환한다 */
function formatBirthDate(birthDate: string): string {
  return birthDate.replaceAll('-', '.')
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    email: '',
    emailCode: '',
    password: '',
    confirmPassword: '',
  })

  // 본인인증 완료 여부 — 완료 시 이름/휴대폰번호/생년월일/성별은 인증된 값으로 잠김
  const [isVerified, setIsVerified] = useState(false)

  // 이메일 인증번호 발송/확인 여부
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)

  // 본인인증 처리(기존 계정 확인/삭제) 중 취소·오류 안내 문구
  const [identityVerificationNotice, setIdentityVerificationNotice] = useState<string | undefined>(
    undefined
  )

  const [agreements, setAgreements] = useState<Agreements>({
    terms: false,
    privacy: false,
    marketingEmail: false,
    marketingSms: false,
  })

  const [business, setBusiness] = useState<BusinessRegistrationFormValue>({
    registrationFile: null,
    corporateName: '',
    representativeName: '',
    registrationNumber: '',
    address: '',
    addressDetail: '',
    businessType: '',
    businessItem: '',
  })

  const [openTerms, setOpenTerms] = useState({ terms: false, privacy: false })

  const signupMutation = useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
    onSuccess: () => {
      void navigate({ to: '/login' })
    },
  })

  const sendEmailCodeMutation = useMutation({
    mutationFn: () => sendEmailVerificationCode({ email: form.email }),
    onSuccess: () => {
      setIsEmailCodeSent(true)
    },
  })

  const verifyEmailCodeMutation = useMutation({
    mutationFn: () => verifyEmailVerificationCode({ email: form.email, code: form.emailCode }),
    onSuccess: () => {
      setIsEmailVerified(true)
    },
  })

  // ─── Validation ────────────────────────────────────────────────────────────

  const isEmailInvalid = form.email.length > 0 && !isValidEmail(form.email)
  const isEmailCodeInvalid = form.emailCode.length > 0 && !isValidEmailCode(form.emailCode)
  const isPasswordInvalid = form.password.length > 0 && !isValidPassword(form.password)
  const isConfirmMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password
  const isAllAgreed =
    agreements.terms && agreements.privacy && agreements.marketingEmail && agreements.marketingSms

  const canSubmit =
    isVerified &&
    form.name.trim().length > 0 &&
    form.phoneNumber.trim().length > 0 &&
    form.birthDate.trim().length > 0 &&
    form.gender.trim().length > 0 &&
    isValidEmail(form.email) &&
    isEmailVerified &&
    isValidPassword(form.password) &&
    form.password === form.confirmPassword &&
    business.registrationFile !== null &&
    business.corporateName.trim().length > 0 &&
    isValidRepresentativeName(business.representativeName) &&
    isValidBusinessNumber(business.registrationNumber) &&
    business.address.trim().length > 0 &&
    business.businessType.trim().length > 0 &&
    business.businessItem.trim().length > 0 &&
    agreements.terms &&
    agreements.privacy &&
    !signupMutation.isPending

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  const handleToggleAll = (checked: boolean) => {
    setAgreements({
      terms: checked,
      privacy: checked,
      marketingEmail: checked,
      marketingSms: checked,
    })
  }

  /** 본인인증 성공 시 기존 가입 계정 존재 여부를 확인하고, 있으면 재가입 진행 여부를 확인받는다 */
  const handleVerified = async (customer: VerifiedCustomer) => {
    setIdentityVerificationNotice(undefined)
    try {
      const checkRes = await checkExistingAccount({ ci: customer.ci })
      if (checkRes.data.exists) {
        const shouldContinue = window.confirm(
          '기존 가입한 계정이 존재합니다. \n 기존 계정을 삭제하고, 가입을 계속 진행하시겠습니까?'
        )
        if (!shouldContinue) {
          setIdentityVerificationNotice(
            '회원가입이 취소되었습니다. 계속하려면 본인인증을 다시 진행해주세요.'
          )
          return
        }
        await deleteExistingAccount({ ci: customer.ci })
      }

      // 사전에 입력되어 있던 값은 모두 지우고 인증된 값으로 다시 채운다 (이메일은 제외)
      setForm((f) => ({
        ...f,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        birthDate: formatBirthDate(customer.birthDate),
        gender: formatGender(customer.gender),
      }))
      setIsVerified(true)
    } catch (err) {
      setIdentityVerificationNotice(
        err instanceof Error ? err.message : '본인인증 처리 중 오류가 발생했습니다.'
      )
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return

    // 백엔드가 사업장 소재지를 단일 문자열 필드로만 받으므로, 상세주소가 있으면 뒤에 이어 붙여 전송한다.
    const businessAddress = business.addressDetail.trim()
      ? `${business.address} ${business.addressDetail.trim()}`
      : business.address

    const body: SignupRequest = {
      email: form.email,
      password: form.password,
      name: form.name,
      phoneNumber: form.phoneNumber,
      agreeTerms: agreements.terms,
      agreePrivacy: agreements.privacy,
      agreeMarketingEmail: agreements.marketingEmail,
      agreeMarketingSms: agreements.marketingSms,
      corporateName: business.corporateName,
      representativeName: business.representativeName,
      businessRegistrationNumber: business.registrationNumber,
      businessAddress,
      businessType: business.businessType,
      businessItem: business.businessItem,
      // [NOTE] business.registrationFile(사업자등록증)은 API로 전송하지 않음(사용자 확정) — canSubmit에서 첨부 여부만 검증
    }
    signupMutation.mutate(body)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const signupErrors = signupMutation.error instanceof Error ? [signupMutation.error.message] : []
  const emailCodeSendError =
    sendEmailCodeMutation.error instanceof Error ? sendEmailCodeMutation.error.message : undefined
  const emailCodeVerifyError =
    verifyEmailCodeMutation.error instanceof Error
      ? verifyEmailCodeMutation.error.message
      : undefined

  return (
    <section className="mx-auto w-full max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">회원가입</h1>

      {signupErrors.length > 0 && (
        <ul className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {signupErrors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <span className="mb-1 flex items-center text-sm font-medium text-gray-700">
            핸드폰인증
            <RequiredMark />
          </span>
          <IdentityVerificationButton
            onVerified={(customer) => {
              void handleVerified(customer)
            }}
          />
          {identityVerificationNotice && (
            <p className="mt-2 text-xs text-red-600">{identityVerificationNotice}</p>
          )}
        </div>

        <FormInput
          id="name"
          label="이름"
          required
          disabled
          placeholder="본인 인증이 필요합니다."
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />

        <FormInput
          id="phoneNumber"
          label="휴대폰번호"
          type="tel"
          required
          disabled
          placeholder="본인 인증이 필요합니다."
          value={form.phoneNumber}
          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
        />

        <FormInput
          id="birthDate"
          label="생년월일"
          required
          disabled
          placeholder="본인 인증이 필요합니다."
          value={form.birthDate}
          onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
        />

        <FormInput
          id="gender"
          label="성별"
          required
          disabled
          placeholder="본인 인증이 필요합니다."
          value={form.gender}
          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
        />

        <FormInput
          id="email"
          label="이메일"
          type="email"
          required
          disabled={isEmailVerified || signupMutation.isPending}
          maxLength={EMAIL_MAX_LENGTH}
          value={form.email}
          onChange={(e) => {
            const email = e.target.value
            setForm((f) => ({ ...f, email, emailCode: '' }))
            setIsEmailCodeSent(false)
            setIsEmailVerified(false)
            sendEmailCodeMutation.reset()
            verifyEmailCodeMutation.reset()
          }}
          message={
            isEmailInvalid
              ? EMAIL_RULE_MESSAGE
              : (emailCodeSendError ??
                (isEmailCodeSent && !isEmailVerified
                  ? '인증번호가 발송되었습니다. 이메일을 확인해주세요.'
                  : undefined))
          }
          messageColor={isEmailInvalid || emailCodeSendError ? 'red' : 'green'}
          addon={
            <button
              type="button"
              disabled={
                !isValidEmail(form.email) ||
                isEmailVerified ||
                sendEmailCodeMutation.isPending ||
                signupMutation.isPending
              }
              onClick={() => sendEmailCodeMutation.mutate()}
              className="shrink-0 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {sendEmailCodeMutation.isPending ? '발송 중...' : '인증번호 보내기'}
            </button>
          }
        />

        <FormInput
          id="emailCode"
          label="이메일 인증번호"
          required
          disabled={!isEmailCodeSent || isEmailVerified || signupMutation.isPending}
          placeholder="인증번호 6자리를 입력하세요"
          maxLength={EMAIL_CODE_LENGTH}
          inputMode="numeric"
          value={form.emailCode}
          onChange={(e) => setForm((f) => ({ ...f, emailCode: e.target.value.replace(/\D/g, '') }))}
          message={
            isEmailVerified
              ? '이메일 인증이 완료되었습니다.'
              : (emailCodeVerifyError ?? (isEmailCodeInvalid ? EMAIL_CODE_RULE_MESSAGE : undefined))
          }
          messageColor={isEmailVerified ? 'green' : 'red'}
          addon={
            <button
              type="button"
              disabled={
                !isValidEmailCode(form.emailCode) ||
                isEmailVerified ||
                verifyEmailCodeMutation.isPending ||
                signupMutation.isPending
              }
              onClick={() => verifyEmailCodeMutation.mutate()}
              className="shrink-0 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {verifyEmailCodeMutation.isPending ? '확인 중...' : '확인'}
            </button>
          }
        />

        <FormInput
          id="password"
          label="비밀번호"
          type="password"
          required
          disabled={signupMutation.isPending}
          maxLength={64}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          message={isPasswordInvalid ? PASSWORD_RULE_MESSAGE : undefined}
        />

        <FormInput
          id="confirmPassword"
          label="비밀번호 확인"
          type="password"
          required
          disabled={signupMutation.isPending}
          maxLength={64}
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          message={isConfirmMismatch ? '비밀번호가 일치하지 않습니다.' : undefined}
        />

        <BusinessRegistrationSection
          mode="create"
          value={business}
          onChange={setBusiness}
          disabled={signupMutation.isPending}
        />

        {/* 약관동의 */}
        <div className="space-y-3 rounded border border-gray-200 p-3">
          <div className="border-b border-gray-200 pb-2">
            <FormCheckbox
              id="agree-all"
              label="전체 동의"
              checked={isAllAgreed}
              onChange={handleToggleAll}
              disabled={signupMutation.isPending}
              labelClassName="text-sm font-medium text-gray-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FormCheckbox
                id="agree-terms"
                label="(필수) 이용약관 동의"
                checked={agreements.terms}
                onChange={(checked) => setAgreements((a) => ({ ...a, terms: checked }))}
                disabled={signupMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setOpenTerms((o) => ({ ...o, terms: !o.terms }))}
                className="text-xs text-indigo-600 hover:underline"
              >
                {openTerms.terms ? '닫기' : '약관보기'}
              </button>
            </div>
            {openTerms.terms && (
              <p className="mt-2 max-h-28 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-500">
                {TERMS_SAMPLE_TEXT}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FormCheckbox
                id="agree-privacy"
                label="(필수) 개인정보 수집 및 이용 안내 동의"
                checked={agreements.privacy}
                onChange={(checked) => setAgreements((a) => ({ ...a, privacy: checked }))}
                disabled={signupMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setOpenTerms((o) => ({ ...o, privacy: !o.privacy }))}
                className="text-xs text-indigo-600 hover:underline"
              >
                {openTerms.privacy ? '닫기' : '약관보기'}
              </button>
            </div>
            {openTerms.privacy && (
              <p className="mt-2 max-h-28 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-500">
                {PRIVACY_SAMPLE_TEXT}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-700">[선택] 마케팅 정보 수신 동의</p>
            <div className="mt-1 flex gap-4 pl-1">
              <FormCheckbox
                id="agree-marketing-email"
                label="이메일 수신"
                checked={agreements.marketingEmail}
                onChange={(checked) => setAgreements((a) => ({ ...a, marketingEmail: checked }))}
                disabled={signupMutation.isPending}
                labelClassName="text-sm text-gray-600"
              />
              <FormCheckbox
                id="agree-marketing-sms"
                label="SMS 수신"
                checked={agreements.marketingSms}
                onChange={(checked) => setAgreements((a) => ({ ...a, marketingSms: checked }))}
                disabled={signupMutation.isPending}
                labelClassName="text-sm text-gray-600"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {signupMutation.isPending ? '가입 중...' : '회원가입'}
        </button>
        <button
          type="button"
          onClick={() => {
            void navigate({ to: '/login' })
          }}
          className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          로그인으로 돌아가기
        </button>
      </form>
    </section>
  )
}
