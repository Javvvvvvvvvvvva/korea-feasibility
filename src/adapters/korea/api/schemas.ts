/**
 * Zod Validation Schemas for Korean Land/Zoning APIs
 * API 응답 검증 스키마
 */

import { z } from 'zod'

// ============================================
// Common Schemas
// ============================================

export const PNUSchema = z
  .string()
  .length(19, 'PNU must be exactly 19 characters')
  .regex(/^\d+$/, 'PNU must contain only digits')

export const CoordinateSchema = z.tuple([z.number(), z.number()])

export const PolygonCoordinatesSchema = z.array(z.array(CoordinateSchema))

export const MultiPolygonCoordinatesSchema = z.array(z.array(z.array(CoordinateSchema)))

// ============================================
// GeoJSON Schemas
// ============================================

export const GeoJSONPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: PolygonCoordinatesSchema,
})

export const GeoJSONMultiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: MultiPolygonCoordinatesSchema,
})

export const GeoJSONGeometrySchema = z.union([
  GeoJSONPolygonSchema,
  GeoJSONMultiPolygonSchema,
])

export const GeoJSONFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: GeoJSONGeometrySchema,
  properties: z.record(z.string(), z.unknown()).nullable(),
})

export const GeoJSONFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJSONFeatureSchema),
})

// ============================================
// VWorld API Response Schemas
// ============================================

export const VWorldCadastralPropertiesSchema = z.object({
  pnu: z.string().optional(),
  addr: z.string().optional(),
  jibun: z.string().optional(),
  bonbun: z.string().optional(),
  bubun: z.string().optional(),
  jimok: z.string().optional(),
  area: z.number().optional(),
})

export const VWorldResponseSchema = z.object({
  response: z.object({
    status: z.enum(['OK', 'ERROR', 'NOT_FOUND']),
    result: z
      .object({
        featureCollection: z.object({
          type: z.literal('FeatureCollection'),
          features: z.array(
            z.object({
              type: z.literal('Feature'),
              geometry: GeoJSONGeometrySchema,
              properties: VWorldCadastralPropertiesSchema.passthrough(),
            })
          ),
        }),
      })
      .optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .optional(),
  }),
})

export const VWorldZoningPropertiesSchema = z.object({
  pnu: z.string().optional(),
  ucode: z.string().optional(),
  uname: z.string().optional(),
  name: z.string().optional(),
})

// ============================================
// data.go.kr API Response Schemas
// ============================================

// 연속지적도 WFS Response
export const DataGoKrWFSResponseSchema = z.object({
  type: z.literal('FeatureCollection').optional(),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: GeoJSONGeometrySchema,
      properties: z
        .object({
          pnu: z.string().optional(),
          ldCode: z.string().optional(), // 법정동코드
          ldCodeNm: z.string().optional(), // 법정동명
          regstrSeCode: z.string().optional(), // 대장구분코드
          regstrSeCodeNm: z.string().optional(), // 대장구분명
          mnnmSlno: z.string().optional(), // 본번-부번
          jimokCode: z.string().optional(), // 지목코드
          jimokCodeNm: z.string().optional(), // 지목명
          pblntfPclnd: z.number().optional(), // 공시지가
          stdYear: z.string().optional(), // 기준년도
        })
        .passthrough(),
    })
  ),
  totalFeatures: z.number().optional(),
  numberMatched: z.number().optional(),
  numberReturned: z.number().optional(),
})

// 토지이용규제정보 응답 (LuArinfoService)
export const LandUseRegulationItemSchema = z.object({
  pnu: z.string().optional(),
  regstrSeCode: z.string().optional(), // 대장구분코드
  regstrSeCodeNm: z.string().optional(), // 대장구분명
  cnflcAt: z.string().optional(), // 저촉여부
  prposAreaDstrcCode: z.string().optional(), // 용도지역지구코드
  prposAreaDstrcCodeNm: z.string().optional(), // 용도지역지구명
  relatLawordNm: z.string().optional(), // 관련법령명
  relatLawordClNm: z.string().optional(), // 관련법령조항명
})

export const LuArinfoResponseSchema = z.object({
  response: z.object({
    header: z.object({
      resultCode: z.string(),
      resultMsg: z.string(),
    }),
    body: z
      .object({
        totalCount: z.number().optional(),
        pageNo: z.number().optional(),
        numOfRows: z.number().optional(),
        items: z
          .object({
            item: z.union([z.array(LandUseRegulationItemSchema), LandUseRegulationItemSchema]),
          })
          .optional(),
      })
      .optional(),
  }),
})

// 토지이용계획 속성정보 응답 (getLandUseAttr)
export const LandUsePlanItemSchema = z.object({
  pnu: z.string().optional(),
  ldCodeNm: z.string().optional(), // 법정동명
  regstrSeCodeNm: z.string().optional(), // 대장구분명
  mnnmSlno: z.string().optional(), // 본번-부번
  jimokNm: z.string().optional(), // 지목명
  lndcgrCodeNm: z.string().optional(), // 토지대장 지목명
  lndpclAr: z.number().optional(), // 토지면적
  prposArea1Nm: z.string().optional(), // 용도지역1
  prposArea2Nm: z.string().optional(), // 용도지역2
  ladUseSittn: z.string().optional(), // 토지이용상황
  tpgrphHgCodeNm: z.string().optional(), // 지형높이명
  tpgrphFrmCodeNm: z.string().optional(), // 지형형상명
  roadSideCodeNm: z.string().optional(), // 도로측면명
  lastUpdtDt: z.string().optional(), // 최종수정일
})

export const LandUsePlanResponseSchema = z.object({
  landUses: z
    .object({
      field: z.array(z.unknown()).optional(),
      totalCount: z.number().optional(),
      numOfRows: z.number().optional(),
      pageNo: z.number().optional(),
      landUse: z.union([z.array(LandUsePlanItemSchema), LandUsePlanItemSchema]).optional(),
    })
    .optional(),
})

// ============================================
// Parsed/Validated Types
// ============================================

export type ValidatedPNU = z.infer<typeof PNUSchema>
export type ValidatedVWorldResponse = z.infer<typeof VWorldResponseSchema>
export type ValidatedDataGoKrWFSResponse = z.infer<typeof DataGoKrWFSResponseSchema>
export type ValidatedLuArinfoResponse = z.infer<typeof LuArinfoResponseSchema>
export type ValidatedLandUsePlanResponse = z.infer<typeof LandUsePlanResponseSchema>
export type LandUseRegulationItem = z.infer<typeof LandUseRegulationItemSchema>
export type LandUsePlanItem = z.infer<typeof LandUsePlanItemSchema>

// ============================================
// Validation Helpers
// ============================================

export function validatePNU(pnu: string): { valid: boolean; error?: string } {
  const result = PNUSchema.safeParse(pnu)
  if (result.success) {
    return { valid: true }
  }
  return { valid: false, error: result.error.issues[0]?.message }
}

export function validateVWorldResponse(data: unknown): ValidatedVWorldResponse | null {
  const result = VWorldResponseSchema.safeParse(data)
  if (result.success) {
    return result.data
  }
  console.warn('VWorld response validation failed:', result.error.issues)
  return null
}

export function validateDataGoKrWFSResponse(data: unknown): ValidatedDataGoKrWFSResponse | null {
  const result = DataGoKrWFSResponseSchema.safeParse(data)
  if (result.success) {
    return result.data
  }
  console.warn('data.go.kr WFS response validation failed:', result.error.issues)
  return null
}

export function validateLuArinfoResponse(data: unknown): ValidatedLuArinfoResponse | null {
  const result = LuArinfoResponseSchema.safeParse(data)
  if (result.success) {
    return result.data
  }
  console.warn('LuArinfo response validation failed:', result.error.issues)
  return null
}
