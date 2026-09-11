import { afterEach, describe, expect, it, vi } from 'vitest'

import { queryClient } from './queryClient'

describe('queryClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    queryClient.clear()
  })

  it('쿼리가 실패하면 페이지가 별도로 처리하지 않아도 콘솔에 로깅한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('쿼리 실패')

    await queryClient
      .fetchQuery({
        queryKey: ['test-query'],
        queryFn: () => Promise.reject(error),
        retry: false,
      })
      .catch(() => {})

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('test-query'), error)
  })

  it('mutation이 실패하면 페이지가 별도로 처리하지 않아도 콘솔에 로깅한다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('mutation 실패')

    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: ['test-mutation'],
      mutationFn: () => Promise.reject(error),
      retry: false,
    })

    await mutation.execute(undefined).catch(() => {})

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('test-mutation'), error)
  })

  it('meta.suppressConsoleLog가 true인 mutation은 실패해도 콘솔에 로깅하지 않는다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('로그인 실패')

    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: ['test-mutation-silent'],
      mutationFn: () => Promise.reject(error),
      meta: { suppressConsoleLog: true },
      retry: false,
    })

    await mutation.execute(undefined).catch(() => {})

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
