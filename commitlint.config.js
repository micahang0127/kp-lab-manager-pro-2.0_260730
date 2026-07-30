export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // ============================================
    // 커밋 메시지 형식: type: description [refs #123]
    // refs는 선택사항 (레드마인 연동 시 권장)
    // ============================================

    // 타입 규칙: feat, update, fix, docs, style, refactor, test, chore
    // 'update'는 표준에 없으나 프로젝트 컨벤션에 있으므로 추가
    'type-enum': [
      2,
      'always',
      ['feat', 'update', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],

    'type-case': [2, 'always', 'lower-case'],   // 타입은 소문자 강제
    'subject-empty': [2, 'never'],              // 설명 필수 (빈 메시지 차단)
    'subject-case': [0],                        // 설명 대소문자 미검사 (한국어 지원)

    // NOTE: refs #123 형식의 이슈 번호는 선택사항
    // 필수로 요구하지 않으므로 다음도 모두 유효:
    // - test: 테스트 진행함
    // - feat: 새 기능 추가
    // - fix: 버그 수정 refs #123 (refs와 함께도 가능)
  },
}
