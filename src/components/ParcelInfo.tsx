import { useFeasibilityStore } from '../stores/feasibilityStore'
import './ParcelInfo.css'

function ParcelInfo() {
  const { parcel, status } = useFeasibilityStore()

  if (!parcel && status !== 'fetching_parcel') {
    return null
  }

  if (!parcel) {
    return (
      <div className="parcel-info loading">
        <div className="loading-skeleton" />
      </div>
    )
  }

  return (
    <div className="parcel-info">
      <h3 className="panel-title">필지 정보</h3>

      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">주소</span>
          <span className="info-value">{parcel.address.full}</span>
        </div>

        <div className="info-item">
          <span className="info-label">필지번호 (PNU)</span>
          <span className="info-value mono">{parcel.pnu}</span>
        </div>

        <div className="info-item">
          <span className="info-label">대지면적</span>
          <span className="info-value highlight">
            {parcel.area.toLocaleString()} m²
          </span>
        </div>

        <div className="info-item">
          <span className="info-label">행정구역</span>
          <span className="info-value">
            {parcel.address.sido} {parcel.address.sigungu}
          </span>
        </div>
      </div>

      <div className="info-note">
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
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>대지면적은 추정값입니다. 정확한 면적은 지적도를 확인하세요.</span>
      </div>
    </div>
  )
}

export default ParcelInfo
