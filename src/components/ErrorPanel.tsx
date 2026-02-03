import { useFeasibilityStore } from '../stores/feasibilityStore'
import './ErrorPanel.css'

/**
 * Error type definitions with user-friendly messages and recovery options
 */
interface ErrorInfo {
  title: string
  description: string
  suggestions: string[]
  recoveryAction?: {
    label: string
    action: () => void
  }
}

/**
 * Map error messages to user-friendly information
 */
function getErrorInfo(error: string, reset: () => void): ErrorInfo {
  // Address not found errors
  if (error.includes('주소') && (error.includes('찾을 수 없') || error.includes('해석'))) {
    return {
      title: '주소를 찾을 수 없습니다',
      description: '입력하신 주소를 확인할 수 없습니다.',
      suggestions: [
        '서울특별시로 시작하는 전체 주소를 입력해 주세요',
        '도로명주소 또는 지번주소 모두 가능합니다',
        '예시: 서울특별시 강남구 역삼동 123-45',
      ],
      recoveryAction: { label: '다시 입력', action: reset },
    }
  }

  // Non-Seoul address errors
  if (error.includes('서울') || error.includes('지원하지 않')) {
    return {
      title: '서울 외 지역은 지원하지 않습니다',
      description: '현재 버전은 서울특별시만 지원합니다.',
      suggestions: [
        '서울특별시 내 주소를 입력해 주세요',
        '향후 부산, 인천 등 다른 도시도 지원 예정입니다',
      ],
      recoveryAction: { label: '서울 주소 입력', action: reset },
    }
  }

  // Parcel fetch errors
  if (error.includes('필지') || error.includes('대지')) {
    return {
      title: '필지 정보를 가져올 수 없습니다',
      description: '해당 위치의 필지 정보를 조회하지 못했습니다.',
      suggestions: [
        '주소가 실제 존재하는지 확인해 주세요',
        '지번이 정확한지 확인해 주세요',
        '토지이음(eum.go.kr)에서 필지 확인 가능합니다',
      ],
      recoveryAction: { label: '다시 시도', action: reset },
    }
  }

  // Zoning errors
  if (error.includes('용도지역') || error.includes('규제')) {
    return {
      title: '용도지역 정보를 확인할 수 없습니다',
      description: '해당 필지의 용도지역 정보를 조회하지 못했습니다.',
      suggestions: [
        '수동으로 용도지역을 선택할 수 있습니다',
        '토지이용계획확인서에서 정확한 용도지역 확인 가능합니다',
      ],
      recoveryAction: { label: '다시 시도', action: reset },
    }
  }

  // Network errors
  if (error.includes('네트워크') || error.includes('연결') || error.includes('timeout')) {
    return {
      title: '네트워크 오류',
      description: '서버와의 연결에 문제가 발생했습니다.',
      suggestions: [
        '인터넷 연결을 확인해 주세요',
        '잠시 후 다시 시도해 주세요',
      ],
      recoveryAction: { label: '다시 시도', action: reset },
    }
  }

  // Default error
  return {
    title: '오류가 발생했습니다',
    description: error || '알 수 없는 오류가 발생했습니다.',
    suggestions: [
      '입력 정보를 확인하고 다시 시도해 주세요',
      '문제가 지속되면 새로고침 후 시도해 주세요',
    ],
    recoveryAction: { label: '다시 시도', action: reset },
  }
}

function ErrorPanel() {
  const { error, status, reset } = useFeasibilityStore()

  if (status !== 'error' || !error) return null

  const errorInfo = getErrorInfo(error, reset)

  return (
    <div className="error-panel" role="alert" aria-live="polite">
      <div className="error-header">
        <div className="error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
        </div>
        <div className="error-title-content">
          <h3 className="error-title">{errorInfo.title}</h3>
          <p className="error-description">{errorInfo.description}</p>
        </div>
      </div>

      <div className="error-suggestions">
        <h4>해결 방법</h4>
        <ul>
          {errorInfo.suggestions.map((suggestion, idx) => (
            <li key={idx}>{suggestion}</li>
          ))}
        </ul>
      </div>

      {errorInfo.recoveryAction && (
        <div className="error-actions">
          <button
            className="recovery-button"
            onClick={errorInfo.recoveryAction.action}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            {errorInfo.recoveryAction.label}
          </button>
        </div>
      )}

      {/* Debug info (collapsed by default) */}
      <details className="error-debug">
        <summary>기술 정보</summary>
        <pre>{error}</pre>
      </details>
    </div>
  )
}

export default ErrorPanel
