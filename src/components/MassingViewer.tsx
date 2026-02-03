import { useRef, useState, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Environment,
  Text,
  Line,
} from '@react-three/drei'
import * as THREE from 'three'
import { useFeasibilityStore } from '../stores/feasibilityStore'
import type { Parcel, MassingResult } from '../types'
import './MassingViewer.css'

// Camera preset configurations
const CAMERA_PRESETS = {
  birdseye: {
    position: [60, 80, 60] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    name: '조감도',
  },
  front: {
    position: [0, 20, 80] as [number, number, number],
    target: [0, 15, 0] as [number, number, number],
    name: '정면',
  },
  side: {
    position: [80, 20, 0] as [number, number, number],
    target: [0, 15, 0] as [number, number, number],
    name: '측면',
  },
  top: {
    position: [0, 120, 0.1] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    name: '평면',
  },
}

type CameraPresetKey = keyof typeof CAMERA_PRESETS

function MassingViewer() {
  const { parcel, massing, zoning, status } = useFeasibilityStore()
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('birdseye')

  const isLoading = status === 'calculating_massing'
  const hasData = parcel && massing

  return (
    <div className="massing-viewer">
      {!hasData && !isLoading && (
        <div className="viewer-placeholder">
          <div className="placeholder-content">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <h3>3D 매싱 뷰어</h3>
            <p>주소를 입력하면 건축 가능 볼륨이 여기에 표시됩니다</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="viewer-loading">
          <div className="loading-spinner" />
          <span>매싱 계산 중...</span>
        </div>
      )}

      {hasData && (
        <>
          <Canvas shadows>
            <SceneContent
              parcel={parcel}
              massing={massing}
              activePreset={activePreset}
              zoningName={zoning?.name}
            />
          </Canvas>

          <div className="viewer-controls">
            <div className="camera-presets">
              <span className="presets-label">카메라:</span>
              {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map((key) => (
                <button
                  key={key}
                  className={`preset-button ${activePreset === key ? 'active' : ''}`}
                  onClick={() => setActivePreset(key)}
                >
                  {CAMERA_PRESETS[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="viewer-legend">
            <div className="legend-item">
              <span className="legend-color parcel" />
              <span>대지</span>
            </div>
            <div className="legend-item">
              <span className="legend-color envelope" />
              <span>건축가능 볼륨</span>
            </div>
            <div className="legend-item">
              <span className="legend-color context" />
              <span>주변 건물</span>
            </div>
            <div className="legend-item">
              <span className="legend-color road" />
              <span>도로</span>
            </div>
          </div>

          {/* Stats overlay */}
          <div className="viewer-stats">
            <div className="stat-item">
              <span className="stat-label">연면적</span>
              <span className="stat-value">
                {massing.statistics.grossFloorArea.toLocaleString()} m²
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">층수</span>
              <span className="stat-value">{massing.statistics.estimatedFloors}F</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">높이</span>
              <span className="stat-value">{massing.envelope.maxHeight.toFixed(1)}m</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Scene content component
function SceneContent({
  parcel,
  massing,
  activePreset,
}: {
  parcel: Parcel
  massing: MassingResult
  activePreset: CameraPresetKey
  zoningName?: string
}) {
  const controlsRef = useRef<any>(null)

  return (
    <>
      <CameraController preset={activePreset} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={20}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight position={[-30, 50, -30]} intensity={0.3} />

      {/* Environment */}
      <Environment preset="city" />

      {/* Sky gradient */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#e8eef4" />
      </mesh>

      {/* Ground Grid */}
      <Grid
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#cbd5e0"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#a0aec0"
        fadeDistance={150}
        fadeStrength={1}
        followCamera={false}
        position={[0, 0.01, 0]}
      />

      {/* Roads */}
      <Roads />

      {/* Parcel Ground */}
      <ParcelGround parcel={parcel} />

      {/* Building Envelope */}
      <BuildingEnvelope massing={massing} />

      {/* Setback lines */}
      <SetbackLines parcel={parcel} massing={massing} />

      {/* Context Buildings */}
      <ContextBuildings parcel={parcel} />

      {/* North Arrow */}
      <NorthArrow />

      {/* Scale Bar */}
      <ScaleBar />
    </>
  )
}

// Camera controller for smooth transitions
function CameraController({
  preset,
  controlsRef,
}: {
  preset: CameraPresetKey
  controlsRef: React.RefObject<any>
}) {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())

  useFrame(() => {
    const presetConfig = CAMERA_PRESETS[preset]
    targetPosition.current.set(...presetConfig.position)
    targetLookAt.current.set(...presetConfig.target)

    // Smooth camera movement
    camera.position.lerp(targetPosition.current, 0.05)

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.05)
      controlsRef.current.update()
    }
  })

  return null
}

// Parcel ground mesh
function ParcelGround({ parcel }: { parcel: Parcel }) {
  const geometry = useMemo(() => {
    const coords = parcel.geometry.coordinates[0]
    const scale = 100000

    const lngs = coords.map((c: number[]) => c[0])
    const lats = coords.map((c: number[]) => c[1])
    const width = (Math.max(...lngs) - Math.min(...lngs)) * scale
    const depth = (Math.max(...lats) - Math.min(...lats)) * scale

    return { width: width || 20, depth: depth || 25 }
  }, [parcel])

  return (
    <group>
      {/* Parcel fill */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[geometry.width, geometry.depth]} />
        <meshStandardMaterial color="#f0f4f8" transparent opacity={0.9} />
      </mesh>

      {/* Parcel boundary */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[geometry.width + 0.3, geometry.depth + 0.3]} />
        <meshBasicMaterial color="#1a365d" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[geometry.width, geometry.depth]} />
        <meshBasicMaterial color="#f0f4f8" />
      </mesh>
    </group>
  )
}

// Building envelope mesh with floor plates
function BuildingEnvelope({ massing }: { massing: MassingResult }) {
  const { width, depth, displayHeight, floors } = useMemo(() => {
    const footprint = massing.envelope.footprint
    const lngs = footprint.map((p: number[]) => p[0])
    const lats = footprint.map((p: number[]) => p[1])

    const scale = 100000
    const w = (Math.max(...lngs) - Math.min(...lngs)) * scale || 12
    const d = (Math.max(...lats) - Math.min(...lats)) * scale || 18

    const h = massing.envelope.maxHeight * 0.5
    const f = massing.statistics.estimatedFloors

    return { width: w, depth: d, displayHeight: h, floors: f }
  }, [massing])

  const floorHeight = displayHeight / floors

  return (
    <group>
      {/* Main building volume */}
      <mesh position={[0, displayHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, displayHeight, depth]} />
        <meshStandardMaterial
          color="#3182ce"
          transparent
          opacity={0.6}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Floor plate lines */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={i} position={[0, (i + 1) * floorHeight, 0]}>
          <boxGeometry args={[width + 0.1, 0.15, depth + 0.1]} />
          <meshStandardMaterial color="#2c5282" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Roof */}
      <mesh position={[0, displayHeight + 0.1, 0]}>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial color="#1a365d" />
      </mesh>

      {/* Wireframe overlay */}
      <lineSegments position={[0, displayHeight / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(width, displayHeight, depth)]} />
        <lineBasicMaterial color="#1a365d" transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

// Setback indicator lines
function SetbackLines({ parcel, massing }: { parcel: Parcel; massing: MassingResult }) {
  const lines = useMemo(() => {
    const coords = parcel.geometry.coordinates[0]
    const scale = 100000

    const lngs = coords.map((c: number[]) => c[0])
    const lats = coords.map((c: number[]) => c[1])
    const halfW = ((Math.max(...lngs) - Math.min(...lngs)) * scale) / 2 || 10
    const halfD = ((Math.max(...lats) - Math.min(...lats)) * scale) / 2 || 12.5

    const setbacks = massing.envelope.setbacks
    const metersToScale = 1 // Already in meters for display

    return [
      // Front setback
      {
        points: [
          [-halfW, 0.1, halfD - setbacks.front * metersToScale],
          [halfW, 0.1, halfD - setbacks.front * metersToScale],
        ],
        color: '#e53e3e',
      },
      // Rear setback
      {
        points: [
          [-halfW, 0.1, -halfD + setbacks.rear * metersToScale],
          [halfW, 0.1, -halfD + setbacks.rear * metersToScale],
        ],
        color: '#e53e3e',
      },
      // Left setback
      {
        points: [
          [-halfW + setbacks.left * metersToScale, 0.1, -halfD],
          [-halfW + setbacks.left * metersToScale, 0.1, halfD],
        ],
        color: '#dd6b20',
      },
      // Right setback
      {
        points: [
          [halfW - setbacks.right * metersToScale, 0.1, -halfD],
          [halfW - setbacks.right * metersToScale, 0.1, halfD],
        ],
        color: '#dd6b20',
      },
    ]
  }, [parcel, massing])

  return (
    <group>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points as [number, number, number][]}
          color={line.color}
          lineWidth={2}
          dashed
          dashSize={1}
          gapSize={0.5}
        />
      ))}
    </group>
  )
}

// Context buildings based on parcel location
function ContextBuildings({ parcel }: { parcel: Parcel }) {
  const buildings = useMemo(() => {
    // Generate context buildings based on district typical density
    const district = parcel.address.sigungu

    // High-density districts get taller neighbors
    const isHighDensity = ['강남구', '서초구', '송파구', '영등포구', '중구', '종로구'].includes(
      district
    )
    const isMediumDensity = ['마포구', '용산구', '성동구', '광진구'].includes(district)

    const baseHeight = isHighDensity ? 25 : isMediumDensity ? 15 : 10
    const heightVariance = isHighDensity ? 20 : isMediumDensity ? 10 : 5

    return [
      // Front neighbors (across the road)
      {
        position: [-25, 0, 45] as [number, number, number],
        size: [18, baseHeight + Math.random() * heightVariance, 14] as [number, number, number],
      },
      {
        position: [25, 0, 45] as [number, number, number],
        size: [20, baseHeight + Math.random() * heightVariance, 16] as [number, number, number],
      },
      // Side neighbors
      {
        position: [-45, 0, 0] as [number, number, number],
        size: [15, baseHeight + Math.random() * heightVariance * 0.7, 22] as [number, number, number],
      },
      {
        position: [45, 0, 0] as [number, number, number],
        size: [16, baseHeight + Math.random() * heightVariance * 0.7, 20] as [number, number, number],
      },
      // Rear neighbors
      {
        position: [-20, 0, -40] as [number, number, number],
        size: [14, baseHeight * 0.8 + Math.random() * heightVariance * 0.5, 12] as [number, number, number],
      },
      {
        position: [20, 0, -40] as [number, number, number],
        size: [16, baseHeight * 0.8 + Math.random() * heightVariance * 0.5, 14] as [number, number, number],
      },
      // Corner buildings
      {
        position: [-50, 0, 50] as [number, number, number],
        size: [12, baseHeight * 0.6, 12] as [number, number, number],
      },
      {
        position: [50, 0, -45] as [number, number, number],
        size: [14, baseHeight * 0.7, 14] as [number, number, number],
      },
    ]
  }, [parcel])

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.position[0], b.size[1] / 2, b.position[2]]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial
              color="#94a3b8"
              transparent
              opacity={0.7}
              metalness={0.1}
              roughness={0.9}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...b.size)]} />
            <lineBasicMaterial color="#64748b" transparent opacity={0.3} />
          </lineSegments>
        </group>
      ))}
    </group>
  )
}

// Road visualization
function Roads() {
  return (
    <group>
      {/* Main road (front) */}
      <mesh position={[0, 0.005, 35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 12]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      {/* Road markings */}
      <mesh position={[0, 0.01, 35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 0.3]} />
        <meshBasicMaterial color="#f7fafc" />
      </mesh>

      {/* Side road */}
      <mesh position={[-35, 0.005, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[80, 8]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* Sidewalks */}
      <mesh position={[0, 0.008, 28]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 3]} />
        <meshStandardMaterial color="#cbd5e0" />
      </mesh>
      <mesh position={[-30, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 60]} />
        <meshStandardMaterial color="#cbd5e0" />
      </mesh>
    </group>
  )
}

// North arrow indicator
function NorthArrow() {
  return (
    <group position={[80, 0, -80]}>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.15, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[1.5, 4, 3]} />
        <meshBasicMaterial color="#c53030" />
      </mesh>
      <Text
        position={[0, 0.2, -5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2}
        color="#1a365d"
        anchorX="center"
        anchorY="middle"
      >
        N
      </Text>
    </group>
  )
}

// Scale bar
function ScaleBar() {
  return (
    <group position={[70, 0.1, 80]}>
      {/* 10m scale bar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 1]} />
        <meshBasicMaterial color="#1a365d" />
      </mesh>
      <Text
        position={[0, 0.1, 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.5}
        color="#1a365d"
        anchorX="center"
        anchorY="middle"
      >
        10m
      </Text>
    </group>
  )
}

export default MassingViewer
