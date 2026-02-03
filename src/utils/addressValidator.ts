/**
 * Address Validator for Korean Addresses
 * 한국 주소 유효성 검사
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  parsed?: {
    sido: string
    sigungu?: string
    dong?: string
    jibun?: string
  }
}

/**
 * Seoul district names
 */
const SEOUL_DISTRICTS = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구',
]

/**
 * Common misspellings and corrections
 */
const COMMON_CORRECTIONS: Record<string, string> = {
  '서울시': '서울특별시',
  '서울': '서울특별시',
  '강남': '강남구',
  '역삼': '역삼동',
  '삼성': '삼성동',
  '청담': '청담동',
}

/**
 * Validate Korean address
 */
export function validateAddress(address: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []
  let parsed: ValidationResult['parsed'] = undefined

  // Trim and normalize whitespace
  const normalizedAddress = address.trim().replace(/\s+/g, ' ')

  if (!normalizedAddress) {
    return {
      isValid: false,
      errors: ['주소를 입력해 주세요'],
      warnings: [],
      suggestions: ['예: 서울특별시 강남구 역삼동 123-45'],
    }
  }

  // Check minimum length
  if (normalizedAddress.length < 5) {
    return {
      isValid: false,
      errors: ['주소가 너무 짧습니다'],
      warnings: [],
      suggestions: ['시/도, 구/군, 동/읍/면을 포함한 전체 주소를 입력해 주세요'],
    }
  }

  // Check if starts with Seoul
  const isSeoul = normalizedAddress.includes('서울특별시') ||
    normalizedAddress.startsWith('서울시') ||
    normalizedAddress.startsWith('서울 ')

  if (!isSeoul) {
    // Check if it's another city
    const otherCities = ['부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
    const isOtherCity = otherCities.some(city => normalizedAddress.includes(city))

    if (isOtherCity) {
      return {
        isValid: false,
        errors: ['현재 서울특별시만 지원합니다'],
        warnings: [],
        suggestions: ['서울특별시 내 주소를 입력해 주세요'],
      }
    }

    warnings.push('서울특별시로 시작하지 않습니다')
    suggestions.push('"서울특별시"로 시작하는 전체 주소를 권장합니다')
  } else {
    parsed = { sido: '서울특별시' }
  }

  // Check for Seoul district
  const foundDistrict = SEOUL_DISTRICTS.find(district =>
    normalizedAddress.includes(district)
  )

  if (foundDistrict) {
    if (parsed) {
      parsed.sigungu = foundDistrict
    }
  } else if (isSeoul) {
    // Check for partial district name
    const partialDistrict = SEOUL_DISTRICTS.find(district => {
      const shortName = district.replace('구', '')
      return normalizedAddress.includes(shortName) && !normalizedAddress.includes(district)
    })

    if (partialDistrict) {
      warnings.push(`"${partialDistrict.replace('구', '')}" → "${partialDistrict}"를 의미하셨나요?`)
      suggestions.push(`전체 구 이름을 입력해 주세요 (예: ${partialDistrict})`)
    } else {
      warnings.push('구 이름을 찾을 수 없습니다')
      suggestions.push('서울시 25개 구 중 하나를 포함해 주세요')
    }
  }

  // Check for dong/jibun
  const dongPattern = /(\S+[동면리])\s*(\d+(-\d+)?)?/
  const dongMatch = normalizedAddress.match(dongPattern)

  if (dongMatch) {
    if (parsed) {
      parsed.dong = dongMatch[1]
      if (dongMatch[2]) {
        parsed.jibun = dongMatch[2]
      }
    }
  } else {
    // Check for road name address
    const roadPattern = /(\S+[로길])\s*(\d+)?/
    const roadMatch = normalizedAddress.match(roadPattern)

    if (roadMatch) {
      // Road name address is acceptable
      if (parsed) {
        parsed.dong = roadMatch[1] + ' (도로명)'
        if (roadMatch[2]) {
          parsed.jibun = roadMatch[2]
        }
      }
    } else {
      warnings.push('동/읍/면 또는 도로명이 확인되지 않았습니다')
    }
  }

  // Check for common misspellings and suggest corrections
  for (const [wrong, correct] of Object.entries(COMMON_CORRECTIONS)) {
    if (normalizedAddress.includes(wrong) && !normalizedAddress.includes(correct)) {
      suggestions.push(`"${wrong}" → "${correct}"`)
    }
  }

  // Check for special characters (excluding allowed ones)
  const hasInvalidChars = /[^가-힣a-zA-Z0-9\s\-.,()]/.test(normalizedAddress)
  if (hasInvalidChars) {
    warnings.push('특수문자가 포함되어 있습니다')
  }

  // Determine overall validity
  // Valid if: Seoul address with at least district identified
  const isValid = errors.length === 0 && isSeoul && foundDistrict !== undefined

  return {
    isValid,
    errors,
    warnings,
    suggestions,
    parsed,
  }
}

/**
 * Get input suggestions based on partial input
 */
export function getAddressSuggestions(partialInput: string): string[] {
  const suggestions: string[] = []
  const normalized = partialInput.trim().toLowerCase()

  if (!normalized) return suggestions

  // Suggest completing Seoul prefix
  if ('서울'.startsWith(normalized) || normalized.startsWith('서울')) {
    if (!normalized.includes('특별시')) {
      suggestions.push('서울특별시')
    }
  }

  // Suggest districts
  if (normalized.includes('서울')) {
    SEOUL_DISTRICTS.forEach(district => {
      if (district.toLowerCase().includes(normalized.split(' ').pop() || '')) {
        suggestions.push(`서울특별시 ${district}`)
      }
    })
  }

  return suggestions.slice(0, 5)
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  let formatted = address.trim()

  // Replace common abbreviations
  formatted = formatted.replace(/^서울시\s/, '서울특별시 ')
  formatted = formatted.replace(/^서울\s/, '서울특별시 ')

  // Normalize whitespace
  formatted = formatted.replace(/\s+/g, ' ')

  return formatted
}
