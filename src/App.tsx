import Header from './components/Header'
import AddressInput from './components/AddressInput'
import ParcelInfo from './components/ParcelInfo'
import ZoningInfo from './components/ZoningInfo'
import ZoningOverride from './components/ZoningOverride'
import MassingViewer from './components/MassingViewer'
import ConfidencePanel from './components/ConfidencePanel'
import LegalCitations from './components/LegalCitations'
import DataSourcePanel from './components/DataSourcePanel'
import ErrorPanel from './components/ErrorPanel'
import LegalDisclaimer from './components/LegalDisclaimer'
import { useFeasibilityStore } from './stores/feasibilityStore'
import './App.css'

function App() {
  const { status } = useFeasibilityStore()

  return (
    <div className="app">
      <Header />

      <main id="main-content" className="app-main" role="main" aria-label="도시개발 타당성 분석">
        {/* Sidebar with input and results */}
        <aside className="app-sidebar" role="region" aria-label="분석 입력 및 결과">
          <AddressInput />

          {/* Error display */}
          <ErrorPanel />

          {/* Analysis results - only show when not in error state */}
          {status !== 'idle' && status !== 'error' && (
            <section aria-label="분석 결과">
              <ParcelInfo />
              <ZoningInfo />
              <ZoningOverride />
              <ConfidencePanel />
              <LegalCitations />
              <DataSourcePanel />
            </section>
          )}
        </aside>

        {/* 3D Viewer */}
        <section className="app-viewer" role="region" aria-label="3D 건축 볼륨 뷰어">
          <MassingViewer />
        </section>
      </main>

      <LegalDisclaimer />
    </div>
  )
}

export default App
