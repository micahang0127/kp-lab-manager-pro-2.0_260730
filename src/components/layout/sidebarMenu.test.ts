import { describe, expect, it } from 'vitest'

import { getInitiallyExpandedKeys } from './sidebarMenu'

describe('getInitiallyExpandedKeys', () => {
  it('소메뉴가 없는 경로는 빈 Set을 반환한다', () => {
    expect(getInitiallyExpandedKeys('/main')).toEqual(new Set())
  })

  it('재고관리 소메뉴 경로면 inventory 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/inventory/preparing')).toEqual(new Set(['inventory']))
  })

  it('구매/입고 관리 소메뉴 경로면 items 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/items/register')).toEqual(new Set(['items']))
  })

  it('예약/출고 관리 소메뉴 경로면 reservation 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/reservation/preparing')).toEqual(new Set(['reservation']))
  })

  it('안전/법령 관리 소메뉴 경로면 safety 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/safety/hazardous-quantity')).toEqual(new Set(['safety']))
  })

  it('설정 소메뉴 경로면 settings 그룹만 펼쳐진다', () => {
    expect(getInitiallyExpandedKeys('/settings/storage-location')).toEqual(new Set(['settings']))
  })

  it('알 수 없는 경로는 빈 Set을 반환한다', () => {
    expect(getInitiallyExpandedKeys('/unknown-path')).toEqual(new Set())
  })
})
