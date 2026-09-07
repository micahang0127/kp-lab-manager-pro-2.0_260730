import type { ChangeEvent, CompositionEvent } from 'react'
import { useRef, useState } from 'react'

import { containsHangul, removeHangul } from './rules/validationRules'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseHangulGuardedInputOptions {
  /** 한글 제거 후 값에 추가로 적용할 정제 함수 (예: 비밀번호의 공백·특정 특수문자 제거).
   *  생략하면 한글만 제거한 값을 그대로 전달한다 */
  sanitize?: (value: string) => string
  /** 한글이 제거된 최종 값을 전달받는다 */
  onChange: (value: string) => void
}

interface UseHangulGuardedInputResult {
  /** 한글(한글 키보드) 입력을 시도했는지 여부 — 안내 문구 표시 등에 사용 */
  hasHangulInput: boolean
  /** input의 onChange에 그대로 연결한다 */
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void
  /** input의 onCompositionStart에 그대로 연결한다 */
  handleCompositionStart: () => void
  /** input의 onCompositionEnd에 그대로 연결한다 */
  handleCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * 한글 입력을 허용하지 않는 입력칸(이메일·비밀번호 등)에서 공통으로 쓰는 훅.
 *
 * 한글(IME) 조합 중 실제로 한글이 입력되고 있을 때는 매 키 입력마다 값을 건드리지 않는다 —
 * 조합 중에 컨트롤드 input의 값을 강제로 바꾸면 브라우저의 IME 조합이 깨지면서, 방금 누른 키에
 * 대응하는 영문자가 그대로 커밋되어 버리는 문제가 있다(2벌식 자판은 자모 하나하나가 물리적으로는
 * 영문 키와 동일한 위치이므로, 조합이 취소되면 그 영문 글자가 대신 입력된 것처럼 보인다). 이를
 * 피하기 위해:
 * - 조합 중(onChange, isComposing)에 현재까지 조합된 값(e.target.value)에 실제 한글이 포함된
 *   경우에만 안내 상태를 켜고 값 반영을 건너뛴다 — compositionend를 기다리지 않고도 즉시
 *   안내할 수 있다
 * - 조합이 끝나면(onCompositionEnd) 최종 문자열에서 한글을 제거해 반영한다
 *
 * 일부 브라우저/입력기 조합에서는 영문 입력 중에도 compositionstart/end 이벤트가 발생한다
 * (예: 한글 IME가 영문 모드로 전환되어 있어도 조합 이벤트 자체는 발생하는 경우). 조합이
 * 시작된 시점만으로는 한글 여부를 알 수 없으므로, compositionstart 자체는 안내 상태를 건드리지
 * 않는다 — 그렇지 않으면 영문 입력 중에도 "한글 입력불가" 문구가 뜨고 값이 반영되지 않는
 * 문제가 생긴다. 판별은 항상 실제 값이 확인 가능한 onChange/onCompositionEnd에서 이뤄진다.
 *
 * IME를 거치지 않는 붙여넣기 등은 조합 상태가 아니므로 onChange에서 바로 처리된다.
 */
export function useHangulGuardedInput({
  sanitize,
  onChange,
}: UseHangulGuardedInputOptions): UseHangulGuardedInputResult {
  const [hasHangulInput, setHasHangulInput] = useState(false)
  // 조합 중 여부 — 리렌더링과 무관하게 이벤트 핸들러 사이에서 최신 값을 즉시 참조해야 하므로
  // state가 아닌 ref로 관리한다
  const isComposingRef = useRef(false)

  const commit = (rawValue: string) => {
    setHasHangulInput(containsHangul(rawValue))
    const withoutHangul = removeHangul(rawValue)
    onChange(sanitize ? sanitize(withoutHangul) : withoutHangul)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    if (isComposingRef.current && containsHangul(rawValue)) {
      // 조합 중인 값 자체에 한글이 있을 때만 안내 상태를 켜고 값 반영은 미룬다 — 조합 중에도
      // e.target.value에는 현재까지 조합된 문자가 그대로 담기므로, 여기서 바로 판별해 안내
      // 문구를 즉시 띄울 수 있다(compositionend까지 기다릴 필요 없음)
      setHasHangulInput(true)
      return
    }
    commit(rawValue)
  }

  const handleCompositionStart = () => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false
    commit(e.currentTarget.value)
  }

  return { hasHangulInput, handleChange, handleCompositionStart, handleCompositionEnd }
}
