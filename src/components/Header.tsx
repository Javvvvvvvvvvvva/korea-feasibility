import './Header.css'

const CITY = import.meta.env.VITE_CITY || 'SEOUL'
const VERSION = import.meta.env.VITE_VERSION || 'v1'

function Header() {
  return (
    <>
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>

      <header className="header" role="banner">
        <div className="header-brand">
          <h1 className="header-title">
            <span className="header-flag" aria-hidden="true">🇰🇷</span>
            <span className="visually-hidden">한국 </span>
            Korea ({CITY} {VERSION})
          </h1>
          <span className="header-subtitle">도시개발 타당성 분석</span>
        </div>

        <div className="header-status" role="status" aria-live="polite">
          <span className="status-badge status-ready">
            <span className="visually-hidden">현재 상태: </span>
            서울 데이터 활성화
          </span>
        </div>
      </header>
    </>
  )
}

export default Header
