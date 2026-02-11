# Korea Land/Zoning API Integration Guide
# 한국 토지/용도지역 API 연동 가이드

This document describes how to configure and use the real Korean land data APIs for production-grade parcel geometry and zoning regulation data.

## Quick Start

1. Copy `.env.example` to `.env`
2. Add your API keys
3. Run `npm run dev`

```bash
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## API Keys Setup

### 1. VWorld API (Primary - Required for real parcel data)

VWorld provides cadastral parcel polygons (연속지적도) and basic zoning layers.

**Registration:**
1. Go to https://www.vworld.kr/dev/v4api.do
2. Create an account (회원가입)
3. Apply for API key (인증키 신청)
4. Select "2D 데이터 API" and "WFS API"
5. Wait for approval (usually instant for development keys)

**Configuration:**
```bash
VITE_VWORLD_API_KEY=your_vworld_api_key_here
```

**Services Used:**
- `LP_PA_CBND_BUBUN` - 연속지적도 (Cadastral polygons)
- `LT_C_UQ111` - 도시지역 용도지역 (Urban zoning)

### 2. data.go.kr API (Optional - For detailed regulations)

data.go.kr provides detailed land use regulation data (토지이용규제정보).

**Registration:**
1. Go to https://www.data.go.kr
2. Create an account
3. Search for: "토지이용규제정보서비스" (국토교통부)
4. Apply for API access (활용신청)
5. Copy the encoded service key

**Configuration:**
```bash
VITE_DATA_GO_KR_API_KEY=your_data_go_kr_service_key_here
```

**Note:** The service key from data.go.kr is URL-encoded. Use it as-is.

**Services Used:**
- `LuArinfoService` - 토지이용규제정보 (Land use regulations)
- `CadastralService` - 연속지적도 WFS (Cadastral WFS)

## Verification

### Test VWorld API

```bash
VITE_VWORLD_API_KEY=your_key npx ts-node scripts/test-vworld-api.ts
```

Expected output:
```
VWorld API Integration Test
===========================

Test: Gangnam Station Area
  Coordinates: [127.0276, 37.4979]
  Fetching parcel data...
  Result: SUCCESS
    PNU: 1168010100100010001
    Address: 서울특별시 강남구 역삼동 123
    ...
```

### Full Pipeline Demo

```bash
VITE_VWORLD_API_KEY=vworld_key VITE_DATA_GO_KR_API_KEY=datagoKr_key npx ts-node scripts/demo-full-pipeline.ts
```

This demonstrates the complete flow:
1. Address → Coordinates
2. Coordinates → Parcel polygon
3. PNU → Zoning/Regulations
4. Regulations → Building massing calculation

## API Specifications

### VWorld Data API 2.0

| Parameter | Value |
|-----------|-------|
| Base URL | `https://api.vworld.kr/req/data` |
| WFS URL | `https://api.vworld.kr/req/wfs` |
| Auth | `key` parameter (plain text) |
| Format | JSON (default), GeoJSON |
| CRS | EPSG:4326 (WGS84) |

**Example Request:**
```
https://api.vworld.kr/req/data?
  service=data&
  request=GetFeature&
  data=LP_PA_CBND_BUBUN&
  key=YOUR_API_KEY&
  attrFilter=pnu:=:1168010100100010001&
  crs=EPSG:4326&
  format=json
```

### data.go.kr LuArinfoService

| Parameter | Value |
|-----------|-------|
| Base URL | `http://apis.data.go.kr/1611000/LuArinfoService` |
| Endpoint | `/attr/getLuArinfoAttrList` |
| Auth | `ServiceKey` parameter (URL-encoded) |
| Format | XML (default), JSON |

**Example Request:**
```
http://apis.data.go.kr/1611000/LuArinfoService/attr/getLuArinfoAttrList?
  ServiceKey=URL_ENCODED_KEY&
  pnu=1168010100100010001&
  numOfRows=100&
  format=json
```

## Coordinate Systems

Korean land data uses various coordinate systems:

| EPSG Code | Name | Usage |
|-----------|------|-------|
| EPSG:5186 | Korea 2000 / Central Belt | Native cadastral data |
| EPSG:4326 | WGS84 | Web rendering, GPS |

The application automatically transforms coordinates using proj4:

```typescript
import { tmToWgs84, wgs84ToTm } from './utils/coordinateTransform'

// TM to WGS84
const [lng, lat] = tmToWgs84(197000, 553000) // Seoul City Hall

// WGS84 to TM
const [x, y] = wgs84ToTm(126.978, 37.566)
```

## Data Source Status

The application shows real-time API status in the "데이터 출처" panel:

| Status | Meaning |
|--------|---------|
| OK | API connected and working |
| API 키 필요 | API key not configured |
| 오류 | API error occurred |
| 모의 | Using simulated/mock data |
| 미사용 | Source not currently active |

## Fallback Behavior

When APIs are unavailable:

1. **Parcel Geometry**: Falls back to rectangular mock parcel
2. **Zoning**: Falls back to district-based inference, then prompts for manual selection
3. **Regulations**: Uses hardcoded Seoul ordinance values

## Rate Limits

| Service | Development | Production |
|---------|-------------|------------|
| VWorld | Varies by key tier | Apply for increase |
| data.go.kr | 10,000/day | Apply with use case |

## Error Handling

The application handles API errors gracefully:

1. Primary API fails → Try secondary API
2. All APIs fail → Show user-friendly error
3. Prompt for manual override when needed

## Running Tests

```bash
# Unit tests
npm test

# Integration tests (requires API keys)
VITE_VWORLD_API_KEY=key npm test -- --run
```

## Troubleshooting

### "API 키 필요" shown for all sources
- Check that `.env` file exists and contains valid keys
- Restart the dev server after changing `.env`

### "No parcel found at coordinates"
- The address may not resolve to exact coordinates
- Try a different address format (jibun address preferred)

### "용도지역 정보를 가져올 수 없습니다"
- The parcel may be outside urban areas
- Use manual zoning override (수동 선택)

### Coordinate mismatch
- Ensure input coordinates are in WGS84 (EPSG:4326)
- Check for TM/WGS84 confusion (TM values are in meters, ~100,000-600,000)

## Legal References

- 국토의 계획 및 이용에 관한 법률 (National Land Planning Act)
- 서울특별시 도시계획 조례 (Seoul Urban Planning Ordinance)
- 건축법 (Building Act)
- 토지이용규제 기본법 (Basic Land Use Regulation Act)

## Support

- VWorld: https://www.vworld.kr (FAQ, Q&A)
- data.go.kr: https://www.data.go.kr/helpdesk (Support center)
- 토지이음: https://www.eum.go.kr (Land use portal)
