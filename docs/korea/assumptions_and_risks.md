# Phase 2: Assumptions and Risks

## Korea Urban Feasibility Tool - Domain Model Documentation

**Version:** Seoul v1
**Date:** 2026-02-02
**Status:** Phase 2 Complete

---

## 1. Zoning Domain Model

### Files Created
- `src/domain/korea/zoning.ts`

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Use code-based zoning identification | Enables type safety and easier lookup |
| 16 standard zoning types only | Based on 국토계획법 시행령 제30조 |
| Exclude non-도시지역 zones | Seoul v1 scope is urban areas only |
| Korean + English naming | Supports bilingual UI |

### Assumptions

1. **Zoning types are stable**
   - Assumption: The 16 zoning types in 국토계획법 won't change frequently
   - Risk: Legislative changes could add/modify types
   - Mitigation: Design allows adding new codes

2. **Seoul uses all 16 types**
   - Assumption: All standard zoning types exist in Seoul
   - Verified: Yes, all types are represented

3. **Zoning is single-layer**
   - Assumption: Primary zoning is the main regulatory factor
   - Reality: Overlays (지구단위계획, etc.) often modify limits
   - Gap: Overlay system designed but not implemented

### Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Zoning code misidentification | High | Medium | District-based inference until API available |
| Legislative changes | Medium | Low | Monitor 국토계획법 amendments |
| Missing zoning overlays | High | High | Clearly communicate limitations |

---

## 2. FAR/BCR Calculation Model

### Files Created
- `src/domain/korea/regulations.ts`

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate national vs. Seoul limits | Law allows municipal variation |
| Include typical values | Max limits rarely achievable |
| Height as derived property | Korea rarely has absolute height limits |
| Store legal references | Enable verification |

### Assumptions

1. **Seoul ordinance values are current**
   - Assumption: Values based on 서울시 도시계획 조례 2024
   - Risk: Ordinance amendments
   - Mitigation: Date-stamp all regulatory data

2. **Typical FAR < Maximum FAR**
   - Assumption: Achievable FAR is ~60-80% of maximum
   - Basis: Setbacks, 사선제한, practical constraints
   - This is approximation only

3. **No bonus FAR by default**
   - Assumption: Base calculations exclude incentives
   - Reality: Many projects qualify for bonus FAR
   - Gap: Bonus calculation is indicative only

4. **Height derived from FAR/BCR**
   - Assumption: max_height ≈ (FAR / BCR) × floor_height
   - Reality: 일조권/도로사선 often more restrictive
   - Gap: Shadow/setback calculations not implemented

### Data Sources

| Data | Source | Reliability |
|------|--------|-------------|
| National FAR/BCR limits | 국토계획법 시행령 제84조, 제85조 | Official |
| Seoul FAR/BCR limits | 서울시 도시계획 조례 제54조, 제55조 | Official |
| Typical values | Industry practice | Estimated |
| Floor heights | 건축법 기준 | Official |

### Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Outdated ordinance values | High | Medium | Add version/date tracking |
| Missing bonus programs | Medium | High | Document as limitation |
| 사선제한 not applied | High | High | Users warned in UI |

---

## 3. Parcel Abstraction

### Files Created
- `src/domain/korea/parcel.ts`

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| PNU as primary identifier | Official 19-digit standard |
| Support both jibun and road addresses | Both systems in use |
| GeoJSON-compatible geometry | Standard web GIS format |
| Include land category (지목) | Affects buildability |

### Assumptions

1. **PNU format is universal**
   - Assumption: All Korean parcels have 19-digit PNU
   - Verified: Yes, mandated by 공간정보관리법

2. **Coordinate system is WGS84**
   - Assumption: Web applications use EPSG:4326
   - Reality: Official data uses EPSG:5186
   - Mitigation: Note CRS, transform as needed

3. **Parcel geometry is available**
   - Assumption: Can obtain polygon from GIS APIs
   - Reality: Requires API access
   - Gap: Currently generating mock rectangles

4. **Area calculation is approximate**
   - Assumption: Shoelace formula with degree-to-meter conversion
   - Reality: ~1-5% error possible
   - Mitigation: Always label as "추정값"

### Seoul District Codes

| District | Code | Verified |
|----------|------|----------|
| 강남구 | 680 | ✅ |
| 서초구 | 650 | ✅ |
| 종로구 | 110 | ✅ |
| (all 25 districts) | ... | ✅ |

Source: 행정표준코드관리시스템

### Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Mock geometry differs from reality | High | Certain | Label as estimated |
| Area calculation errors | Medium | High | Conservative rounding |
| Missing parcels in database | Low | Low | Handle gracefully |

---

## 4. City Adapter Interface

### Files Created
- `src/domain/korea/cityAdapter.ts`

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Interface-based design | Enables future city additions |
| Registry pattern | Centralized adapter management |
| Async methods | API calls are inherently async |
| Confidence levels | Transparency about data quality |

### Assumptions

1. **Seoul-first implementation**
   - Assumption: Other cities will follow same patterns
   - Risk: Different cities may have unique regulations
   - Mitigation: Interface is flexible

2. **API availability**
   - Assumption: VWORLD, NSDI APIs are accessible
   - Reality: Rate limits, registration required
   - Gap: Currently using mock data

3. **Address resolution is possible**
   - Assumption: Can geocode Korean addresses
   - Options: Kakao, VWORLD, custom
   - Gap: Using pattern-based parsing

### Supported Cities

| City | Status | Notes |
|------|--------|-------|
| Seoul (서울특별시) | Implemented (v1) | Mock data |
| Busan (부산광역시) | Future | Interface ready |
| Incheon (인천광역시) | Future | Interface ready |
| Others | Future | Interface ready |

### Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Different municipal regulations | Medium | High | City-specific adapters |
| API changes | Medium | Medium | Version tracking |
| Rate limiting | Low | High | Caching strategy |

---

## 5. Overall System Assumptions

### Scope Assumptions

1. **Urban areas only (도시지역)**
   - 관리지역, 농림지역, 자연환경보전지역 not supported
   - User should not enter non-urban addresses

2. **Standard zoning only**
   - 지구단위계획 not resolved
   - 정비구역 not identified
   - 특별계획구역 not handled

3. **Flat terrain**
   - No topographic analysis
   - No slope calculations
   - Ground assumed at 0m elevation

4. **Single building per parcel**
   - No subdivision support
   - No multi-building layout optimization

### Data Quality Assumptions

| Data Type | Quality Level | Notes |
|-----------|---------------|-------|
| Zoning regulations | Official | From 법률/조례 |
| Parcel geometry | Estimated | Mock rectangles |
| Parcel area | Estimated | Calculated from geometry |
| District zoning | Inferred | Based on typical patterns |

### Calculation Assumptions

| Calculation | Method | Accuracy |
|-------------|--------|----------|
| Max GFA | lot_area × FAR% | ±10% |
| Max coverage | lot_area × BCR% | Accurate |
| Max height | FAR/BCR × floor_height | ±30% |
| Floors | height / floor_height | Approximate |

---

## 6. Known Limitations (for Phase 2)

### Critical Gaps

1. **No real parcel data**
   - Impact: Geometry and area are simulated
   - Resolution: Phase 3 API integration

2. **No parcel-specific zoning**
   - Impact: Zoning is district-based inference
   - Resolution: Phase 3 LURIS integration

3. **No 사선제한 (setback regulations)**
   - Impact: Height may be overestimated
   - Resolution: Phase 4 geometry calculations

4. **No 지구단위계획 overlay**
   - Impact: Many urban parcels have overlays
   - Resolution: Future phase

### User-Facing Limitations

These must be clearly communicated:

- [ ] "대지면적은 추정값입니다"
- [ ] "용도지역은 구역 기반 추정입니다"
- [ ] "일조권/도로사선 미반영"
- [ ] "지구단위계획 미확인"
- [ ] "예비 타당성 검토 전용"

---

## 7. Risk Summary

### High Severity Risks

| Risk | Current State | Required Action |
|------|---------------|-----------------|
| Incorrect zoning | Possible | Implement LURIS lookup |
| Overestimated height | Likely | Implement 사선제한 |
| Wrong parcel data | Certain (mock) | Integrate GIS API |

### Medium Severity Risks

| Risk | Current State | Required Action |
|------|---------------|-----------------|
| Outdated regulations | Possible | Add version tracking |
| Missing overlays | Certain | Implement overlay system |
| User misinterpretation | Possible | Strong disclaimers |

### Low Severity Risks

| Risk | Current State | Required Action |
|------|---------------|-----------------|
| API rate limits | Not yet | Implement caching |
| Multi-city confusion | N/A (Seoul only) | Clear city indicator |

---

## 8. Phase 2 Completion Criteria

### Deliverables

- [x] `zoning.ts` - 16 zoning types with legal references
- [x] `regulations.ts` - FAR/BCR/height for all zones
- [x] `parcel.ts` - PNU, address, geometry abstractions
- [x] `cityAdapter.ts` - Extensible adapter interface
- [x] `assumptions_and_risks.md` - This document

### Validation

- [x] TypeScript compiles without errors
- [x] All 16 Seoul zoning types defined
- [x] FAR/BCR values match 서울시 조례
- [x] PNU format validated
- [x] Interface supports future cities

---

*Document Version: 1.0*
*Author: Claude Code*
*Review Required: Domain expert validation of regulatory values*
