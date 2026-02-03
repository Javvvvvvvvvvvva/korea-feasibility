# Flexity-Style Feature Checklist

## Korea Urban Feasibility Tool (Seoul v1)

This checklist models the feature expectations of professional urban feasibility tools like Flexity and TestFit. Each item must be validated before the tool can be considered service-ready.

---

## 1. Address Resolution
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 1.1 | Korean address input (도로명/지번) | ✅ DONE | Pattern-based parsing implemented |
| 1.2 | Seoul district validation | ✅ DONE | Validates 25 gu (구) |
| 1.3 | Address normalization | ✅ DONE | Standardizes to 서울특별시 format |
| 1.4 | Geocoding to coordinates | 🔶 PARTIAL | District-level approximation only |
| 1.5 | Address autocomplete | ❌ TODO | Requires API integration |
| 1.6 | Error handling for invalid addresses | ✅ DONE | Korean error messages |

**Blockers:** None critical for v1
**Risk:** Geocoding precision limited without paid API

---

## 2. Parcel Grounding
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 2.1 | PNU (필지고유번호) generation | ✅ DONE | 19-digit format |
| 2.2 | Parcel geometry retrieval | 🔶 PARTIAL | Simulated rectangular parcels |
| 2.3 | Area calculation (m²) | ✅ DONE | Approximate based on geometry |
| 2.4 | Real cadastral data integration | ❌ TODO | Requires VWORLD/GIS API |
| 2.5 | Parcel boundary visualization | ✅ DONE | 3D ground plane |

**Blockers:** Real GIS data requires API integration
**Risk:** Area estimates may differ significantly from actual

---

## 3. Zoning Resolution
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 3.1 | 용도지역 (Zoning type) detection | 🔶 PARTIAL | District-based inference |
| 3.2 | Support for all Seoul zoning types | ✅ DONE | 16 zoning categories |
| 3.3 | 지구단위계획 detection | ❌ TODO | Not implemented |
| 3.4 | 정비구역 detection | ❌ TODO | Not implemented |
| 3.5 | Manual zoning override | ❌ TODO | UI not implemented |
| 3.6 | Zoning confidence indicator | ✅ DONE | High/Medium/Low/Unknown |

**Blockers:** Real zoning lookup requires LURIS API
**Risk:** Inferred zoning may be incorrect for specific parcels

---

## 4. FAR/BCR Calculation
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 4.1 | 용적률 (FAR) by zoning type | ✅ DONE | Seoul ordinance values |
| 4.2 | 건폐율 (BCR) by zoning type | ✅ DONE | Seoul ordinance values |
| 4.3 | FAR usage visualization | ✅ DONE | Progress bar |
| 4.4 | BCR usage visualization | ✅ DONE | Progress bar |
| 4.5 | Bonus FAR calculation | ❌ TODO | Incentive programs |
| 4.6 | Legal basis citations | ✅ DONE | 서울특별시 도시계획 조례 |

**Blockers:** None for basic functionality
**Risk:** Bonus FAR programs not accounted for

---

## 5. Envelope Math
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 5.1 | Buildable footprint calculation | ✅ DONE | After setbacks |
| 5.2 | Setback by zoning category | ✅ DONE | Default values |
| 5.3 | Maximum height calculation | ✅ DONE | FAR-based |
| 5.4 | Height limit enforcement | ✅ DONE | When specified |
| 5.5 | 일조권 사선제한 | ❌ TODO | Not implemented |
| 5.6 | 도로사선제한 | ❌ TODO | Not implemented |
| 5.7 | Floor count estimation | ✅ DONE | By use type |
| 5.8 | GFA calculation | ✅ DONE | Gross floor area |

**Blockers:** Shadow/setback regulations require complex geometry
**Risk:** Height may be overestimated without 사선제한

---

## 6. 3D Grounding & Camera
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 6.1 | Three.js canvas rendering | ✅ DONE | React Three Fiber |
| 6.2 | Parcel ground plane | ✅ DONE | Visible in scene |
| 6.3 | Building envelope mesh | ✅ DONE | Blue transparent box |
| 6.4 | Orbit controls | ✅ DONE | Pan/zoom/rotate |
| 6.5 | Camera presets (bird's eye, front, side) | 🔶 PARTIAL | Buttons exist, not functional |
| 6.6 | Shadow rendering | ✅ DONE | Directional light |
| 6.7 | Ground grid | ✅ DONE | 5m cell size |
| 6.8 | Environment lighting | ✅ DONE | City preset |

**Blockers:** None
**Risk:** None

---

## 7. Context Realism
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 7.1 | Context buildings (placeholder) | ✅ DONE | Static boxes |
| 7.2 | Real building footprints | ❌ TODO | Requires 3D GIS data |
| 7.3 | Road visualization | ❌ TODO | Not implemented |
| 7.4 | Terrain/topography | ❌ TODO | Flat plane only |
| 7.5 | North arrow | ❌ TODO | Not implemented |
| 7.6 | Scale indicator | ❌ TODO | Not implemented |

**Blockers:** Real context requires significant GIS data
**Risk:** Context is purely illustrative

---

## 8. Legal Clarity
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 8.1 | Legal disclaimer | ✅ DONE | Expandable footer |
| 8.2 | 국토계획법 reference | ✅ DONE | Cited |
| 8.3 | 건축법 reference | ✅ DONE | Cited |
| 8.4 | 서울시 조례 reference | ✅ DONE | Cited |
| 8.5 | Data source attribution | ✅ DONE | Confidence panel |
| 8.6 | LURIS link | ✅ DONE | In disclaimer |
| 8.7 | "Preliminary feasibility" notice | ✅ DONE | Prominent |

**Blockers:** None
**Risk:** None

---

## 9. Error Handling
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 9.1 | Non-Seoul address rejection | ✅ DONE | Clear error message |
| 9.2 | Invalid address format handling | ✅ DONE | Korean error |
| 9.3 | API timeout handling | 🔶 PARTIAL | No real API yet |
| 9.4 | Error recovery action | ✅ DONE | "다시 시도" button |
| 9.5 | Console error prevention | ✅ DONE | Build passes |
| 9.6 | Loading states | ✅ DONE | Status indicators |

**Blockers:** None
**Risk:** None

---

## 10. Performance
| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 10.1 | Initial load time | ✅ DONE | ~297KB gzipped |
| 10.2 | 3D render performance | ✅ DONE | Smooth on modern devices |
| 10.3 | Analysis response time | ✅ DONE | Sub-second (simulated) |
| 10.4 | Mobile responsiveness | ✅ DONE | CSS breakpoints |
| 10.5 | Code splitting | ❌ TODO | Not implemented |

**Blockers:** None critical
**Risk:** Bundle size warning (>500KB)

---

## Summary

### Completion Status

| Category | Done | Partial | TODO | Total |
|----------|------|---------|------|-------|
| Address Resolution | 4 | 1 | 1 | 6 |
| Parcel Grounding | 3 | 1 | 1 | 5 |
| Zoning Resolution | 2 | 1 | 3 | 6 |
| FAR/BCR Calculation | 5 | 0 | 1 | 6 |
| Envelope Math | 6 | 0 | 2 | 8 |
| 3D Grounding & Camera | 7 | 1 | 0 | 8 |
| Context Realism | 1 | 0 | 5 | 6 |
| Legal Clarity | 7 | 0 | 0 | 7 |
| Error Handling | 5 | 1 | 0 | 6 |
| Performance | 4 | 0 | 1 | 5 |
| **TOTAL** | **44** | **5** | **14** | **63** |

### Service Readiness: **PHASE 0-1 COMPLETE**

**Core Features Working:**
- ✅ Address input and validation (Seoul)
- ✅ Zoning inference (district-based)
- ✅ FAR/BCR calculations
- ✅ Envelope massing calculation
- ✅ 3D visualization
- ✅ Confidence reporting
- ✅ Legal disclaimers

**Critical Gaps for Production:**
1. Real GIS/cadastral data integration
2. Parcel-specific zoning lookup
3. 일조권/도로사선 calculations
4. Real context building data

**Acceptable for Preliminary Feasibility:** YES
**Acceptable for Legal/Permit Use:** NO

---

## Next Steps (Phase 2+)

1. **PHASE 2:** Design Korea domain model and data structures
2. **PHASE 3:** Implement Seoul GIS API integration
3. **PHASE 4:** Enhance massing engine with 사선제한
4. **PHASE 5:** Add more legal references and municipal data
5. **PHASE 6:** UX hardening and mobile optimization
6. **PHASE 7:** Final validation and QA

---

*Last Updated: 2026-02-02*
*Version: Seoul v1 (Preliminary)*
