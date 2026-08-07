import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'

import {
  BUSINESS_NUMBER_RULE_MESSAGE,
  BUSINESS_REGISTRATION_FILE_ACCEPT,
  BUSINESS_REGISTRATION_FILE_RULE_MESSAGE,
  isValidBusinessNumber,
  isValidBusinessRegistrationFile,
  isValidRepresentativeName,
  REPRESENTATIVE_NAME_RULE_MESSAGE,
} from '../../utils/rules/validationRules'
import { AddressField } from '../addressSearch'
import { BusinessNumberInput, FormFileInput, FormInput } from '../form'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BusinessRegistrationMode = 'create' | 'view' | 'edit'

export interface BusinessRegistrationFormValue {
  registrationFile: File | null
  corporateName: string
  representativeName: string
  registrationNumber: string
  address: string
  addressDetail: string
  businessType: string // 업태
  businessItem: string // 업종
}

interface BusinessRegistrationSectionProps {
  /** 'view'면 전체 필드가 잠기고 검증 안내 문구도 표시하지 않는다 */
  mode: BusinessRegistrationMode
  value: BusinessRegistrationFormValue
  onChange: Dispatch<SetStateAction<BusinessRegistrationFormValue>>
  /** 섹션 상단 제목 (기본값 '사업자등록 정보') */
  title?: string
  /** true면 mode와 무관하게 전체 필드를 잠근다 (예: 회원가입 요청 처리 중). 검증 안내 문구 표시 여부는 mode를 그대로 따른다 */
  disabled?: boolean
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 사업자등록 정보(사업자등록증 첨부, 법인명, 대표자명, 사업자등록번호, 사업장 소재지, 업태, 업종)를
 * 입력·조회·수정하는 공통 섹션. 회원가입(create), 마이페이지 조회(view), 마이페이지 수정(edit)에서
 * 재사용한다. view 모드에서는 모든 필드가 잠기고 검증 안내 문구도 노출하지 않는다.
 */
export function BusinessRegistrationSection({
  mode,
  value,
  onChange,
  title = '사업자등록 정보',
  disabled = false,
}: BusinessRegistrationSectionProps) {
  const isDisabled = mode === 'view' || disabled

  // 사업자등록증 첨부파일 형식·용량 오류 안내. registrationFile은 유효한 파일만 저장되므로 별도 상태로 관리한다.
  const [fileError, setFileError] = useState<string | undefined>(undefined)

  const isBusinessNumberInvalid =
    value.registrationNumber.length > 0 && !isValidBusinessNumber(value.registrationNumber)
  const isRepresentativeNameInvalid =
    value.representativeName.length > 0 && !isValidRepresentativeName(value.representativeName)

  return (
    <div className="space-y-4 rounded border border-gray-200 p-3">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>

      <FormFileInput
        id="businessRegistrationFile"
        label="사업자등록증"
        required
        disabled={isDisabled}
        accept={BUSINESS_REGISTRATION_FILE_ACCEPT}
        file={value.registrationFile}
        onChange={(file) => {
          if (file && !isValidBusinessRegistrationFile(file)) {
            setFileError(BUSINESS_REGISTRATION_FILE_RULE_MESSAGE)
            onChange((v) => ({ ...v, registrationFile: null }))
            return
          }
          setFileError(undefined)
          onChange((v) => ({ ...v, registrationFile: file }))
        }}
        labelDescription={
          mode !== 'view'
            ? '사업자 등록은 조직 등록을 위한 절차로, 필수 진행하셔야 합니다.'
            : undefined
        }
        message={mode !== 'view' ? fileError : undefined}
      />

      <FormInput
        id="corporateName"
        label="법인명"
        required
        disabled={isDisabled}
        maxLength={100}
        value={value.corporateName}
        onChange={(e) => onChange((v) => ({ ...v, corporateName: e.target.value }))}
      />

      <FormInput
        id="representativeName"
        label="대표자명"
        required
        disabled={isDisabled}
        maxLength={50}
        value={value.representativeName}
        onChange={(e) => onChange((v) => ({ ...v, representativeName: e.target.value }))}
        message={
          mode !== 'view' && isRepresentativeNameInvalid
            ? REPRESENTATIVE_NAME_RULE_MESSAGE
            : undefined
        }
      />

      <BusinessNumberInput
        id="businessRegistrationNumber"
        label="사업자등록번호"
        required
        disabled={isDisabled}
        value={value.registrationNumber}
        onChange={(registrationNumber) => onChange((v) => ({ ...v, registrationNumber }))}
        message={
          mode !== 'view' && isBusinessNumberInvalid ? BUSINESS_NUMBER_RULE_MESSAGE : undefined
        }
      />

      <AddressField
        id="businessAddress"
        label="사업장 소재지"
        required
        disabled={isDisabled}
        address={value.address}
        onAddressChange={(address) => onChange((v) => ({ ...v, address }))}
        addressDetail={value.addressDetail}
        onAddressDetailChange={(addressDetail) => onChange((v) => ({ ...v, addressDetail }))}
      />

      <FormInput
        id="businessType"
        label="업태"
        required
        disabled={isDisabled}
        maxLength={50}
        value={value.businessType}
        onChange={(e) => onChange((v) => ({ ...v, businessType: e.target.value }))}
      />

      <FormInput
        id="businessItem"
        label="업종"
        required
        disabled={isDisabled}
        maxLength={50}
        value={value.businessItem}
        onChange={(e) => onChange((v) => ({ ...v, businessItem: e.target.value }))}
      />
    </div>
  )
}
