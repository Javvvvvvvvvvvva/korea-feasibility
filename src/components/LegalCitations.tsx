import { useState } from 'react'
import { useFeasibilityStore } from '../stores/feasibilityStore'
import './LegalCitations.css'

/**
 * Legal basis data for Korean urban planning regulations
 */
const LEGAL_REFERENCES = {
  primary: {
    name: '국토의 계획 및 이용에 관한 법률',
    shortName: '국토계획법',
    number: '법률 제19558호',
    lastAmended: '2023.07.18',
    articles: {
      zoning: {
        article: '제36조',
        title: '용도지역의 지정',
        summary: '도시·군관리계획으로 용도지역을 지정',
      },
      bcr: {
        article: '제77조',
        title: '건폐율',
        summary: '용도지역에서 건축물이 차지할 수 있는 대지면적의 비율',
      },
      far: {
        article: '제78조',
        title: '용적률',
        summary: '용도지역에서 건축물의 연면적 총량의 비율',
      },
    },
  },
  enforcement: {
    name: '국토의 계획 및 이용에 관한 법률 시행령',
    shortName: '국토계획법 시행령',
    number: '대통령령 제33717호',
    lastAmended: '2023.08.22',
    articles: {
      zoningTypes: {
        article: '제30조',
        title: '용도지역의 세분',
        summary: '주거·상업·공업·녹지지역의 세분',
      },
      bcrLimits: {
        article: '제84조',
        title: '건폐율의 최대한도',
        summary: '용도지역별 건폐율 최대한도 규정',
      },
      farLimits: {
        article: '제85조',
        title: '용적률의 최대한도',
        summary: '용도지역별 용적률 최대한도 규정',
      },
    },
  },
  seoul: {
    name: '서울특별시 도시계획 조례',
    shortName: '서울시 조례',
    number: '서울특별시조례 제8442호',
    lastAmended: '2023.09.28',
    articles: {
      bcr: {
        article: '제54조',
        title: '건폐율',
        summary: '서울시 용도지역별 건폐율 기준',
      },
      far: {
        article: '제55조',
        title: '용적률',
        summary: '서울시 용도지역별 용적률 기준',
      },
    },
  },
  building: {
    name: '건축법',
    shortName: '건축법',
    number: '법률 제19409호',
    lastAmended: '2023.04.18',
    articles: {
      height: {
        article: '제60조',
        title: '건축물의 높이 제한',
        summary: '일조 등의 확보를 위한 건축물 높이 제한',
      },
      setback: {
        article: '제61조',
        title: '일조 등의 확보를 위한 건축물의 높이 제한',
        summary: '인접 대지경계선으로부터의 건축물 높이 제한',
      },
    },
  },
}

function LegalCitations() {
  const { zoning, status } = useFeasibilityStore()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  if (status !== 'complete' || !zoning) return null

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="legal-citations">
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        법적 근거
      </h3>

      {/* Primary Law */}
      <div className="citation-section">
        <button
          className={`section-header ${expandedSection === 'primary' ? 'expanded' : ''}`}
          onClick={() => toggleSection('primary')}
        >
          <div className="header-content">
            <span className="law-name">{LEGAL_REFERENCES.primary.shortName}</span>
            <span className="law-number">{LEGAL_REFERENCES.primary.number}</span>
          </div>
          <svg
            className="expand-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {expandedSection === 'primary' && (
          <div className="section-content">
            <p className="full-name">{LEGAL_REFERENCES.primary.name}</p>
            <p className="amended">최종 개정: {LEGAL_REFERENCES.primary.lastAmended}</p>
            <div className="articles">
              {Object.entries(LEGAL_REFERENCES.primary.articles).map(([key, article]) => (
                <div key={key} className="article-item">
                  <span className="article-number">{article.article}</span>
                  <span className="article-title">{article.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Seoul Ordinance */}
      <div className="citation-section">
        <button
          className={`section-header ${expandedSection === 'seoul' ? 'expanded' : ''}`}
          onClick={() => toggleSection('seoul')}
        >
          <div className="header-content">
            <span className="law-name">{LEGAL_REFERENCES.seoul.shortName}</span>
            <span className="law-number">{LEGAL_REFERENCES.seoul.number}</span>
          </div>
          <svg
            className="expand-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {expandedSection === 'seoul' && (
          <div className="section-content">
            <p className="full-name">{LEGAL_REFERENCES.seoul.name}</p>
            <p className="amended">최종 개정: {LEGAL_REFERENCES.seoul.lastAmended}</p>
            <div className="articles">
              {Object.entries(LEGAL_REFERENCES.seoul.articles).map(([key, article]) => (
                <div key={key} className="article-item">
                  <span className="article-number">{article.article}</span>
                  <span className="article-title">{article.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Applied Regulations Summary */}
      <div className="applied-regulations">
        <h4>적용된 규제</h4>
        <div className="regulation-item">
          <span className="reg-label">용도지역</span>
          <span className="reg-value">{zoning.name}</span>
          <span className="reg-basis">국토계획법 제36조</span>
        </div>
        <div className="regulation-item">
          <span className="reg-label">용적률</span>
          <span className="reg-value">{zoning.regulations.far.value}%</span>
          <span className="reg-basis">{zoning.regulations.far.legalBasis || '서울시 조례 제55조'}</span>
        </div>
        <div className="regulation-item">
          <span className="reg-label">건폐율</span>
          <span className="reg-value">{zoning.regulations.bcr.value}%</span>
          <span className="reg-basis">{zoning.regulations.bcr.legalBasis || '서울시 조례 제54조'}</span>
        </div>
      </div>

      {/* External Links */}
      <div className="external-links">
        <h4>공식 자료 확인</h4>
        <a
          href="https://www.law.go.kr/법령/국토의계획및이용에관한법률"
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          <span>국가법령정보센터</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <a
          href="https://www.eum.go.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          <span>토지이음 (LURIS)</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <a
          href="https://www.eais.go.kr/"
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          <span>건축행정시스템 (세움터)</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default LegalCitations
