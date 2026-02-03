import { useState, useMemo } from 'react'
import { useFeasibilityStore } from '../stores/feasibilityStore'
import { validateAddress, formatAddress } from '../utils/addressValidator'
import type { FeasibilityStatus } from '../types'
import './AddressInput.css'

/**
 * Analysis steps with progress information
 */
const ANALYSIS_STEPS: Array<{
  status: FeasibilityStatus
  label: string
  description: string
}> = [
  {
    status: 'resolving_address',
    label: '주소 해석',
    description: '한글 주소를 좌표로 변환 중...',
  },
  {
    status: 'fetching_parcel',
    label: '필지 조회',
    description: '대지 경계 및 면적 조회 중...',
  },
  {
    status: 'resolving_zoning',
    label: '용도지역',
    description: '용도지역 및 규제 확인 중...',
  },
  {
    status: 'calculating_massing',
    label: '볼륨 계산',
    description: '건축 가능 볼륨 산출 중...',
  },
]

function AddressInput() {
  const { address, status, analyze, setAddress } = useFeasibilityStore()
  const [inputValue, setInputValue] = useState(address)
  const [showValidation, setShowValidation] = useState(false)

  const isLoading = status !== 'idle' && status !== 'complete' && status !== 'error'

  // Validate address on change
  const validation = useMemo(() => {
    if (!inputValue.trim()) return null
    return validateAddress(inputValue)
  }, [inputValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    // Format and analyze
    const formattedAddress = formatAddress(inputValue)
    analyze(formattedAddress)
    setShowValidation(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setAddress(e.target.value)
    setShowValidation(true)
  }

  const handleInputBlur = () => {
    // Hide validation on blur if input is empty
    if (!inputValue.trim()) {
      setShowValidation(false)
    }
  }

  // Calculate current step index
  const currentStepIndex = ANALYSIS_STEPS.findIndex(step => step.status === status)
  const progressPercent = currentStepIndex >= 0
    ? ((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100
    : 0

  return (
    <div className="address-input-container">
      <h2 className="section-title">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        주소 입력
      </h2>
      <p className="section-description">
        분석하고자 하는 서울 지역 주소를 입력하세요
      </p>

      <form onSubmit={handleSubmit} className="address-form">
        <div className="input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="예: 서울특별시 강남구 역삼동 123-45"
            disabled={isLoading}
            className={`address-input ${validation && showValidation ? (validation.isValid ? 'valid' : validation.errors.length > 0 ? 'invalid' : 'warning') : ''}`}
            aria-label="분석할 주소"
            aria-invalid={validation && !validation.isValid && validation.errors.length > 0 ? true : undefined}
          />
          {isLoading && (
            <div className="input-spinner" aria-hidden="true" />
          )}
          {!isLoading && inputValue.trim() && validation && showValidation && (
            <div className={`input-status-icon ${validation.isValid ? 'valid' : validation.errors.length > 0 ? 'invalid' : 'warning'}`}>
              {validation.isValid ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : validation.errors.length > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Validation feedback */}
        {showValidation && validation && !isLoading && (
          <div className={`validation-feedback ${validation.isValid ? 'valid' : validation.errors.length > 0 ? 'error' : 'warning'}`}>
            {validation.errors.length > 0 && (
              <div className="validation-errors">
                {validation.errors.map((error, idx) => (
                  <span key={idx} className="validation-message error">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                  </span>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="validation-warnings">
                {validation.warnings.map((warning, idx) => (
                  <span key={idx} className="validation-message warning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {warning}
                  </span>
                ))}
              </div>
            )}
            {validation.suggestions.length > 0 && validation.errors.length > 0 && (
              <div className="validation-suggestions">
                {validation.suggestions.slice(0, 2).map((suggestion, idx) => (
                  <span key={idx} className="validation-suggestion">
                    {suggestion}
                  </span>
                ))}
              </div>
            )}
            {validation.isValid && validation.parsed && (
              <div className="validation-parsed">
                <span className="parsed-label">인식된 주소:</span>
                <span className="parsed-value">
                  {validation.parsed.sido}
                  {validation.parsed.sigungu && ` ${validation.parsed.sigungu}`}
                  {validation.parsed.dong && ` ${validation.parsed.dong}`}
                  {validation.parsed.jibun && ` ${validation.parsed.jibun}`}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || (validation?.errors.length ?? 0) > 0}
          className="analyze-button"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              분석 중...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              분석하기
            </>
          )}
        </button>
      </form>

      {/* Progress indicator */}
      {isLoading && (
        <div className="analysis-progress" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-header">
            <span className="progress-title">분석 진행 중</span>
            <span className="progress-percent">{Math.round(progressPercent)}%</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="progress-steps">
            {ANALYSIS_STEPS.map((step, idx) => {
              const isComplete = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex
              const isPending = idx > currentStepIndex

              return (
                <div
                  key={step.status}
                  className={`progress-step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
                >
                  <div className="step-indicator">
                    {isComplete ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isCurrent ? (
                      <div className="step-spinner" />
                    ) : (
                      <span className="step-number">{idx + 1}</span>
                    )}
                  </div>
                  <div className="step-content">
                    <span className="step-label">{step.label}</span>
                    {isCurrent && <span className="step-description">{step.description}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="address-examples">
        <span className="examples-label">예시 주소:</span>
        <button
          type="button"
          onClick={() => {
            setInputValue('서울특별시 강남구 역삼동 123-45')
            setAddress('서울특별시 강남구 역삼동 123-45')
          }}
          className="example-button"
        >
          강남구 역삼동
        </button>
        <button
          type="button"
          onClick={() => {
            setInputValue('서울특별시 종로구 세종대로 209')
            setAddress('서울특별시 종로구 세종대로 209')
          }}
          className="example-button"
        >
          종로구 세종대로
        </button>
        <button
          type="button"
          onClick={() => {
            setInputValue('서울특별시 마포구 상암동 1600')
            setAddress('서울특별시 마포구 상암동 1600')
          }}
          className="example-button"
        >
          마포구 상암동
        </button>
      </div>
    </div>
  )
}

export default AddressInput
