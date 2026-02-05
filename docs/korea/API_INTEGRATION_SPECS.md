# Korea Land & Zoning API Integration Specifications
# 한국 토지/용도지역 API 연동 스펙

**Version:** 1.0.0
**Date:** 2026-02-03
**Status:** Research Complete

---

## Overview

As of January 2024, data.go.kr services for land data have been migrated to **VWorld (vworld.kr)**. This document outlines the API specifications for production-grade integration.

---

## API Summary Table

| Service | Provider | Data Type | Format | Status |
|---------|----------|-----------|--------|--------|
| VWorld Data API 2.0 | 국토교통부 | Parcel Geometry | GeoJSON | Primary |
| VWorld WFS API | 국토교통부 | Parcel Geometry | GeoJSON/GML | Primary |
| 토지이용규제정보서비스 | 국토교통부 | Zoning Rules | XML | Secondary |
| 토지이용규제법령정보서비스 | 국토교통부 | Legal Text | XML | Reference |

---

## 1. VWorld Data API 2.0 (Primary)

### 1.1 연속지적도 (Continuous Cadastral Map)

Retrieves parcel polygon geometry by PNU.

| Item | Value |
|------|-------|
| Service ID | `LP_PA_CBND_BUBUN` |
| Base URL | `http://api.vworld.kr/req/data` |
| Method | GET |
| Response Format | JSON (GeoJSON) |
| Rate Limit | TBD (dev key: 3 months validity) |

#### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `service` | string | Service type | `data` |
| `request` | string | Request type | `GetFeature` |
| `data` | string | Layer name | `LP_PA_CBND_BUBUN` |
| `key` | string | VWorld API Key | `YOUR_API_KEY` |
| `attrFilter` | string | Filter by PNU | `pnu:=:1168010100108080000` |
| `page` | number | Page number | `1` |
| `size` | number | Results per page | `1000` |

#### Optional Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `crs` | string | Coordinate system | `EPSG:4326` |
| `format` | string | Output format | `json` |

#### Example Request

```
http://api.vworld.kr/req/data?service=data&request=GetFeature&data=LP_PA_CBND_BUBUN&key=YOUR_KEY&attrFilter=pnu:=:1168010100108080000&page=1&size=1000
```

#### Example Response

```json
{
  "response": {
    "status": "OK",
    "result": {
      "featureCollection": {
        "type": "FeatureCollection",
        "features": [{
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[127.0285, 37.4973], ...]]
          },
          "properties": {
            "pnu": "1168010100108080000",
            "addr": "서울특별시 강남구 역삼동 808",
            "jibun": "808",
            "bonbun": "0808",
            "bubun": "0000"
          }
        }]
      }
    }
  }
}
```

---

### 1.2 VWorld WFS API

Alternative method using WFS standard protocol.

| Item | Value |
|------|-------|
| Base URL | `http://api.vworld.kr/req/wfs` |
| Version | 1.1.0 |
| Response Format | GeoJSON, GML 2.1.2, GML 3.1.1 |

#### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `REQUEST` | string | WFS operation | `GetFeature` |
| `TYPENAME` | string | Layer name (lowercase) | `lp_pa_cbnd_bubun` |
| `VERSION` | string | WFS version | `1.1.0` |
| `SRSNAME` | string | Coordinate system | `EPSG:4326` |
| `OUTPUT` | string | Output format | `json` |
| `BBOX` | string | Bounding box | `127.02,37.49,127.03,37.50` |
| `KEY` | string | VWorld API Key | `YOUR_KEY` |

#### Example Request

```
http://api.vworld.kr/req/wfs?REQUEST=GetFeature&TYPENAME=lp_pa_cbnd_bubun&VERSION=1.1.0&MAXFEATURES=1&SRSNAME=EPSG:4326&OUTPUT=json&BBOX=127.02,37.49,127.03,37.50&KEY=YOUR_KEY
```

---

## 2. Zoning Data Services

### 2.1 VWorld Zoning Layers

Zoning information is available through VWorld with these service IDs:

| Service ID | Name | Description |
|------------|------|-------------|
| `LT_C_UQ111` | 도시지역 | Urban areas |
| `LT_C_UQ112` | 관리지역 | Management areas |
| `LT_C_UQ113` | 농림지역 | Agricultural/Forest areas |
| `LT_C_UQ114` | 자연환경보전지역 | Nature conservation areas |
| `LT_C_LHBLPN` | 토지이용계획도 | Land use plan map |

#### Query by PNU

```
http://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_UQ111&key=YOUR_KEY&attrFilter=pnu:=:1168010100108080000
```

---

### 2.2 data.go.kr 토지이용규제정보서비스

Provides detailed zoning regulations and permitted uses.

| Item | Value |
|------|-------|
| Base URL | `https://apis.data.go.kr/1613000/arLandUseInfoService` |
| Endpoint | `/DTarLandUseInfo` |
| Method | GET |
| Response Format | XML |
| Auth | `serviceKey` (URL-encoded) |

#### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `serviceKey` | string | Encoded API key | `YOUR_ENCODED_KEY` |
| `areaCd` | string | Municipal code (5-digit) | `11680` |
| `ucodeList` | string | Zoning code | `UQA100` |
| `landUseNm` | string | Land use activity | `단독주택` |

#### Response Fields

- 지역지구명 (zone name)
- 가능여부 (permissibility)
- 관련법령 (related laws)

---

### 2.3 data.go.kr 토지이용규제법령정보서비스

Provides legal text for zoning regulations.

| Item | Value |
|------|-------|
| Base URL | `https://apis.data.go.kr/1613000/LuLawInfoService` |
| Endpoint | `/DTluLawInfo` |
| Method | GET |
| Response Format | XML |

---

## 3. Coordinate Systems

### EPSG Codes Used

| EPSG | Name | Usage |
|------|------|-------|
| 4326 | WGS84 | Web maps, GPS |
| 5186 | Korea 2000 / Central Belt | Korean cadastral data |
| 5179 | Korea 2000 / UTM-K | Alternative Korean CRS |

### Transformation Required

VWorld can return data in EPSG:4326 directly using `SRSNAME=EPSG:4326`. If data comes in EPSG:5186, transformation is needed:

```javascript
// Using proj4js
import proj4 from 'proj4'

proj4.defs('EPSG:5186', '+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs')

const [lng, lat] = proj4('EPSG:5186', 'EPSG:4326', [x, y])
```

---

## 4. PNU (Parcel Numbering Unit) Structure

19-digit unique parcel identifier:

| Position | Digits | Description | Example |
|----------|--------|-------------|---------|
| 1-2 | 2 | 시도 (Province) | 11 (서울) |
| 3-5 | 3 | 시군구 (District) | 680 (강남구) |
| 6-8 | 3 | 읍면동 (Dong) | 101 |
| 9-10 | 2 | 리 (Ri) | 00 |
| 11 | 1 | 산 구분 (Mountain flag) | 1 (일반), 2 (산) |
| 12-15 | 4 | 본번 (Main number) | 0808 |
| 16-19 | 4 | 부번 (Sub number) | 0000 |

**Example:** `1168010100108080000`
- 서울특별시 강남구 역삼동 808번지

---

## 5. Authentication

### VWorld API Key

1. Register at https://www.vworld.kr
2. Apply for API key (개발 or 운영)
3. Development key: 3 months validity, extendable 3 times
4. Operation key: 2 years validity

### data.go.kr API Key

1. Register at https://www.data.go.kr
2. Apply for each specific API
3. Key must be URL-encoded in requests

---

## 6. Implementation Checklist

### Phase 1: Parcel Geometry
- [ ] Register for VWorld API key
- [ ] Implement VWorld Data API client
- [ ] Add PNU-based parcel lookup
- [ ] Parse GeoJSON response
- [ ] Handle coordinate transformation if needed

### Phase 2: Zoning Data
- [ ] Query VWorld zoning layers (LT_C_UQ*)
- [ ] Map VWorld zone names to internal codes
- [ ] Fallback to district-based inference

### Phase 3: Regulations
- [ ] Query data.go.kr 토지이용규제정보서비스
- [ ] Parse XML response
- [ ] Extract FAR/BCR limits

### Phase 4: Integration
- [ ] Update SeoulAdapter to use real APIs
- [ ] Add API key configuration (env vars)
- [ ] Implement caching (reduce API calls)
- [ ] Add error handling for API failures
- [ ] Update DataSourcePanel with real status

---

## 7. Error Handling

| Error Code | Meaning | Action |
|------------|---------|--------|
| `NO_RESULT` | No data found | Fall back to mock data |
| `INVALID_KEY` | Bad API key | Check key validity |
| `RATE_LIMIT` | Too many requests | Implement throttling |
| `TIMEOUT` | Request timeout | Retry with backoff |

---

## 8. References

### Official Documentation
- VWorld API: https://www.vworld.kr/dev/v4api.do
- VWorld WFS Guide: https://www.vworld.kr/dev/v4dv_wmsguide2_s001.do
- 공공데이터포털: https://www.data.go.kr
- 토지이음: https://www.eum.go.kr

### Code Examples
- [PublicDataReader (Python)](https://github.com/WooilJeong/PublicDataReader)
- [V-world API Samples](https://github.com/V-world/V-world_API_sample)

### Support
- VWorld: 1661-0115 (weekdays 09:00-18:00)
- data.go.kr: 1566-0025

---

*Document generated from API research on 2026-02-03*
