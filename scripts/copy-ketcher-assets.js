#!/usr/bin/env node

/**
 * Ketcher 에셋 복사 스크립트
 * 빌드 후 node_modules의 ketcher 에셋을 dist 폴더로 복사합니다.
 * CloudFront + S3 배포 시 필요합니다.
 */

import fs from 'fs'
import path from 'path'

const sourceAssets = path.join(
  process.cwd(),
  'node_modules',
  'ketcher-react',
  'dist',
  'assets'
)
const destAssets = path.join(process.cwd(), 'dist', 'assets', 'ketcher')

try {
  // 대상 디렉토리 생성
  if (!fs.existsSync(destAssets)) {
    fs.mkdirSync(destAssets, { recursive: true })
    console.log(`✓ Created directory: ${destAssets}`)
  }

  // 에셋 복사
  if (fs.existsSync(sourceAssets)) {
    fs.cpSync(sourceAssets, destAssets, { recursive: true, force: true })
    console.log(`✓ Copied Ketcher assets to: ${destAssets}`)
  } else {
    console.warn(`⚠ Source assets not found: ${sourceAssets}`)
  }
} catch (err) {
  console.error(`✗ Failed to copy Ketcher assets:`, err.message)
  process.exit(1)
}
