import { useFeasibilityStore } from '../stores/feasibilityStore'
import { isVWorldAvailable, isDataGoKrAvailable } from '../adapters/korea/api'
import './DataSourcePanel.css'

type SourceStatus = 'active' | 'simulated' | 'unavailable' | 'error' | 'needs_key'
type SourceType = 'api' | 'calculated' | 'hardcoded'

interface DataSource {
  name: string
  type: SourceType
  status: SourceStatus
  note: string
  realSource: string
}

interface DataCategory {
  name: string
  description: string
  sources: DataSource[]
}

/**
 * Get dynamic data source definitions based on API availability
 */
function getDataSources(): Record<string, DataCategory> {
  const vworldAvailable = isVWorldAvailable()
  const dataGoKrAvailable = isDataGoKrAvailable()

  return {
    address: {
      name: '주소 해석',
      description: '한국 주소를 좌표 및 행정구역으로 변환',
      sources: [
        {
          name: '지오코딩 서비스',
          type: 'api',
          status: 'simulated',
          note: '패턴 기반 해석 사용 (향후 Kakao/Naver API 연동 예정)',
          realSource: 'VWORLD API / Kakao 지도 API',
        },
      ],
    },
    parcel: {
      name: '필지 정보',
      description: '대지 경계, 면적, 필지고유번호(PNU)',
      sources: [
        {
          name: '연속지적도 (VWorld)',
          type: 'api',
          status: vworldAvailable ? 'active' : 'needs_key',
          note: vworldAvailable
            ? 'VWorld Data API 2.0으로 실제 필지 폴리곤 조회 중'
            : 'VITE_VWORLD_API_KEY 환경변수 설정 필요',
          realSource: 'api.vworld.kr (LP_PA_CBND_BUBUN)',
        },
        {
          name: '연속지적도 (data.go.kr)',
          type: 'api',
          status: dataGoKrAvailable ? 'active' : 'needs_key',
          note: dataGoKrAvailable
            ? 'data.go.kr WFS API로 실제 필지 폴리곤 조회 가능'
            : 'VITE_DATA_GO_KR_API_KEY 환경변수 설정 필요',
          realSource: 'apis.data.go.kr/1611000/nsdi/CadastralService',
        },
      ],
    },
    zoning: {
      name: '용도지역',
      description: '국토계획법에 따른 용도지역 분류',
      sources: [
        {
          name: '도시지역 (VWorld)',
          type: 'api',
          status: vworldAvailable ? 'active' : 'needs_key',
          note: vworldAvailable
            ? 'VWorld WFS API로 실제 용도지역 조회 중'
            : 'VITE_VWORLD_API_KEY 환경변수 설정 필요',
          realSource: 'api.vworld.kr (LT_C_UQ111)',
        },
        {
          name: '토지이용규제정보 (data.go.kr)',
          type: 'api',
          status: dataGoKrAvailable ? 'active' : 'needs_key',
          note: dataGoKrAvailable
            ? 'LuArinfoService API로 실제 규제정보 조회 가능'
            : 'VITE_DATA_GO_KR_API_KEY 환경변수 설정 필요',
          realSource: 'apis.data.go.kr/1611000/LuArinfoService',
        },
      ],
    },
    regulations: {
      name: '건축 규제',
      description: '용적률, 건폐율, 높이제한',
      sources: [
        {
          name: '토지이용규제정보서비스',
          type: 'api',
          status: dataGoKrAvailable ? 'active' : 'needs_key',
          note: dataGoKrAvailable
            ? 'PNU 기반 실제 행위제한 정보 조회'
            : 'VITE_DATA_GO_KR_API_KEY 환경변수 설정 필요',
          realSource: 'apis.data.go.kr/1611000/LuArinfoService',
        },
        {
          name: '서울시 조례 (대체)',
          type: 'hardcoded',
          status: dataGoKrAvailable ? 'unavailable' : 'active',
          note: '2023년 기준 서울시 도시계획 조례 반영',
          realSource: '서울특별시 도시계획 조례 제54조, 제55조',
        },
        {
          name: '국토계획법 시행령',
          type: 'hardcoded',
          status: 'active',
          note: '전국 기준 상한값',
          realSource: '국토계획법 시행령 제84조, 제85조',
        },
      ],
    },
    massing: {
      name: '매싱 계산',
      description: '건축 가능 볼륨 산출',
      sources: [
        {
          name: '이격거리 계산',
          type: 'calculated',
          status: 'active',
          note: '건축법 기준 최소 이격거리 적용',
          realSource: '건축법 제58조, 건축법 시행령 제80조',
        },
        {
          name: '층수 계산',
          type: 'calculated',
          status: 'active',
          note: '층고 3.5m 기준 (상업시설 기준)',
          realSource: '일반적 건축 관행',
        },
      ],
    },
  }
}

function getStatusBadge(status: SourceStatus) {
  switch (status) {
    case 'active':
      return { label: 'OK', className: 'status-active' }
    case 'simulated':
      return { label: '모의', className: 'status-simulated' }
    case 'unavailable':
      return { label: '미사용', className: 'status-unavailable' }
    case 'error':
      return { label: '오류', className: 'status-error' }
    case 'needs_key':
      return { label: 'API 키 필요', className: 'status-needs-key' }
  }
}

function getTypeLabel(type: SourceType) {
  switch (type) {
    case 'api':
      return 'API'
    case 'calculated':
      return '계산'
    case 'hardcoded':
      return '기준값'
  }
}

function DataSourcePanel() {
  const { status } = useFeasibilityStore()
  const dataSources = getDataSources()
  const vworldAvailable = isVWorldAvailable()
  const dataGoKrAvailable = isDataGoKrAvailable()
  const anyApiConnected = vworldAvailable || dataGoKrAvailable

  if (status !== 'complete') return null

  return (
    <div className="data-source-panel">
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
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        데이터 출처
        {anyApiConnected && (
          <span className="api-connected-badge">
            {vworldAvailable && dataGoKrAvailable
              ? 'VWorld + data.go.kr 연결'
              : vworldAvailable
              ? 'VWorld 연결'
              : 'data.go.kr 연결'}
          </span>
        )}
      </h3>

      <p className="panel-description">
        분석에 사용된 데이터 소스와 현재 연결 상태입니다
      </p>

      <div className="source-categories">
        {Object.entries(dataSources).map(([key, category]) => (
          <div key={key} className="source-category">
            <div className="category-header">
              <span className="category-name">{category.name}</span>
              <span className="category-description">{category.description}</span>
            </div>

            <div className="source-list">
              {category.sources.map((source, idx) => {
                const statusBadge = getStatusBadge(source.status)
                return (
                  <div key={idx} className="source-item">
                    <div className="source-header">
                      <span className="source-name">{source.name}</span>
                      <div className="source-badges">
                        <span className="source-type">{getTypeLabel(source.type)}</span>
                        <span className={`source-status ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                    <p className="source-note">{source.note}</p>
                    <p className="source-real">
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
                      {source.realSource}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Data freshness indicator */}
      <div className="data-freshness">
        <h4>데이터 기준일</h4>
        <div className="freshness-items">
          <div className="freshness-item">
            <span className="freshness-label">서울시 조례</span>
            <span className="freshness-date">2023.09.28</span>
          </div>
          <div className="freshness-item">
            <span className="freshness-label">국토계획법 시행령</span>
            <span className="freshness-date">2023.08.22</span>
          </div>
          <div className="freshness-item">
            <span className="freshness-label">건축법</span>
            <span className="freshness-date">2023.04.18</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="source-disclaimer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          {anyApiConnected
            ? `실제 데이터 API 연결됨: ${[
                vworldAvailable && 'VWorld (필지/용도지역)',
                dataGoKrAvailable && 'data.go.kr (규제정보)',
              ]
                .filter(Boolean)
                .join(', ')}`
            : '\'API 키 필요\' 상태의 데이터 소스를 사용하려면 .env 파일에 VITE_VWORLD_API_KEY 또는 VITE_DATA_GO_KR_API_KEY를 설정하세요.'}
        </span>
      </div>
    </div>
  )
}

export default DataSourcePanel
