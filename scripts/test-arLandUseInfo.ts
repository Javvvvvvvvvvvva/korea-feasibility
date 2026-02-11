#!/usr/bin/env npx tsx
/**
 * Test script for arLandUseInfoService API
 * Tests the land use permission checking functionality
 *
 * Usage: npx tsx scripts/test-arLandUseInfo.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env file manually
function loadEnv(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        env[match[1].trim()] = match[2].trim()
      }
    }
    return env
  } catch {
    return {}
  }
}

const envVars = loadEnv()
const API_KEY = process.env.VITE_DATA_GO_KR_API_KEY || envVars.VITE_DATA_GO_KR_API_KEY

if (!API_KEY) {
  console.error('Error: VITE_DATA_GO_KR_API_KEY not set in .env')
  process.exit(1)
}

// Internal code to API ucode mapping
const INTERNAL_TO_UCODE_MAP: Record<string, string> = {
  'R1E': 'UQA100',
  'R2E': 'UQA110',
  'R1G': 'UQA120',
  'R2G': 'UQA130',
  'R3G': 'UQA140',
  'RSR': 'UQA150',
  'CC': 'UQA200',
  'CG': 'UQA210',
  'CN': 'UQA220',
  'CD': 'UQA230',
  'IE': 'UQA300',
  'IG': 'UQA310',
  'ISI': 'UQA320',
}

async function testLandUsePermission(
  zoneCode: string,
  activityName: string,
  areaCd: string = '11680'
) {
  const ucode = INTERNAL_TO_UCODE_MAP[zoneCode] || zoneCode

  const url = new URL('https://apis.data.go.kr/1613000/arLandUseInfoService/DTarLandUseInfo')
  url.searchParams.set('serviceKey', API_KEY!)
  url.searchParams.set('areaCd', areaCd)
  url.searchParams.set('ucodeList', ucode)
  url.searchParams.set('landUseNm', activityName)

  console.log(`\nTesting: ${zoneCode} (${ucode}) + ${activityName}`)
  console.log(`URL: ${url.toString().replace(API_KEY!, '[KEY]')}`)

  try {
    const response = await fetch(url.toString())
    console.log(`Status: ${response.status}`)

    const text = await response.text()
    console.log('Response preview:')
    console.log(text.substring(0, 500))

    // Parse result
    if (text.includes('<item>')) {
      const permissionMatch = text.match(/<actPsbltDvsnNm>([^<]+)<\/actPsbltDvsnNm>/)
      const restrictionMatch = text.match(/<actRstrCn>([^<]+)<\/actRstrCn>/)

      if (permissionMatch) {
        console.log(`\n✓ Permission: ${permissionMatch[1]}`)
      }
      if (restrictionMatch) {
        console.log(`  Restriction: ${restrictionMatch[1].substring(0, 100)}...`)
      }
    } else if (text.includes('ERROR')) {
      console.log('✗ API returned error')
    } else {
      console.log('? No items found - activity may not be applicable')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('arLandUseInfoService API Test')
  console.log('='.repeat(60))
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`)

  // Test various zone + activity combinations
  const tests = [
    { zone: 'R3G', activity: '공동주택' },
    { zone: 'R3G', activity: '업무시설' },
    { zone: 'R3G', activity: '근린생활시설' },
    { zone: 'CG', activity: '공동주택' },
    { zone: 'CG', activity: '판매시설' },
    { zone: 'ISI', activity: '공장' },
  ]

  for (const test of tests) {
    await testLandUsePermission(test.zone, test.activity)
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('Test completed!')
}

main().catch(console.error)
