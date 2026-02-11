/**
 * Coordinate Transformation Utilities
 * 좌표 변환 유틸리티
 *
 * Handles conversion between Korean coordinate systems and WGS84.
 * Korean data sources typically use:
 * - EPSG:5186 (Korea 2000 / Central Belt) - Most common for cadastral data
 * - EPSG:5179 (Korea 2000 / Unified CS)
 * - EPSG:4326 (WGS84) - For web mapping
 */

import proj4 from 'proj4'

// ============================================
// Coordinate System Definitions
// ============================================

// Korea 2000 / Central Belt (가장 일반적인 한국 좌표계)
const EPSG_5186 =
  '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'

// Korea 2000 / Unified CS
const EPSG_5179 =
  '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs'

// Korea 2000 / West Belt
const EPSG_5185 =
  '+proj=tmerc +lat_0=38 +lon_0=125 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'

// Korea 2000 / East Belt
const EPSG_5187 =
  '+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs'

// WGS84
const EPSG_4326 = '+proj=longlat +datum=WGS84 +no_defs'

// Register coordinate systems
proj4.defs('EPSG:5186', EPSG_5186)
proj4.defs('EPSG:5179', EPSG_5179)
proj4.defs('EPSG:5185', EPSG_5185)
proj4.defs('EPSG:5187', EPSG_5187)
proj4.defs('EPSG:4326', EPSG_4326)

// ============================================
// Types
// ============================================

export type SupportedCRS = 'EPSG:5186' | 'EPSG:5179' | 'EPSG:5185' | 'EPSG:5187' | 'EPSG:4326'

export interface Coordinate {
  x: number // longitude or easting
  y: number // latitude or northing
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

// ============================================
// Transformation Functions
// ============================================

/**
 * Transform a single coordinate from source CRS to target CRS
 */
export function transformCoordinate(
  coord: Coordinate,
  sourceCRS: SupportedCRS,
  targetCRS: SupportedCRS
): Coordinate {
  if (sourceCRS === targetCRS) {
    return coord
  }

  const [x, y] = proj4(sourceCRS, targetCRS, [coord.x, coord.y])
  return { x, y }
}

/**
 * Transform coordinates from Korean TM (EPSG:5186) to WGS84 (EPSG:4326)
 */
export function tmToWgs84(x: number, y: number): [number, number] {
  const [lng, lat] = proj4('EPSG:5186', 'EPSG:4326', [x, y])
  return [lng, lat]
}

/**
 * Transform coordinates from WGS84 (EPSG:4326) to Korean TM (EPSG:5186)
 */
export function wgs84ToTm(lng: number, lat: number): [number, number] {
  const [x, y] = proj4('EPSG:4326', 'EPSG:5186', [lng, lat])
  return [x, y]
}

/**
 * Transform a bounding box between coordinate systems
 */
export function transformBBox(
  bbox: BoundingBox,
  sourceCRS: SupportedCRS,
  targetCRS: SupportedCRS
): BoundingBox {
  if (sourceCRS === targetCRS) {
    return bbox
  }

  const min = transformCoordinate({ x: bbox.minX, y: bbox.minY }, sourceCRS, targetCRS)
  const max = transformCoordinate({ x: bbox.maxX, y: bbox.maxY }, sourceCRS, targetCRS)

  return {
    minX: Math.min(min.x, max.x),
    minY: Math.min(min.y, max.y),
    maxX: Math.max(min.x, max.x),
    maxY: Math.max(min.y, max.y),
  }
}

/**
 * Transform a GeoJSON polygon coordinates from source CRS to target CRS
 */
export function transformPolygonCoordinates(
  coordinates: number[][][],
  sourceCRS: SupportedCRS,
  targetCRS: SupportedCRS
): [number, number][][] {
  if (sourceCRS === targetCRS) {
    return coordinates as [number, number][][]
  }

  return coordinates.map((ring) =>
    ring.map((coord) => {
      const transformed = transformCoordinate({ x: coord[0], y: coord[1] }, sourceCRS, targetCRS)
      return [transformed.x, transformed.y] as [number, number]
    })
  )
}

/**
 * Detect likely CRS based on coordinate values
 * Korean TM coordinates are typically in the range of:
 * - X (Easting): 100,000 - 400,000
 * - Y (Northing): 100,000 - 700,000
 *
 * WGS84 coordinates for Korea:
 * - Longitude: 124 - 132
 * - Latitude: 33 - 43
 */
export function detectCRS(x: number, y: number): SupportedCRS {
  // Check if it looks like WGS84 (longitude/latitude)
  if (x >= 124 && x <= 132 && y >= 33 && y <= 43) {
    return 'EPSG:4326'
  }

  // Check if it looks like Korean TM (meters)
  if (x >= 80000 && x <= 500000 && y >= 100000 && y <= 700000) {
    return 'EPSG:5186'
  }

  // Check for EPSG:5179 (larger coordinate values)
  if (x >= 800000 && x <= 1300000 && y >= 1500000 && y <= 2300000) {
    return 'EPSG:5179'
  }

  // Default to WGS84
  return 'EPSG:4326'
}

/**
 * Ensure coordinates are in WGS84 format
 */
export function ensureWgs84(
  coordinates: number[][][],
  sourceCRS?: SupportedCRS
): [number, number][][] {
  if (coordinates.length === 0 || coordinates[0].length === 0) {
    return []
  }

  // Detect CRS if not provided
  const detectedCRS = sourceCRS || detectCRS(coordinates[0][0][0], coordinates[0][0][1])

  if (detectedCRS === 'EPSG:4326') {
    return coordinates as [number, number][][]
  }

  return transformPolygonCoordinates(coordinates, detectedCRS, 'EPSG:4326')
}

/**
 * Create a bounding box around a point with given radius in meters
 */
export function createBBoxAroundPoint(
  lng: number,
  lat: number,
  radiusMeters: number,
  outputCRS: SupportedCRS = 'EPSG:4326'
): BoundingBox {
  // Convert to TM for meter-based calculation
  const [centerX, centerY] = wgs84ToTm(lng, lat)

  const bbox5186: BoundingBox = {
    minX: centerX - radiusMeters,
    minY: centerY - radiusMeters,
    maxX: centerX + radiusMeters,
    maxY: centerY + radiusMeters,
  }

  if (outputCRS === 'EPSG:5186') {
    return bbox5186
  }

  return transformBBox(bbox5186, 'EPSG:5186', outputCRS)
}

// ============================================
// Validation
// ============================================

/**
 * Validate that coordinates are within expected range for given CRS
 */
export function validateCoordinates(coord: Coordinate, crs: SupportedCRS): boolean {
  switch (crs) {
    case 'EPSG:4326':
      // WGS84: Korea is roughly 124-132E, 33-43N
      return coord.x >= 120 && coord.x <= 135 && coord.y >= 30 && coord.y <= 45

    case 'EPSG:5186':
      // Korea 2000 Central Belt
      return coord.x >= 80000 && coord.x <= 500000 && coord.y >= 100000 && coord.y <= 700000

    case 'EPSG:5179':
      // Korea 2000 Unified
      return coord.x >= 800000 && coord.x <= 1300000 && coord.y >= 1500000 && coord.y <= 2300000

    default:
      return true
  }
}
