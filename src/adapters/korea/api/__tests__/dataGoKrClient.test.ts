/**
 * data.go.kr API Client Tests
 * 공공데이터포털 API 클라이언트 테스트
 *
 * Tests include:
 * - Mocked responses for unit testing
 * - Schema validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataGoKrClient } from '../dataGoKrClient'
import {
  validatePNU,
  validateLuArinfoResponse,
  GeoJSONFeatureCollectionSchema,
} from '../schemas'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('DataGoKrClient', () => {
  let client: DataGoKrClient

  beforeEach(() => {
    client = new DataGoKrClient({ serviceKey: 'test-service-key' })
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('PNU Validation', () => {
    it('should validate correct PNU format', () => {
      const validPNU = '1168010100100010001'
      const result = validatePNU(validPNU)
      expect(result.valid).toBe(true)
    })

    it('should reject PNU with wrong length', () => {
      const invalidPNU = '116801010010001' // 15 chars
      const result = validatePNU(invalidPNU)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('19')
    })

    it('should reject PNU with non-digits', () => {
      const invalidPNU = '1168010100100010A01'
      const result = validatePNU(invalidPNU)
      expect(result.valid).toBe(false)
    })
  })

  describe('fetchRegulationsByPNU', () => {
    it('should return error for invalid PNU', async () => {
      const result = await client.fetchRegulationsByPNU('invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should parse successful regulation response', async () => {
      const mockResponse = {
        response: {
          header: {
            resultCode: '00',
            resultMsg: 'SUCCESS',
          },
          body: {
            totalCount: 1,
            items: {
              item: [
                {
                  pnu: '1168010100100010001',
                  prposAreaDstrcCode: 'UQA140',
                  prposAreaDstrcCodeNm: '제3종일반주거지역',
                  cnflcAt: 'Y',
                  relatLawordNm: '국토계획법',
                },
              ],
            },
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await client.fetchRegulationsByPNU('1168010100100010001')

      expect(result.success).toBe(true)
      expect(result.zoningCode).toBe('R3G')
      expect(result.zoningName).toBe('제3종일반주거지역')
      expect(result.regulations).toHaveLength(1)
    })

    it('should handle API error response', async () => {
      const mockResponse = {
        response: {
          header: {
            resultCode: '99',
            resultMsg: 'SERVICE ERROR',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await client.fetchRegulationsByPNU('1168010100100010001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('SERVICE ERROR')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await client.fetchRegulationsByPNU('1168010100100010001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('LuArinfoResponse Validation', () => {
    it('should validate correct response structure', () => {
      const validResponse = {
        response: {
          header: {
            resultCode: '00',
            resultMsg: 'SUCCESS',
          },
          body: {
            totalCount: 1,
            items: {
              item: {
                pnu: '1168010100100010001',
                prposAreaDstrcCode: 'UQA140',
              },
            },
          },
        },
      }

      const result = validateLuArinfoResponse(validResponse)
      expect(result).not.toBeNull()
    })

    it('should handle array of items', () => {
      const validResponse = {
        response: {
          header: {
            resultCode: '00',
            resultMsg: 'SUCCESS',
          },
          body: {
            totalCount: 2,
            items: {
              item: [
                { pnu: '1168010100100010001', prposAreaDstrcCode: 'UQA140' },
                { pnu: '1168010100100010001', prposAreaDstrcCode: 'UQB100' },
              ],
            },
          },
        },
      }

      const result = validateLuArinfoResponse(validResponse)
      expect(result).not.toBeNull()
    })
  })
})

describe('Zod Schemas', () => {
  it('should validate GeoJSON Polygon', () => {
    const validPolygon = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [126.9, 37.5],
                [126.91, 37.5],
                [126.91, 37.51],
                [126.9, 37.51],
                [126.9, 37.5],
              ],
            ],
          },
          properties: { pnu: '1168010100100010001' },
        },
      ],
    }

    const result = GeoJSONFeatureCollectionSchema.safeParse(validPolygon)
    expect(result.success).toBe(true)
  })

  it('should validate GeoJSON MultiPolygon', () => {
    const validMultiPolygon = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [126.9, 37.5],
                  [126.91, 37.5],
                  [126.91, 37.51],
                  [126.9, 37.51],
                  [126.9, 37.5],
                ],
              ],
            ],
          },
          properties: null,
        },
      ],
    }

    const result = GeoJSONFeatureCollectionSchema.safeParse(validMultiPolygon)
    expect(result.success).toBe(true)
  })
})
