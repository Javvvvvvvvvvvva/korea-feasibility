import { useFeasibilityStore } from '../stores/feasibilityStore'
import type { ConfidenceItem } from '../types'
import './ConfidencePanel.css'

/**
 * Renders a single confidence item with enhanced legal basis display
 */
function ConfidenceItemRow({ item, showLegalBasis = true }: { item: ConfidenceItem; showLegalBasis?: boolean }) {
  return (
    <li className="confidence-item">
      <div className="item-main">
        <span className="item-label">{item.label}</span>
        {item.value && <span className="item-value">{item.value}</span>}
      </div>
      {item.source && (
        <span className="item-source">{item.source}</span>
      )}
      {showLegalBasis && item.legalArticle && (
        <span className="item-legal-basis">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {item.legalArticle}
        </span>
      )}
      {item.dataCategory && (
        <span className={`item-category category-${item.dataCategory}`}>
          {item.dataCategory === 'regulation' && '규제'}
          {item.dataCategory === 'parcel' && '필지'}
          {item.dataCategory === 'calculation' && '계산'}
          {item.dataCategory === 'overlay' && '중첩'}
        </span>
      )}
    </li>
  )
}

function ConfidencePanel() {
  const { confidence, status } = useFeasibilityStore()

  if (!confidence && status !== 'complete') {
    return null
  }

  if (!confidence) {
    return null
  }

  // Calculate overall confidence score
  const totalItems = confidence.known.length + confidence.assumed.length + confidence.missing.length
  const knownWeight = confidence.known.length * 1.0
  const assumedWeight = confidence.assumed.length * 0.5
  const confidenceScore = totalItems > 0
    ? Math.round(((knownWeight + assumedWeight) / totalItems) * 100)
    : 0

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  return (
    <div className="confidence-panel">
      <h3 className="panel-title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        데이터 신뢰도
      </h3>

      {/* Overall confidence score */}
      <div className="confidence-score-container">
        <div className={`confidence-score ${getScoreClass(confidenceScore)}`}>
          <span className="score-value">{confidenceScore}%</span>
          <span className="score-label">신뢰도 점수</span>
        </div>
        <p className="panel-description">
          분석에 사용된 데이터의 출처와 법적 근거입니다.
          <br />
          <span className="score-breakdown">
            확인 {confidence.known.length} · 가정 {confidence.assumed.length} · 누락 {confidence.missing.length}
          </span>
        </p>
      </div>

      {confidence.known.length > 0 && (
        <div className="confidence-section">
          <div className="section-header known">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>확인된 정보 ({confidence.known.length})</span>
          </div>
          <ul className="confidence-list">
            {confidence.known.map((item, idx) => (
              <ConfidenceItemRow key={idx} item={item} />
            ))}
          </ul>
        </div>
      )}

      {confidence.assumed.length > 0 && (
        <div className="confidence-section">
          <div className="section-header assumed">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>가정된 정보 ({confidence.assumed.length})</span>
          </div>
          <ul className="confidence-list">
            {confidence.assumed.map((item, idx) => (
              <ConfidenceItemRow key={idx} item={item} />
            ))}
          </ul>
        </div>
      )}

      {confidence.missing.length > 0 && (
        <div className="confidence-section">
          <div className="section-header missing">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>누락된 정보 ({confidence.missing.length})</span>
          </div>
          <ul className="confidence-list">
            {confidence.missing.map((item, idx) => (
              <ConfidenceItemRow key={idx} item={item} showLegalBasis={true} />
            ))}
          </ul>
        </div>
      )}

      {/* Legal reference summary */}
      <div className="legal-summary">
        <h4>적용 법령</h4>
        <div className="legal-tags">
          <span className="legal-tag">국토계획법</span>
          <span className="legal-tag">서울시 조례</span>
          <span className="legal-tag">건축법</span>
        </div>
      </div>
    </div>
  )
}

export default ConfidencePanel
