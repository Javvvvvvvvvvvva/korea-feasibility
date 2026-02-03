import { useFeasibilityStore } from '../stores/feasibilityStore'
import type { ZoningCode } from '../domain/korea/zoning'
import './ZoningOverride.css'

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거지역',
  commercial: '상업지역',
  industrial: '공업지역',
  green: '녹지지역',
}

function ZoningOverride() {
  const {
    zoning,
    manualZoningCode,
    availableZoningTypes,
    recalculateWithZoning,
    setManualZoning,
    status,
  } = useFeasibilityStore()

  if (!zoning) return null

  const isLoading = status === 'resolving_zoning' || status === 'calculating_massing'
  const isManualOverride = manualZoningCode !== null

  const handleZoningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'auto') {
      setManualZoning(null)
      // Re-analyze would be needed to reset, but keep current for now
    } else {
      recalculateWithZoning(value as ZoningCode)
    }
  }

  // Group zoning types by category
  const groupedTypes = availableZoningTypes.reduce(
    (acc, type) => {
      const category = type.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(type)
      return acc
    },
    {} as Record<string, typeof availableZoningTypes>
  )

  return (
    <div className="zoning-override">
      <div className="override-header">
        <h4>용도지역 변경</h4>
        {isManualOverride && (
          <span className="override-badge">수동 설정됨</span>
        )}
      </div>

      <p className="override-description">
        추정된 용도지역이 실제와 다른 경우, 직접 선택하여 재계산할 수 있습니다.
      </p>

      <div className="select-wrapper">
        <select
          value={manualZoningCode || 'auto'}
          onChange={handleZoningChange}
          disabled={isLoading}
          className="zoning-select"
        >
          <option value="auto">자동 (구역 기반 추정)</option>

          {Object.entries(groupedTypes).map(([category, types]) => (
            <optgroup key={category} label={CATEGORY_LABELS[category] || category}>
              {types.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {isLoading && <div className="select-spinner" />}
      </div>

      {isManualOverride && (
        <div className="override-note">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            수동 선택된 용도지역입니다. 실제 용도지역은 토지이용계획확인서로 확인하세요.
          </span>
        </div>
      )}
    </div>
  )
}

export default ZoningOverride
