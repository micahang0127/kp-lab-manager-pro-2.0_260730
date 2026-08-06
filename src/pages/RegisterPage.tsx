import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { SignupRequest } from '../api/user'
import { signup } from '../api/user'
import type { BusinessRegistrationFormValue } from '../components/businessRegistration'
import { BusinessRegistrationSection } from '../components/businessRegistration'
import { FormInput } from '../components/form'
import { IdentityVerificationButton } from '../components/identityVerification'
import {
  EMAIL_RULE_MESSAGE,
  isValidBusinessNumber,
  isValidEmail,
  isValidPassword,
  isValidRepresentativeName,
  PASSWORD_RULE_MESSAGE,
} from '../utils/rules/validationRules'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterForm {
  name: string
  email: string
  phoneNumber: string
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

// ─── Component ─────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  })

  // 핸드폰인증 완료 여부 — 완료 시 이름/휴대폰번호는 인증된 값으로 잠김
  const [isVerified, setIsVerified] = useState(false)

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

  // ─── Validation ────────────────────────────────────────────────────────────

  const isEmailInvalid = form.email.length > 0 && !isValidEmail(form.email)
  const isPasswordInvalid = form.password.length > 0 && !isValidPassword(form.password)
  const isConfirmMismatch =
    form.confirmPassword.length > 0 && form.confirmPassword !== form.password
  const isAllAgreed =
    agreements.terms && agreements.privacy && agreements.marketingEmail && agreements.marketingSms

  const canSubmit =
    isVerified &&
    form.name.trim().length > 0 &&
    isValidEmail(form.email) &&
    form.phoneNumber.trim().length > 0 &&
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
          <span className="mb-1 block text-sm font-medium text-gray-700">핸드폰인증</span>
          <IdentityVerificationButton
            onVerified={(customer) => {
              // 사전에 입력되어 있던 값은 모두 지우고 인증된 값으로 다시 채운다 (이메일은 제외)
              setForm((f) => ({
                ...f,
                name: customer.name,
                phoneNumber: customer.phoneNumber,
              }))
              setIsVerified(true)
            }}
          />
        </div>

        <FormInput
          id="phoneNumber"
          label="휴대폰번호"
          type="tel"
          required
          disabled={isVerified}
          value={form.phoneNumber}
          onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
        />

        <FormInput
          id="name"
          label="이름"
          required
          disabled={isVerified}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />

        <FormInput
          id="email"
          label="이메일"
          type="email"
          required
          maxLength={254}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          message={isEmailInvalid ? EMAIL_RULE_MESSAGE : undefined}
        />

        <FormInput
          id="password"
          label="비밀번호"
          type="password"
          required
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
          maxLength={64}
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          message={isConfirmMismatch ? '비밀번호가 일치하지 않습니다.' : undefined}
        />

        <BusinessRegistrationSection mode="create" value={business} onChange={setBusiness} />

        {/* 약관동의 */}
        <div className="space-y-3 rounded border border-gray-200 p-3">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <input
              id="agree-all"
              type="checkbox"
              checked={isAllAgreed}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="agree-all" className="text-sm font-medium text-gray-900">
              전체 동의
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={(e) => setAgreements((a) => ({ ...a, terms: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="agree-terms" className="text-sm text-gray-700">
                  (필수) 이용약관 동의
                </label>
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  id="agree-privacy"
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={(e) => setAgreements((a) => ({ ...a, privacy: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="agree-privacy" className="text-sm text-gray-700">
                  (필수) 개인정보 수집 및 이용 안내 동의
                </label>
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  id="agree-marketing-email"
                  type="checkbox"
                  checked={agreements.marketingEmail}
                  onChange={(e) =>
                    setAgreements((a) => ({ ...a, marketingEmail: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="agree-marketing-email" className="text-sm text-gray-600">
                  이메일 수신
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="agree-marketing-sms"
                  type="checkbox"
                  checked={agreements.marketingSms}
                  onChange={(e) => setAgreements((a) => ({ ...a, marketingSms: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="agree-marketing-sms" className="text-sm text-gray-600">
                  SMS 수신
                </label>
              </div>
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
