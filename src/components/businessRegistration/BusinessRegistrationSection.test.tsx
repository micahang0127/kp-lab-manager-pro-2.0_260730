import { useState } from 'react'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { cleanup, render, screen } from '../../test/test-utils'
import type {
  BusinessRegistrationFormValue,
  BusinessRegistrationMode,
} from './BusinessRegistrationSection'
import { BusinessRegistrationSection } from './BusinessRegistrationSection'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// 주소검색(Daum 우편번호) 컴포넌트 mock (jsdom 환경에서 팝업 렌더 불가)

vi.mock('../addressSearch', () => ({
  AddressField: ({
    id,
    label,
    address,
    onAddressChange,
    addressDetail,
    onAddressDetailChange,
    disabled,
  }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={address} disabled readOnly onChange={() => {}} />
      {!disabled && (
        <button type="button" onClick={() => onAddressChange('서울시 강남구 테헤란로 1')}>
          address-search-mock
        </button>
      )}
      <input
        aria-label="상세주소"
        value={addressDetail}
        disabled={disabled}
        onChange={(e) => onAddressDetailChange(e.target.value)}
      />
    </div>
  ),
}))

// ─── Setup ─────────────────────────────────────────────────────────────────────

const EMPTY_VALUE: BusinessRegistrationFormValue = {
  registrationFile: null,
  corporateName: '',
  representativeName: '',
  registrationNumber: '',
  address: '',
  addressDetail: '',
  businessType: '',
  businessItem: '',
}

const BUSINESS_LICENSE_FILE = new File(['dummy'], 'business-license.pdf', {
  type: 'application/pdf',
})

/** value/onChange를 컴포넌트 스스로 관리하도록 감싸는 테스트 하네스 (controlled 컴포넌트 검증용) */
function Harness({
  mode = 'create',
  disabled,
}: {
  mode?: BusinessRegistrationMode
  disabled?: boolean
}) {
  const [value, setValue] = useState<BusinessRegistrationFormValue>(EMPTY_VALUE)
  return (
    <BusinessRegistrationSection
      mode={mode}
      value={value}
      onChange={setValue}
      disabled={disabled}
    />
  )
}

afterEach(() => {
  cleanup()
})

describe('BusinessRegistrationSection', () => {
  it('사업자등록번호를 일부만 입력하면 형식 오류 안내 문구를 표시한다', async () => {
    render(<Harness />)

    await userEvent.type(screen.getByLabelText('사업자등록번호 앞 3자리'), '123')

    expect(
      await screen.findByText(/사업자등록번호는 000-00-00000 형식으로 입력해주세요./)
    ).toBeInTheDocument()
  })

  it('대표자명에 허용되지 않는 특수문자가 포함되면 형식 오류 안내 문구를 표시한다', async () => {
    render(<Harness />)

    await userEvent.type(screen.getByLabelText('대표자명'), '홍길동@대표')

    expect(
      await screen.findByText(
        "대표자명은 한글, 영문, 숫자, 공백, ().,'·/- 문자만 사용하여 2~50자로 입력해주세요."
      )
    ).toBeInTheDocument()
  })

  it('대표자명에 숫자가 포함되어도 통과한다 (공동대표 번호 표기 대응)', async () => {
    render(<Harness />)

    await userEvent.type(screen.getByLabelText('대표자명'), '1 홍길동')

    expect(
      screen.queryByText(
        "대표자명은 한글, 영문, 숫자, 공백, ().,'·/- 문자만 사용하여 2~50자로 입력해주세요."
      )
    ).not.toBeInTheDocument()
  })

  it('사업자등록증 파일명은 첨부 후 비활성화된 입력창에 표시된다', async () => {
    render(<Harness />)

    await userEvent.upload(screen.getByLabelText('사업자등록증'), BUSINESS_LICENSE_FILE)

    expect(screen.getByDisplayValue('business-license.pdf')).toBeDisabled()
  })

  it('허용되지 않는 형식의 파일을 첨부하면 오류 문구를 표시하고 파일을 저장하지 않는다', async () => {
    render(<Harness />)

    const invalidFile = new File(['dummy'], 'business-license.hwp', {
      type: 'application/x-hwp',
    })
    // userEvent.upload는 실제 브라우저 파일 선택창처럼 accept 속성으로 파일을 걸러내므로,
    // 드래그앤드롭·"모든 파일" 선택 등으로 accept 필터를 우회한 상황을 fireEvent.change로 재현한다.
    fireEvent.change(screen.getByLabelText('사업자등록증'), { target: { files: [invalidFile] } })

    expect(
      await screen.findByText(
        'PDF, JPG, PNG 파일만 첨부할 수 있으며, 최대 10MB까지 업로드할 수 있습니다.'
      )
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('선택된 파일이 없습니다.')).toBeInTheDocument()
  })

  it('용량이 상한을 초과한 파일을 첨부하면 오류 문구를 표시한다', async () => {
    render(<Harness />)

    const oversizedFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'business-license.pdf', {
      type: 'application/pdf',
    })
    await userEvent.upload(screen.getByLabelText('사업자등록증'), oversizedFile)

    expect(
      await screen.findByText(
        'PDF, JPG, PNG 파일만 첨부할 수 있으며, 최대 10MB까지 업로드할 수 있습니다.'
      )
    ).toBeInTheDocument()
  })

  it('주소검색 버튼을 클릭하면 사업장 소재지가 자동으로 입력된다', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByText('address-search-mock'))

    expect(screen.getByLabelText('사업장 소재지')).toHaveValue('서울시 강남구 테헤란로 1')
  })

  it('사업장 소재지 입력창은 주소검색으로만 채워지고 직접 수정할 수 없다', () => {
    render(<Harness />)

    expect(screen.getByLabelText('사업장 소재지')).toBeDisabled()
  })

  it("mode가 'view'이면 모든 필드가 비활성화된다", () => {
    render(<Harness mode="view" />)

    expect(screen.getByLabelText('법인명')).toBeDisabled()
    expect(screen.getByLabelText('대표자명')).toBeDisabled()
    expect(screen.getByLabelText('사업자등록번호 앞 3자리')).toBeDisabled()
    expect(screen.getByLabelText('업태')).toBeDisabled()
    expect(screen.getByLabelText('업종')).toBeDisabled()
    expect(screen.getByLabelText('상세주소')).toBeDisabled()
  })

  it("disabled prop이 true이면 mode가 'create'여도 모든 필드가 비활성화된다 (예: 제출 처리 중)", () => {
    render(<Harness mode="create" disabled />)

    expect(screen.getByLabelText('법인명')).toBeDisabled()
    expect(screen.getByLabelText('대표자명')).toBeDisabled()
    expect(screen.getByLabelText('사업자등록번호 앞 3자리')).toBeDisabled()
    expect(screen.getByLabelText('업태')).toBeDisabled()
    expect(screen.getByLabelText('업종')).toBeDisabled()
    expect(screen.getByLabelText('상세주소')).toBeDisabled()
  })

  it("disabled prop이 true여도 mode가 'create'이면 필수 안내 문구는 그대로 표시된다", () => {
    render(<Harness mode="create" disabled />)

    expect(
      screen.getByText('사업자 등록은 조직 등록을 위한 절차로, 필수 진행하셔야 합니다.')
    ).toBeInTheDocument()
  })

  it("mode가 'view'이면 사업자등록증 파일 선택 버튼이 렌더링되지 않는다", () => {
    render(<Harness mode="view" />)

    expect(screen.queryByRole('button', { name: '파일 선택' })).not.toBeInTheDocument()
  })

  it("mode가 'view'이면 주소검색 버튼이 렌더링되지 않는다", () => {
    render(<Harness mode="view" />)

    expect(screen.queryByText('address-search-mock')).not.toBeInTheDocument()
  })

  it("mode가 'create'/'edit'이면 사업자등록증 라벨 옆에 필수 안내 문구가 표시된다", () => {
    render(<Harness mode="create" />)

    expect(
      screen.getByText('사업자 등록은 조직 등록을 위한 절차로, 필수 진행하셔야 합니다.')
    ).toBeInTheDocument()
  })

  it("mode가 'view'이면 사업자등록증 라벨 옆 필수 안내 문구가 표시되지 않는다", () => {
    render(<Harness mode="view" />)

    expect(
      screen.queryByText('사업자 등록은 조직 등록을 위한 절차로, 필수 진행하셔야 합니다.')
    ).not.toBeInTheDocument()
  })

  it("mode가 'view'이면 형식 오류 안내 문구를 표시하지 않는다", async () => {
    render(<Harness mode="edit" />)
    await userEvent.type(screen.getByLabelText('대표자명'), '홍길동@대표')
    expect(
      await screen.findByText(
        "대표자명은 한글, 영문, 숫자, 공백, ().,'·/- 문자만 사용하여 2~50자로 입력해주세요."
      )
    ).toBeInTheDocument()

    cleanup()

    // view 모드는 입력 자체가 불가능하므로, 이미 유효하지 않은 값을 가진 상태에서도 문구가 억제되는지
    // 별도 하네스로 초기값을 주입해 확인한다.
    function ViewHarness() {
      const [value, setValue] = useState<BusinessRegistrationFormValue>({
        ...EMPTY_VALUE,
        representativeName: '홍길동@대표',
      })
      return <BusinessRegistrationSection mode="view" value={value} onChange={setValue} />
    }
    render(<ViewHarness />)

    expect(
      screen.queryByText(
        "대표자명은 한글, 영문, 숫자, 공백, ().,'·/- 문자만 사용하여 2~50자로 입력해주세요."
      )
    ).not.toBeInTheDocument()
  })
})
