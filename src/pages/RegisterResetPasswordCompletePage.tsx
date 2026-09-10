import { useNavigate } from '@tanstack/react-router'

import { AuthCardLayout } from '../components/auth'

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * 비밀번호 재설정 성공 화면 (Figma node-id=684-3529 기준).
 * RegisterResetPasswordPage에서 비밀번호 재설정 API 성공 후 이 화면으로 이동한다.
 * [TEMP] 아니지만 참고: Figma 디자인의 80x80 아이콘 프레임은 실제 벡터 데이터 없이 빈 이미지로만
 * 내려와(디자인 파일 쪽 에셋 누락) 아이콘 없이 텍스트 + 뒤로가기 링크만 구현했다.
 */
export function RegisterResetPasswordCompletePage() {
  const navigate = useNavigate()

  return (
    <AuthCardLayout title="비밀번호 설정 완료" titleAs="p" align="center">
      <div className="flex w-full items-center justify-between text-xs font-medium text-[#1a1a17]">
        <button
          type="button"
          onClick={() => {
            void navigate({ to: '/login' })
          }}
          className="opacity-50"
        >
          ← 로그인으로 돌아가기
        </button>
      </div>
    </AuthCardLayout>
  )
}
