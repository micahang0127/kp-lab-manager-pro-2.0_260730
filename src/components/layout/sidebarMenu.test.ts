import { describe, expect, it } from 'vitest'

import { getInitiallyExpandedKeys } from './sidebarMenu'

describe('getInitiallyExpandedKeys', () => {
  it('소메뉴가 없는 경로는 빈 Set을 반환한다', () => {
    expect(getInitiallyExpandedKeys('/main')).toEqual(new Set())
  })

  it('물품관리 소메뉴 경로면 items 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/items/register')).toEqual(new Set(['items']))
  })

  it('안전관리 소메뉴 경로면 safety 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/safety/hazardous-quantity')).toEqual(new Set(['safety']))
  })

  it('기관관리 소메뉴 경로면 institution 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/institution/info')).toEqual(new Set(['institution']))
  })

  it('알 수 없는 경로는 빈 Set을 반환한다', () => {
    expect(getInitiallyExpandedKeys('/unknown-path')).toEqual(new Set())
  })
})
