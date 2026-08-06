// ─── Types ────────────────────────────────────────────────────────────────────

/** 하단 안내/에러 메시지 색상. 필요 시 여기에 색상을 추가한다. */
export type FormInputMessageColor = 'red' | 'green' | 'gray'

// ─── Styles ────────────────────────────────────────────────────────────────────
// FormInput/BusinessNumberInput/FormFileInput이 공통으로 사용하는 message 색상 클래스.
// (컴포넌트 파일은 컴포넌트만 export해야 하는 react-refresh/only-export-components 규칙 때문에 별도 파일로 분리)

export const MESSAGE_COLOR_CLASS_NAME: Record<FormInputMessageColor, string> = {
  red: 'text-red-600',
  green: 'text-green-600',
  gray: 'text-gray-500',
}
