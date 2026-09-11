import { redirect } from '@tanstack/react-router'

import { useRegisterFlowStore } from '../stores/registerFlowStore'

/**
 * 라우트 가드용 - 회원가입 2단계(본인인증)·3단계(가입 여부 안내) 라우트의 beforeLoad에서 호출.
 *
 * 아이디·비밀번호 찾기에서 본인인증을 마치고 넘어온 사용자에게 2·3단계는 존재하지 않는 단계다
 * (찾기 화면에서 동일한 안내를 이미 봤다). RegisterPage의 분기는 가입 방법 카드를 클릭하는
 * 경로만 막으므로, URL 직접 접근·뒤로가기까지 같은 기준으로 4단계(약관 동의)로 돌려보낸다.
 *
 * 반환 타입을 명시하는 이유: `/register-terms`는 자신의 가드에서 `/register-identity-verification`
 * 으로 리디렉션하므로, 여기서 추론에 맡기면 두 라우트의 Route 타입이 서로를 참조하는 순환
 * 추론(TS7022/TS7023)이 발생한다. requireAuth·redirectIfAuthenticated와 동일한 방식으로 끊는다.
 */
export function redirectIfIdentityVerifiedInFindAccount(): ReturnType<typeof redirect> | undefined {
  if (useRegisterFlowStore.getState().identityVerifySource === 'find-account') {
    return redirect({ to: '/register-terms' })
  }
}
