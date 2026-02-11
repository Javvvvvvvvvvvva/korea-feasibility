#!/usr/bin/env npx ts-node
/**
 * Korea Urban Feasibility - Full Pipeline Demo
 * 한국 도시개발 타당성 분석 - 전체 파이프라인 데모
 *
 * Demonstrates the complete flow:
 * 1. Input address → Geocode to coordinates
 * 2. Fetch parcel polygon from API
 * 3. Fetch zoning/regulation data from API
 * 4. Calculate building massing
 * 5. Output results (ready for 3D rendering)
 *
 * Usage:
 *   # With VWorld API key
 *   VITE_VWORLD_API_KEY=your-key npx ts-node scripts/demo-full-pipeline.ts
 *
 *   # With data.go.kr API key (optional, for regulation data)
 *   VITE_DATA_GO_KR_API_KEY=your-key npx ts-node scripts/demo-full-pipeline.ts
 *
 *   # With both keys
 *   VITE_VWORLD_API_KEY=vworld-key VITE_DATA_GO_KR_API_KEY=datagoKr-key npx ts-node scripts/demo-full-pipeline.ts
 *
 * Get API keys:
 *   - VWorld: https://www.vworld.kr/dev/v4api.do
 *   - data.go.kr: https://www.data.go.kr
 */

// ============================================
// Configuration
// ============================================

const TEST_ADDRESS = '서울특별시 강남구 역삼동 123-45'

// Alternative test addresses
const ALTERNATIVE_ADDRESSES = [
  '서울특별시 마포구 합정동 456',
  '서울특별시 종로구 청진동 100',
  '서울특별시 성동구 성수동1가 200',
]

// ============================================
// Helper Functions
// ============================================

function printSection(title: string) {
  console.log('\n' + '='.repeat(50))
  console.log(title)
  console.log('='.repeat(50))
}

function printSubsection(title: string) {
  console.log('\n' + '-'.repeat(40))
  console.log(title)
  console.log('-'.repeat(40))
}

function formatArea(area: number): string {
  return `${area.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}㎡`
}

function formatPercentage(value: number): string {
  return `${value}%`
}

// ============================================
// Mock Implementations (for demo without full build)
// ============================================

interface MockParcel {
  pnu: string
  address: string
  coordinates: [number, number]
  area: number
  geometry: number[][][]
}

interface MockZoning {
  code: string
  name: string
  far: number
  bcr: number
  heightLimit: number | null
}

interface MockMassing {
  footprintArea: number
  totalFloorArea: number
  estimatedFloors: number
  maxHeight: number
  setbacks: {
    front: number
    side: number
    rear: number
  }
}

async function resolveAddress(address: string): Promise<{ coordinates: [number, number]; district: string }> {
  // Parse district from address
  const districtMatch = address.match(/([가-힣]+구)/)
  const district = districtMatch ? districtMatch[1] : '강남구'

  // District coordinates (simplified)
  const districtCoords: Record<string, [number, number]> = {
    강남구: [127.047, 37.517],
    마포구: [126.901, 37.566],
    종로구: [126.979, 37.573],
    성동구: [127.037, 37.563],
    서초구: [127.033, 37.483],
    송파구: [127.106, 37.514],
  }

  const coordinates = districtCoords[district] || [127.0, 37.5]

  return { coordinates, district }
}

async function fetchParcelFromAPI(
  coordinates: [number, number],
  apiKey?: string
): Promise<MockParcel | null> {
  if (!apiKey) {
    console.log('  [No API key - using mock data]')
    return null
  }

  try {
    const [lng, lat] = coordinates
    const delta = 0.0001
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')

    const url = `https://api.vworld.kr/req/wfs?REQUEST=GetFeature&TYPENAME=lp_pa_cbnd_bubun&VERSION=1.1.0&MAXFEATURES=1&SRSNAME=EPSG:4326&OUTPUT=json&BBOX=${bbox}&KEY=${apiKey}`

    console.log('  Fetching from VWorld API...')
    const response = await fetch(url)

    if (!response.ok) {
      console.log(`  API Error: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      console.log('  No parcel found at coordinates')
      return null
    }

    const feature = data.features[0]
    const props = feature.properties

    return {
      pnu: props.pnu || '0000000000000000000',
      address: props.addr || 'Unknown',
      coordinates,
      area: props.area || calculatePolygonArea(feature.geometry.coordinates[0]),
      geometry: feature.geometry.coordinates,
    }
  } catch (error) {
    console.log(`  API Error: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function generateMockParcel(coordinates: [number, number], address: string): MockParcel {
  const [lng, lat] = coordinates
  const halfW = 0.0001 // ~10m
  const halfH = 0.00014 // ~15m

  const geometry = [
    [
      [lng - halfW, lat - halfH],
      [lng + halfW, lat - halfH],
      [lng + halfW, lat + halfH],
      [lng - halfW, lat + halfH],
      [lng - halfW, lat - halfH],
    ],
  ]

  return {
    pnu: '1168010100100010001', // Example Gangnam PNU
    address,
    coordinates,
    area: 500, // 500㎡ typical Seoul lot
    geometry,
  }
}

function calculatePolygonArea(coords: number[][]): number {
  const metersPerDegreeLng = 88000
  const metersPerDegreeLat = 111000

  let area = 0
  const n = coords.length - 1

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const xi = coords[i][0] * metersPerDegreeLng
    const yi = coords[i][1] * metersPerDegreeLat
    const xj = coords[j][0] * metersPerDegreeLng
    const yj = coords[j][1] * metersPerDegreeLat

    area += xi * yj
    area -= xj * yi
  }

  return Math.abs(area / 2)
}

async function fetchZoningFromAPI(
  pnu: string,
  coordinates: [number, number],
  apiKey?: string
): Promise<MockZoning | null> {
  if (!apiKey) {
    console.log('  [No API key - using inference]')
    return null
  }

  try {
    const [lng, lat] = coordinates
    const delta = 0.0001
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')

    const url = `https://api.vworld.kr/req/wfs?REQUEST=GetFeature&TYPENAME=lt_c_uq111&VERSION=1.1.0&MAXFEATURES=1&SRSNAME=EPSG:4326&OUTPUT=json&BBOX=${bbox}&KEY=${apiKey}`

    console.log('  Fetching zoning from VWorld API...')
    const response = await fetch(url)

    if (!response.ok) {
      console.log(`  API Error: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      console.log('  No zoning data at coordinates')
      return null
    }

    const props = data.features[0].properties
    const zoneName = props.uname || props.name || 'Unknown'

    return {
      code: mapZoneNameToCode(zoneName),
      name: zoneName,
      ...getRegulationsForZone(mapZoneNameToCode(zoneName)),
    }
  } catch (error) {
    console.log(`  API Error: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function mapZoneNameToCode(name: string): string {
  const nameMap: Record<string, string> = {
    제1종전용주거지역: 'R1E',
    제2종전용주거지역: 'R2E',
    제1종일반주거지역: 'R1G',
    제2종일반주거지역: 'R2G',
    제3종일반주거지역: 'R3G',
    준주거지역: 'RSR',
    중심상업지역: 'CC',
    일반상업지역: 'CG',
    근린상업지역: 'CN',
    유통상업지역: 'CD',
    전용공업지역: 'IE',
    일반공업지역: 'IG',
    준공업지역: 'ISI',
    보전녹지지역: 'GC',
    생산녹지지역: 'GP',
    자연녹지지역: 'GN',
  }

  for (const [koreanName, code] of Object.entries(nameMap)) {
    if (name.includes(koreanName)) {
      return code
    }
  }

  return 'R2G' // Default
}

function getRegulationsForZone(code: string): { far: number; bcr: number; heightLimit: number | null } {
  const regulations: Record<string, { far: number; bcr: number; heightLimit: number | null }> = {
    R1E: { far: 100, bcr: 50, heightLimit: null },
    R2E: { far: 150, bcr: 50, heightLimit: null },
    R1G: { far: 200, bcr: 60, heightLimit: null },
    R2G: { far: 250, bcr: 60, heightLimit: null },
    R3G: { far: 300, bcr: 50, heightLimit: null },
    RSR: { far: 500, bcr: 70, heightLimit: null },
    CC: { far: 1500, bcr: 90, heightLimit: null },
    CG: { far: 1300, bcr: 80, heightLimit: null },
    CN: { far: 900, bcr: 70, heightLimit: null },
    CD: { far: 1100, bcr: 80, heightLimit: null },
    IE: { far: 300, bcr: 70, heightLimit: null },
    IG: { far: 350, bcr: 70, heightLimit: null },
    ISI: { far: 400, bcr: 70, heightLimit: null },
    GC: { far: 80, bcr: 20, heightLimit: null },
    GP: { far: 100, bcr: 20, heightLimit: null },
    GN: { far: 100, bcr: 20, heightLimit: null },
  }

  return regulations[code] || { far: 200, bcr: 60, heightLimit: null }
}

function inferZoning(district: string): MockZoning {
  const districtZoning: Record<string, string> = {
    강남구: 'R3G',
    서초구: 'R3G',
    송파구: 'R2G',
    마포구: 'RSR',
    영등포구: 'CG',
    종로구: 'CG',
    중구: 'CC',
    성동구: 'ISI',
  }

  const code = districtZoning[district] || 'R2G'
  const name = getZoneName(code)

  return {
    code,
    name,
    ...getRegulationsForZone(code),
  }
}

function getZoneName(code: string): string {
  const names: Record<string, string> = {
    R1E: '제1종전용주거지역',
    R2E: '제2종전용주거지역',
    R1G: '제1종일반주거지역',
    R2G: '제2종일반주거지역',
    R3G: '제3종일반주거지역',
    RSR: '준주거지역',
    CC: '중심상업지역',
    CG: '일반상업지역',
    CN: '근린상업지역',
    CD: '유통상업지역',
    IE: '전용공업지역',
    IG: '일반공업지역',
    ISI: '준공업지역',
    GC: '보전녹지지역',
    GP: '생산녹지지역',
    GN: '자연녹지지역',
  }

  return names[code] || code
}

function calculateMassing(parcel: MockParcel, zoning: MockZoning): MockMassing {
  // Calculate setbacks (simplified)
  const setbacks = {
    front: 3, // 3m front setback
    side: 1.5, // 1.5m side setback
    rear: 2, // 2m rear setback
  }

  // Calculate buildable footprint
  // Simplified: assume rectangular lot, reduce by setbacks
  const parcelWidth = Math.sqrt(parcel.area) * 0.8 // Approximate width
  const parcelDepth = parcel.area / parcelWidth

  const buildableWidth = Math.max(0, parcelWidth - setbacks.side * 2)
  const buildableDepth = Math.max(0, parcelDepth - setbacks.front - setbacks.rear)

  const rawFootprint = buildableWidth * buildableDepth
  const footprintArea = Math.min(rawFootprint, parcel.area * (zoning.bcr / 100))

  // Calculate total floor area
  const totalFloorArea = parcel.area * (zoning.far / 100)

  // Calculate floors and height
  const floorHeight = 3.5 // 3.5m per floor
  const estimatedFloors = Math.ceil(totalFloorArea / footprintArea)
  const maxHeight = estimatedFloors * floorHeight

  return {
    footprintArea: Math.round(footprintArea * 100) / 100,
    totalFloorArea: Math.round(totalFloorArea * 100) / 100,
    estimatedFloors,
    maxHeight: Math.round(maxHeight * 10) / 10,
    setbacks,
  }
}

// ============================================
// Main Demo Function
// ============================================

async function runDemo() {
  console.log('\n' + '╔' + '═'.repeat(58) + '╗')
  console.log('║' + ' Korea Urban Feasibility - Full Pipeline Demo'.padEnd(58) + '║')
  console.log('║' + ' 한국 도시개발 타당성 분석 데모'.padEnd(55) + '║')
  console.log('╚' + '═'.repeat(58) + '╝')

  const vworldKey = process.env.VITE_VWORLD_API_KEY
  const dataGoKrKey = process.env.VITE_DATA_GO_KR_API_KEY

  // API Status
  printSection('API Configuration')
  console.log(`VWorld API Key: ${vworldKey ? '✓ Configured' : '✗ Not set'}`)
  console.log(`data.go.kr API Key: ${dataGoKrKey ? '✓ Configured' : '✗ Not set'}`)

  if (!vworldKey && !dataGoKrKey) {
    console.log('\n⚠️  No API keys configured. Running with mock data.')
    console.log('   Set environment variables:')
    console.log('   - VITE_VWORLD_API_KEY for parcel/zoning data')
    console.log('   - VITE_DATA_GO_KR_API_KEY for regulation data')
  }

  // Step 1: Address Resolution
  printSection('Step 1: Address Resolution (주소 해석)')
  console.log(`Input: ${TEST_ADDRESS}`)

  const { coordinates, district } = await resolveAddress(TEST_ADDRESS)
  console.log(`\nResolved:`)
  console.log(`  District: ${district}`)
  console.log(`  Coordinates: [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]`)

  // Step 2: Parcel Fetch
  printSection('Step 2: Parcel Fetch (필지 정보 조회)')

  let parcel = await fetchParcelFromAPI(coordinates, vworldKey)

  if (!parcel) {
    console.log('  Generating mock parcel...')
    parcel = generateMockParcel(coordinates, TEST_ADDRESS)
  }

  console.log(`\nParcel Data:`)
  console.log(`  PNU: ${parcel.pnu}`)
  console.log(`  Address: ${parcel.address}`)
  console.log(`  Area: ${formatArea(parcel.area)}`)
  console.log(`  Geometry: Polygon with ${parcel.geometry[0].length} vertices`)

  // Step 3: Zoning Resolution
  printSection('Step 3: Zoning Resolution (용도지역 확인)')

  let zoning = await fetchZoningFromAPI(parcel.pnu, coordinates, vworldKey)

  if (!zoning) {
    console.log(`  Using district-based inference for ${district}...`)
    zoning = inferZoning(district)
  }

  console.log(`\nZoning Data:`)
  console.log(`  Code: ${zoning.code}`)
  console.log(`  Name: ${zoning.name}`)
  console.log(`  FAR (용적률): ${formatPercentage(zoning.far)}`)
  console.log(`  BCR (건폐율): ${formatPercentage(zoning.bcr)}`)
  console.log(`  Height Limit: ${zoning.heightLimit ? `${zoning.heightLimit}m` : 'None specified'}`)

  // Step 4: Massing Calculation
  printSection('Step 4: Massing Calculation (매싱 계산)')

  const massing = calculateMassing(parcel, zoning)

  console.log(`\nBuilding Envelope:`)
  console.log(`  Footprint Area: ${formatArea(massing.footprintArea)}`)
  console.log(`  Total Floor Area: ${formatArea(massing.totalFloorArea)}`)
  console.log(`  Estimated Floors: ${massing.estimatedFloors}`)
  console.log(`  Max Height: ${massing.maxHeight}m`)
  console.log(`\nSetbacks:`)
  console.log(`  Front: ${massing.setbacks.front}m`)
  console.log(`  Side: ${massing.setbacks.side}m`)
  console.log(`  Rear: ${massing.setbacks.rear}m`)

  // Step 5: Summary for 3D Rendering
  printSection('Step 5: 3D Rendering Data (3D 렌더링 데이터)')

  const renderData = {
    parcel: {
      center: coordinates,
      area: parcel.area,
      polygon: parcel.geometry[0].map(([lng, lat]) => ({
        x: (lng - coordinates[0]) * 88000, // Convert to meters
        z: (lat - coordinates[1]) * 111000,
      })),
    },
    building: {
      width: Math.sqrt(massing.footprintArea),
      depth: Math.sqrt(massing.footprintArea),
      height: massing.maxHeight,
      floors: massing.estimatedFloors,
      floorHeight: 3.5,
    },
    setbacks: massing.setbacks,
    zoning: {
      code: zoning.code,
      name: zoning.name,
    },
  }

  console.log('\nJSON Output for 3D Viewer:')
  console.log(JSON.stringify(renderData, null, 2))

  // Final Summary
  printSection('Summary (요약)')

  console.log(`
┌─────────────────────────────────────────────────────────┐
│ Project Feasibility Analysis                            │
├─────────────────────────────────────────────────────────┤
│ Location: ${district.padEnd(45)}│
│ Land Area: ${formatArea(parcel.area).padEnd(44)}│
│ Zoning: ${zoning.name.padEnd(47)}│
│ Max FAR: ${formatPercentage(zoning.far).padEnd(46)}│
│ Max BCR: ${formatPercentage(zoning.bcr).padEnd(46)}│
├─────────────────────────────────────────────────────────┤
│ Buildable Floor Area: ${formatArea(massing.totalFloorArea).padEnd(32)}│
│ Building Footprint: ${formatArea(massing.footprintArea).padEnd(34)}│
│ Estimated Stories: ${String(massing.estimatedFloors).padEnd(35)}│
│ Max Height: ${(massing.maxHeight + 'm').padEnd(43)}│
└─────────────────────────────────────────────────────────┘
`)

  console.log('Demo complete! Run the web application to see 3D visualization.')
  console.log('  npm run dev')
}

// Run the demo
runDemo().catch((error) => {
  console.error('Demo failed:', error)
  process.exit(1)
})
