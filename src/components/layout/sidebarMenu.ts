// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarPath =
  | '/main'
  | '/inventory/preparing'
  | '/items/register'
  | '/items/incoming-pending'
  | '/items/photo-pending'
  | '/reservation/preparing'
  | '/safety/msds'
  | '/safety/hazardous-quantity'
  | '/safety/hazardous-chemical'
  | '/safety/special-substance'
  | '/settings/process'
  | '/settings/member'
  | '/settings/group'
  | '/settings/category'
  | '/settings/storage-location'
  | '/settings/inventory-config'

export interface SidebarLeafItem {
  kind: 'link'
  key: string
  label: string
  to: SidebarPath
}

export interface SidebarGroupItem {
  kind: 'group'
  key: string
  label: string
  children: SidebarLeafItem[]
}

export type SidebarItem = SidebarLeafItem | SidebarGroupItem

// ─── Data ─────────────────────────────────────────────────────────────────────

export const SIDEBAR_MENU: SidebarItem[] = [
  { kind: 'link', key: 'home', label: '홈', to: '/main' },
  {
    kind: 'group',
    key: 'inventory',
    label: '재고관리',
    children: [
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      { kind: 'link', key: 'inventory-preparing', label: '준비중', to: '/inventory/preparing' },
    ],
  },
  {
    kind: 'group',
    key: 'items',
    label: '구매/입고 관리',
    children: [
      { kind: 'link', key: 'items-register', label: '물품목록', to: '/items/register' },
      {
        kind: 'link',
        key: 'items-incoming-pending',
        label: '입고등록대기',
        to: '/items/incoming-pending',
      },
      {
        kind: 'link',
        key: 'items-photo-pending',
        label: '사진등록대기',
        to: '/items/photo-pending',
      },
    ],
  },
  {
    kind: 'group',
    key: 'reservation',
    label: '예약/출고 관리',
    children: [
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      { kind: 'link', key: 'reservation-preparing', label: '준비중', to: '/reservation/preparing' },
    ],
  },
  {
    kind: 'group',
    key: 'safety',
    label: '안전/법령 관리',
    children: [
      { kind: 'link', key: 'safety-msds', label: 'MSDS', to: '/safety/msds' },
      {
        kind: 'link',
        key: 'safety-hazardous-quantity',
        label: '위험물 지정수량 배수',
        to: '/safety/hazardous-quantity',
      },
      {
        kind: 'link',
        key: 'safety-hazardous-chemical',
        label: '유해화학물질',
        to: '/safety/hazardous-chemical',
      },
      {
        kind: 'link',
        key: 'safety-special-substance',
        label: '특별관리물질',
        to: '/safety/special-substance',
      },
    ],
  },
  {
    kind: 'group',
    key: 'settings',
    label: '설정',
    children: [
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      { kind: 'link', key: 'settings-process', label: '프로세스 관리', to: '/settings/process' },
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      { kind: 'link', key: 'settings-member', label: '멤버 관리', to: '/settings/member' },
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      { kind: 'link', key: 'settings-group', label: '그룹 관리', to: '/settings/group' },
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      { kind: 'link', key: 'settings-category', label: '카테고리 관리', to: '/settings/category' },
      {
        kind: 'link',
        key: 'settings-storage-location',
        label: '보관위치 관리',
        to: '/settings/storage-location',
      },
      // [TEMP] 26.08.11 하위 기능 미구현 — 사이드바 자리만 확보한 placeholder. 실제 기능 구현 시 교체
      {
        kind: 'link',
        key: 'settings-inventory-config',
        label: '재고 관리 설정',
        to: '/settings/inventory-config',
      },
    ],
  },
]

// ─── Page Titles ──────────────────────────────────────────────────────────────

function collectPageTitles(items: SidebarItem[]): Record<SidebarPath, string> {
  const titles = {} as Record<SidebarPath, string>
  for (const item of items) {
    if (item.kind === 'link') {
      titles[item.to] = item.label
    } else {
      for (const child of item.children) {
        titles[child.to] = child.label
      }
    }
  }
  return titles
}

/**
 * SIDEBAR_MENU에서 파생된 경로별 페이지 제목(h1)이다.
 * 메뉴명 변경 시 SIDEBAR_MENU만 수정하면 사이드바와 각 페이지 제목이 함께 반영된다.
 */
export const PAGE_TITLES: Record<SidebarPath, string> = collectPageTitles(SIDEBAR_MENU)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * 현재 경로를 소메뉴로 가진 대메뉴 key 집합을 계산한다.
 * 사이드바 마운트 시 해당 대메뉴를 자동으로 펼치기 위해 사용한다.
 */
export function getInitiallyExpandedKeys(pathname: string): Set<string> {
  const expanded = new Set<string>()
  for (const item of SIDEBAR_MENU) {
    if (item.kind === 'group' && item.children.some((child) => child.to === pathname)) {
      expanded.add(item.key)
    }
  }
  return expanded
}
