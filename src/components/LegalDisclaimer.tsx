import { useState } from 'react'
import './LegalDisclaimer.css'

/**
 * Comprehensive legal references with specific articles
 */
const LEGAL_REFERENCES = {
  planning: {
    name: '국토의 계획 및 이용에 관한 법률',
    shortName: '국토계획법',
    number: '법률 제19558호',
    articles: [
      { num: '제36조', title: '용도지역의 지정', description: '도시·군관리계획으로 용도지역을 지정' },
      { num: '제77조', title: '건폐율', description: '용도지역에서의 건폐율 한도 규정' },
      { num: '제78조', title: '용적률', description: '용도지역에서의 용적률 한도 규정' },
    ],
  },
  planningDecree: {
    name: '국토의 계획 및 이용에 관한 법률 시행령',
    shortName: '국토계획법 시행령',
    number: '대통령령 제33717호',
    articles: [
      { num: '제30조', title: '용도지역의 세분', description: '주거·상업·공업·녹지지역의 세부 분류' },
      { num: '제84조', title: '건폐율의 최대한도', description: '용도지역별 건폐율 상한 규정' },
      { num: '제85조', title: '용적률의 최대한도', description: '용도지역별 용적률 상한 규정' },
    ],
  },
  building: {
    name: '건축법',
    shortName: '건축법',
    number: '법률 제19409호',
    articles: [
      { num: '제58조', title: '대지 안의 공지', description: '건축선 및 인접 대지경계선으로부터의 이격거리' },
      { num: '제60조', title: '건축물의 높이 제한', description: '도로 폭에 따른 높이 제한 (도로사선)' },
      { num: '제61조', title: '일조 등의 확보를 위한 건축물의 높이 제한', description: '정북방향 인접 대지경계선으로부터의 높이 제한' },
    ],
  },
  seoulOrdinance: {
    name: '서울특별시 도시계획 조례',
    shortName: '서울시 조례',
    number: '서울특별시조례 제8442호',
    articles: [
      { num: '제54조', title: '건폐율', description: '서울시 용도지역별 건폐율 기준' },
      { num: '제55조', title: '용적률', description: '서울시 용도지역별 용적률 기준' },
    ],
  },
  urban: {
    name: '도시 및 주거환경정비법',
    shortName: '도시정비법',
    number: '법률 제19473호',
    articles: [
      { num: '제16조', title: '정비구역의 지정', description: '시장·군수가 정비계획을 수립하여 정비구역 지정' },
    ],
  },
}

const VERIFICATION_CHECKLIST = [
  {
    category: '필수 확인',
    items: [
      '토지이용계획확인서 (eum.go.kr)',
      '지구단위계획 확인',
      '정비구역 지정 여부',
      '건축물대장 확인',
    ],
  },
  {
    category: '추가 검토',
    items: [
      '문화재보호구역 여부',
      '군사시설보호구역 여부',
      '학교환경위생정화구역',
      '수질보전특별대책지역',
    ],
  },
  {
    category: '전문가 상담',
    items: [
      '건축사 사무소',
      '감정평가법인',
      '법무법인 (토지·건축)',
      '관할 구청 건축과',
    ],
  },
]

function LegalDisclaimer() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <footer className="legal-disclaimer">
      <div className="disclaimer-bar">
        <div className="disclaimer-summary">
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
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            <strong>예비 타당성 분석</strong> – 본 결과는 참고용이며 법적 효력이 없습니다.
            실제 건축 허가에는 추가 검토가 필요합니다.
          </span>
        </div>
        <button
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '접기' : '법적 근거 상세 보기'}
        </button>
      </div>

      {isExpanded && (
        <div className="disclaimer-details">
          <div className="disclaimer-content">
            {/* Legal Notice */}
            <section className="disclaimer-section">
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                법적 고지사항
              </h4>
              <p>
                본 도구는 부동산 개발 사업의 <strong>예비 타당성 검토</strong>를 위한
                참고 자료를 제공합니다. 본 분석 결과는 어떠한 법적 효력도 갖지 않으며,
                실제 건축 허가, 인허가 절차, 또는 투자 결정에 사용하기 전에
                반드시 공식 자료와 전문가 검토를 거쳐야 합니다.
              </p>
            </section>

            {/* Legal References */}
            <section className="disclaimer-section">
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                적용 법령 및 조항
              </h4>

              <div className="legal-refs-grid">
                {Object.entries(LEGAL_REFERENCES).map(([key, law]) => (
                  <div key={key} className="legal-ref-card">
                    <div className="law-header">
                      <span className="law-name">{law.shortName}</span>
                      <span className="law-number">{law.number}</span>
                    </div>
                    <div className="law-full-name">{law.name}</div>
                    <div className="law-articles">
                      {law.articles.map((article, idx) => (
                        <div key={idx} className="article-row">
                          <span className="article-num">{article.num}</span>
                          <span className="article-title">{article.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Verification Checklist */}
            <section className="disclaimer-section">
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                실제 건축 전 확인 사항
              </h4>

              <div className="checklist-grid">
                {VERIFICATION_CHECKLIST.map((section, idx) => (
                  <div key={idx} className="checklist-section">
                    <h5>{section.category}</h5>
                    <ul>
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Sources */}
            <section className="disclaimer-section">
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                데이터 출처 및 한계
              </h4>

              <div className="data-limitations">
                <div className="limitation-item">
                  <strong>용도지역</strong>
                  <p>구역 기반 추정값 사용. 실제 필지별 용도지역은 토지이음(LURIS)에서 확인 필요.</p>
                </div>
                <div className="limitation-item">
                  <strong>필지 형상</strong>
                  <p>직사각형으로 가정. 실제 지적도와 차이 존재.</p>
                </div>
                <div className="limitation-item">
                  <strong>높이제한</strong>
                  <p>일조권 사선제한, 도로사선제한 미반영. 실제 허용 높이 별도 확인 필요.</p>
                </div>
                <div className="limitation-item">
                  <strong>지구단위계획</strong>
                  <p>미반영. 지구단위계획 구역 내에서는 별도 규제 적용.</p>
                </div>
              </div>
            </section>

            {/* Official Resources */}
            <section className="disclaimer-section">
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                공식 자료 확인
              </h4>

              <div className="official-links">
                <a href="https://www.eum.go.kr/" target="_blank" rel="noopener noreferrer" className="official-link">
                  <span className="link-name">토지이음 (LURIS)</span>
                  <span className="link-desc">토지이용계획확인서 발급</span>
                </a>
                <a href="https://www.law.go.kr/" target="_blank" rel="noopener noreferrer" className="official-link">
                  <span className="link-name">국가법령정보센터</span>
                  <span className="link-desc">최신 법령 확인</span>
                </a>
                <a href="https://www.eais.go.kr/" target="_blank" rel="noopener noreferrer" className="official-link">
                  <span className="link-name">세움터</span>
                  <span className="link-desc">건축행정시스템</span>
                </a>
                <a href="https://urban.seoul.go.kr/" target="_blank" rel="noopener noreferrer" className="official-link">
                  <span className="link-name">서울시 도시계획포털</span>
                  <span className="link-desc">서울시 도시계획 정보</span>
                </a>
              </div>
            </section>

            {/* Version Info */}
            <div className="version-info">
              <span>데이터 기준: 2023년 9월</span>
              <span>서울시 v1.0</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default LegalDisclaimer
