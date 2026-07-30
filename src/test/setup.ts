import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'
import 'allure-vitest/setup'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { server } from './mocks/server'

// jest-dom 매처 확장
expect.extend(matchers)

// dayjs 플러그인 로드
dayjs.extend(utc)
dayjs.extend(timezone)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
