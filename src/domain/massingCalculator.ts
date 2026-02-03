/**
 * Massing Calculator
 * 매싱 (건축 가능 볼륨) 계산기
 *
 * Calculates buildable envelope based on:
 * - Parcel geometry
 * - Zoning regulations (FAR, BCR, height limits)
 * - Setback requirements
 */

import type {
  Parcel,
  ZoningInfo,
  MassingResult,
  BuildingEnvelope,
  Setbacks,
  MassingStatistics,
} from '../types'

/**
 * Default setbacks by zoning category (meters)
 * Based on 건축법 시행령
 */
const DEFAULT_SETBACKS: Record<string, Setbacks> = {
  residential: { front: 3, rear: 2, left: 1.5, right: 1.5 },
  commercial: { front: 2, rear: 1.5, left: 1, right: 1 },
  industrial: { front: 3, rear: 2, left: 2, right: 2 },
  green: { front: 5, rear: 3, left: 3, right: 3 },
  management: { front: 3, rear: 2, left: 2, right: 2 },
  agricultural: { front: 3, rear: 2, left: 2, right: 2 },
  natural: { front: 5, rear: 3, left: 3, right: 3 },
}

/**
 * Typical floor height by use (meters)
 */
const FLOOR_HEIGHT = {
  residential: 3.0,
  commercial: 4.0,
  industrial: 5.0,
  default: 3.5,
}

/**
 * Calculate massing result from parcel and zoning data
 */
export function calculateMassing(
  parcel: Parcel,
  zoning: ZoningInfo
): MassingResult {
  const setbacks = getSetbacks(zoning.category)
  const buildableFootprint = calculateBuildableFootprint(parcel, setbacks)
  const buildingCoverage = calculateBuildingCoverage(parcel.area, zoning)
  const maxHeight = calculateMaxHeight(parcel.area, zoning, buildingCoverage)
  const statistics = calculateStatistics(
    parcel.area,
    buildingCoverage,
    maxHeight,
    zoning
  )

  const envelope: BuildingEnvelope = {
    footprint: buildableFootprint,
    maxHeight,
    setbacks,
  }

  // Determine overall confidence
  const confidence =
    zoning.regulations.far.confidence === 'high' &&
    zoning.regulations.bcr.confidence === 'high'
      ? 'high'
      : zoning.regulations.far.confidence === 'unknown' ||
        zoning.regulations.bcr.confidence === 'unknown'
      ? 'low'
      : 'medium'

  return {
    envelope,
    statistics,
    confidence,
  }
}

function getSetbacks(category: string): Setbacks {
  return DEFAULT_SETBACKS[category] || DEFAULT_SETBACKS.residential
}

/**
 * Calculate buildable footprint after applying setbacks
 * Returns coordinates in [lng, lat] format
 */
function calculateBuildableFootprint(
  parcel: Parcel,
  setbacks: Setbacks
): number[][] {
  const coords = parcel.geometry.coordinates[0]

  // Simplified: assume rectangular parcel aligned with axes
  // Calculate inset polygon based on setbacks

  const metersPerDegreeLng = 88000
  const metersPerDegreeLat = 111000

  // Convert setbacks to degrees
  const frontSetbackDeg = setbacks.front / metersPerDegreeLat
  const rearSetbackDeg = setbacks.rear / metersPerDegreeLat
  const leftSetbackDeg = setbacks.left / metersPerDegreeLng
  const rightSetbackDeg = setbacks.right / metersPerDegreeLng

  // Get bounding box
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  // Apply setbacks (assuming front is south, rear is north)
  return [
    [minLng + leftSetbackDeg, minLat + frontSetbackDeg],
    [maxLng - rightSetbackDeg, minLat + frontSetbackDeg],
    [maxLng - rightSetbackDeg, maxLat - rearSetbackDeg],
    [minLng + leftSetbackDeg, maxLat - rearSetbackDeg],
  ]
}

/**
 * Calculate maximum building coverage based on BCR
 */
function calculateBuildingCoverage(
  parcelArea: number,
  zoning: ZoningInfo
): number {
  const bcrPercent = zoning.regulations.bcr.value ?? 60
  return parcelArea * (bcrPercent / 100)
}

/**
 * Calculate maximum building height
 * Based on FAR and BCR constraints
 */
function calculateMaxHeight(
  parcelArea: number,
  zoning: ZoningInfo,
  buildingCoverage: number
): number {
  const farPercent = zoning.regulations.far.value ?? 200
  const maxGFA = parcelArea * (farPercent / 100)

  // Calculate height needed to achieve max FAR
  const floorHeight =
    FLOOR_HEIGHT[zoning.category as keyof typeof FLOOR_HEIGHT] ||
    FLOOR_HEIGHT.default

  const estimatedFloors = Math.ceil(maxGFA / buildingCoverage)
  let calculatedHeight = estimatedFloors * floorHeight

  // Apply height limit if specified
  const heightLimit = zoning.regulations.heightLimit.value
  if (heightLimit && calculatedHeight > heightLimit) {
    calculatedHeight = heightLimit
  }

  // Apply reasonable maximum (no Seoul building is taller than 500m)
  return Math.min(calculatedHeight, 500)
}

/**
 * Calculate massing statistics
 */
function calculateStatistics(
  parcelArea: number,
  buildingCoverage: number,
  maxHeight: number,
  zoning: ZoningInfo
): MassingStatistics {
  const floorHeight =
    FLOOR_HEIGHT[zoning.category as keyof typeof FLOOR_HEIGHT] ||
    FLOOR_HEIGHT.default

  const estimatedFloors = Math.floor(maxHeight / floorHeight)
  const grossFloorArea = buildingCoverage * estimatedFloors
  const farUsed = (grossFloorArea / parcelArea) * 100
  const bcrUsed = (buildingCoverage / parcelArea) * 100

  return {
    grossFloorArea: Math.round(grossFloorArea * 100) / 100,
    buildingCoverage: Math.round(buildingCoverage * 100) / 100,
    estimatedFloors,
    farUsed: Math.round(farUsed * 10) / 10,
    bcrUsed: Math.round(bcrUsed * 10) / 10,
  }
}
