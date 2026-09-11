import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginDeviceVerificationPage } from '../pages/LoginDeviceVerificationPage'
import { useLoginFlowStore } from '../stores/loginFlowStore'
import { redirectIfAuthenticated } from '../utils/requireAuth'

// 디렉토리 중첩(`login/verify.tsx`)이 아니라 플랫 네이밍을 쓰는 이유: TanStack Router는
// 파일 위치가 아니라 라우트 경로 문자열 기준으로 부모를 찾으므로, `/login`이 이미 등록된
// 라우트인 상태에서 `login/verify.tsx`(경로 `/login/verify`)를 만들면 `/login`이 자동으로
// 부모 레이아웃이 되어버린다. LoginPage는 <Outlet />을 렌더링하지 않는 완전히 독립된
// 화면이라 그 상태로는 이 라우트가 전혀 렌더링되지 않는 문제가 있었다(회원가입 다단계
// 플로우가 `register-organization.tsx`처럼 평평한 네이밍을 쓰는 것과 동일한 이유).
export const Route = createFileRoute('/login-verify')({
  beforeLoad: () => {
    const authRedirect = redirectIfAuthenticated()
    if (authRedirect) return authRedirect

    // 이메일 인증을 시작한 적 없이(예: 새로고침·직접 URL 접근) 이 경로에 들어온 경우
    // 자격증명 입력 단계로 돌려보낸다.
    if (!useLoginFlowStore.getState().pending) {
      return redirect({ to: '/login' })
    }
  },
  component: LoginDeviceVerificationPage,
})
