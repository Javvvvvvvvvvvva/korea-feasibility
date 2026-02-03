import { useFeasibilityStore } from '../stores/feasibilityStore'
import './ZoningInfo.css'

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거지역',
  commercial: '상업지역',
  industrial: '공업지역',
  green: '녹지지역',
  management: '관리지역',
  agricultural: '농림지역',
  natural: '자연환경보전지역',
}

const CATEGORY_COLORS: Record<string, string> = {
  residential: '#38a169',
  commercial: '#d69e2e',
  industrial: '#805ad5',
  green: '#48bb78',
  management: '#718096',
  agricultural: '#68d391',
  natural: '#4fd1c5',
}

function ZoningInfo() {
  const { zoning, massing, status } = useFeasibilityStore()

  if (!zoning && status !== 'resolving_zoning') {
    return null
  }

  if (!zoning) {
    return (
      <div className="zoning-info loading">
        <div className="loading-skeleton" />
      </div>
    )
  }

  const categoryColor = CATEGORY_COLORS[zoning.category] || '#718096'
  const categoryLabel = CATEGORY_LABELS[zoning.category] || zoning.category

  return (
    <div className="zoning-info">
      <h3 className="panel-title">용도지역 및 건축규제</h3>

      <div
        className="zoning-badge"
        style={{ borderColor: categoryColor, color: categoryColor }}
      >
        <span className="badge-category">{categoryLabel}</span>
        <span className="badge-name">{zoning.name}</span>
      </div>

      <div className="regulations-grid">
        <div className="regulation-card">
          <div className="regulation-header">
            <span className="regulation-label">용적률 (FAR)</span>
            <span
              className={`confidence-badge confidence-${zoning.regulations.far.confidence}`}
            >
              {getConfidenceLabel(zoning.regulations.far.confidence)}
            </span>
          </div>
          <div className="regulation-value">
            {zoning.regulations.far.value !== null
              ? `${zoning.regulations.far.value}%`
              : '미확인'}
          </div>
          {massing && (
            <div className="regulation-usage">
              사용: {massing.statistics.farUsed}%
              <div
                className="usage-bar"
                style={{
                  width: `${Math.min(
                    (massing.statistics.farUsed /
                      (zoning.regulations.far.value || 100)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="regulation-card">
          <div className="regulation-header">
            <span className="regulation-label">건폐율 (BCR)</span>
            <span
              className={`confidence-badge confidence-${zoning.regulations.bcr.confidence}`}
            >
              {getConfidenceLabel(zoning.regulations.bcr.confidence)}
            </span>
          </div>
          <div className="regulation-value">
            {zoning.regulations.bcr.value !== null
              ? `${zoning.regulations.bcr.value}%`
              : '미확인'}
          </div>
          {massing && (
            <div className="regulation-usage">
              사용: {massing.statistics.bcrUsed}%
              <div
                className="usage-bar"
                style={{
                  width: `${Math.min(
                    (massing.statistics.bcrUsed /
                      (zoning.regulations.bcr.value || 100)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="regulation-card">
          <div className="regulation-header">
            <span className="regulation-label">높이제한</span>
            <span
              className={`confidence-badge confidence-${zoning.regulations.heightLimit.confidence}`}
            >
              {getConfidenceLabel(zoning.regulations.heightLimit.confidence)}
            </span>
          </div>
          <div className="regulation-value">
            {zoning.regulations.heightLimit.value !== null
              ? `${zoning.regulations.heightLimit.value}m`
              : '미지정'}
          </div>
          {massing && (
            <div className="regulation-detail">
              계산 높이: {massing.envelope.maxHeight.toFixed(1)}m
            </div>
          )}
        </div>
      </div>

      {massing && (
        <div className="massing-summary">
          <h4>건축 가능 규모</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">연면적</span>
              <span className="summary-value">
                {massing.statistics.grossFloorArea.toLocaleString()} m²
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">건축면적</span>
              <span className="summary-value">
                {massing.statistics.buildingCoverage.toLocaleString()} m²
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">추정 층수</span>
              <span className="summary-value">
                {massing.statistics.estimatedFloors}층
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">최대 높이</span>
              <span className="summary-value">
                {massing.envelope.maxHeight.toFixed(1)}m
              </span>
            </div>
          </div>
        </div>
      )}

      {zoning.regulations.far.legalBasis && (
        <div className="legal-basis">
          <span className="legal-label">법적 근거:</span>
          <span className="legal-text">{zoning.regulations.far.legalBasis}</span>
        </div>
      )}
    </div>
  )
}

function getConfidenceLabel(confidence: string): string {
  switch (confidence) {
    case 'high':
      return '확인됨'
    case 'medium':
      return '추정'
    case 'low':
      return '불확실'
    case 'unknown':
      return '미확인'
    default:
      return confidence
  }
}

export default ZoningInfo
