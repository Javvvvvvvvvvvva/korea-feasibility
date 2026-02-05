#!/usr/bin/env npx ts-node
/**
 * VWorld API Integration Test Script
 * 브이월드 API 연동 테스트 스크립트
 *
 * Usage:
 *   VITE_VWORLD_API_KEY=your-key npx ts-node scripts/test-vworld-api.ts
 *
 * Or set the key in .env file and run:
 *   npx ts-node scripts/test-vworld-api.ts
 */

// Simple fetch implementation for Node.js
const fetch = globalThis.fetch

// Test data
const TEST_CASES = [
  {
    name: 'Gangnam Station Area',
    coords: [127.0276, 37.4979],
    expectedDistrict: '강남구',
  },
  {
    name: 'Mapo-gu Hapjeong',
    coords: [126.9139, 37.5495],
    expectedDistrict: '마포구',
  },
  {
    name: 'Jongno-gu Gwanghwamun',
    coords: [126.9768, 37.5759],
    expectedDistrict: '종로구',
  },
]

async function testVWorldAPI() {
  const apiKey = process.env.VITE_VWORLD_API_KEY

  if (!apiKey) {
    console.error('Error: VITE_VWORLD_API_KEY environment variable not set')
    console.log('\nUsage:')
    console.log('  VITE_VWORLD_API_KEY=your-key npx ts-node scripts/test-vworld-api.ts')
    console.log('\nGet your key at: https://www.vworld.kr/dev/v4api.do')
    process.exit(1)
  }

  console.log('VWorld API Integration Test')
  console.log('===========================\n')
  console.log(`API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`)
  console.log('')

  let passed = 0
  let failed = 0

  for (const testCase of TEST_CASES) {
    console.log(`\nTest: ${testCase.name}`)
    console.log(`  Coordinates: [${testCase.coords.join(', ')}]`)

    try {
      // Test WFS parcel lookup
      const delta = 0.0001
      const bbox = [
        testCase.coords[0] - delta,
        testCase.coords[1] - delta,
        testCase.coords[0] + delta,
        testCase.coords[1] + delta,
      ].join(',')

      const wfsUrl = `https://api.vworld.kr/req/wfs?REQUEST=GetFeature&TYPENAME=lp_pa_cbnd_bubun&VERSION=1.1.0&MAXFEATURES=1&SRSNAME=EPSG:4326&OUTPUT=json&BBOX=${bbox}&KEY=${apiKey}`

      console.log('  Fetching parcel data...')
      const response = await fetch(wfsUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.features || data.features.length === 0) {
        console.log('  Result: No features found')
        failed++
        continue
      }

      const feature = data.features[0]
      const props = feature.properties

      console.log('  Result: SUCCESS')
      console.log(`    PNU: ${props.pnu}`)
      console.log(`    Address: ${props.addr}`)
      console.log(`    Jibun: ${props.jibun}`)
      console.log(`    Geometry type: ${feature.geometry.type}`)
      console.log(`    Coordinates count: ${feature.geometry.coordinates[0]?.length || 'N/A'}`)

      passed++
    } catch (error) {
      console.log(`  Result: FAILED`)
      console.log(`    Error: ${error instanceof Error ? error.message : String(error)}`)
      failed++
    }
  }

  // Test zoning lookup
  console.log('\n\nZoning Layer Test')
  console.log('=================')

  try {
    const [lng, lat] = TEST_CASES[0].coords
    const delta = 0.0001
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')

    const zoningUrl = `https://api.vworld.kr/req/wfs?REQUEST=GetFeature&TYPENAME=lt_c_uq111&VERSION=1.1.0&MAXFEATURES=1&SRSNAME=EPSG:4326&OUTPUT=json&BBOX=${bbox}&KEY=${apiKey}`

    console.log('\nFetching zoning data for Gangnam area...')
    const response = await fetch(zoningUrl)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties
      console.log('Result: SUCCESS')
      console.log(`  Zone name: ${props.uname || props.name || 'N/A'}`)
      console.log(`  Zone code: ${props.ucode || 'N/A'}`)
      passed++
    } else {
      console.log('Result: No zoning data found (may be expected for some areas)')
    }
  } catch (error) {
    console.log(`Result: FAILED`)
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    failed++
  }

  // Summary
  console.log('\n\n===========================')
  console.log(`Summary: ${passed} passed, ${failed} failed`)
  console.log('===========================')

  process.exit(failed > 0 ? 1 : 0)
}

testVWorldAPI()
