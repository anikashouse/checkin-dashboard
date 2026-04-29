# CheckIn Dashboard API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Authentication
Currently no authentication required. TODO: Add NextAuth session validation.

---

## Properties Management

### List All Properties
**Endpoint:** `GET /admin/properties/list`

**Response:**
```json
{
  "properties": [
    {
      "id": "p1",
      "userId": "user123",
      "name": "Cama doble 12 min S. Familia",
      "address": "Calle ejemplo",
      "city": "Barcelona",
      "mossosId": "ID50044239",
      "icalUrl": "https://www.airbnb.es/calendar/ical/50886202.ics?t=...",
      "coverColor": "#EC4899"
    }
  ]
}
```

---

### Create Property
**Endpoint:** `POST /admin/properties/create`

**Request Body:**
```json
{
  "id": "p3",
  "name": "New Property Name",
  "icalUrl": "https://www.airbnb.es/calendar/ical/xxxxx.ics?t=...",
  "mossosId": "ID50044239",
  "coverColor": "#EC4899"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "propertyId": "p3"
}
```

**Error Response:**
```json
{
  "error": "Property with this ID already exists"
}
```

**Requirements:**
- `id` - Unique identifier (required)
- `name` - Property display name (required)
- `icalUrl` - Airbnb iCal URL (required)
- `mossosId` - Optional, for Mossos registration
- `coverColor` - Optional, hex color for UI (default: #EC4899)

---

### Update Property
**Endpoint:** `PUT /admin/properties/{id}`

**Path Parameters:**
- `id` - Property ID (e.g., "p1")

**Request Body:**
```json
{
  "name": "Updated Property Name",
  "icalUrl": "https://www.airbnb.es/calendar/ical/xxxxx.ics?t=...",
  "mossosId": "ID50044239"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property updated"
}
```

---

### Test iCal URL
**Endpoint:** `POST /admin/properties/test-ical`

**Request Body:**
```json
{
  "propertyId": "p1"
}
```

**Response (Success):**
```json
{
  "propertyId": "p1",
  "success": true,
  "name": "Cama doble 12 min S. Familia",
  "icalUrl": "https://www.airbnb.es/calendar/ical/...",
  "reservationCount": 8,
  "reservations": [
    {
      "code": "HMYMQK4D9E",
      "checkIn": "2026-04-24",
      "checkOut": "2026-04-30",
      "guests": 2
    }
  ],
  "hasMore": false
}
```

**Error Response:**
```json
{
  "propertyId": "p1",
  "error": "Failed to fetch iCal"
}
```

---

### Sync Property Reservations
**Endpoint:** `POST /admin/properties/sync`

**Request Body:**
```json
{
  "propertyId": "p1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced Cama doble 12 min S. Familia: 3 inserted, 2 updated",
  "stats": {
    "propertyId": "p1",
    "propertyName": "Cama doble 12 min S. Familia",
    "eventsFound": 8,
    "inserted": 3,
    "updated": 2,
    "skipped": 3
  }
}
```

**Notes:**
- Automatically deduplicates reservations across all properties
- Skips reservations already checked-in
- Only inserts if confirmation code doesn't exist globally

---

## Reservations

### Get Reservations for Property
**Endpoint:** `GET /reservations?propertyId=p1`

**Query Parameters:**
- `propertyId` - Property ID filter

**Response:**
```json
[
  {
    "id": "p1-HMYMQK4D9E",
    "propertyId": "p1",
    "airbnbCode": "HMYMQK4D9E",
    "guestName": "John Doe",
    "checkIn": "2026-04-24",
    "checkOut": "2026-04-30",
    "nights": 6,
    "guests": 2,
    "tel_suffix": "3164",
    "checkedInAt": null
  }
]
```

---

## Admin Utilities

### Get Debug Properties
**Endpoint:** `GET /debug/list-properties`

**Response:**
```json
{
  "properties": [
    {
      "id": "p1",
      "name": "Cama doble 12 min S. Familia",
      "icalUrl": "https://www.airbnb.es/calendar/ical/50886202.ics?t=..."
    }
  ]
}
```

---

### Get Duplicate Reservations
**Endpoint:** `GET /debug/list-duplicates`

**Response:**
```json
{
  "totalDuplicates": 2,
  "duplicates": [
    {
      "code": "HMTQB4QSZQ",
      "count": 2,
      "reservations": [
        {
          "property_id": "p1",
          "guest_name": "Guest 1",
          "check_in": "2026-04-29",
          "check_out": "2026-05-06"
        },
        {
          "property_id": "p2",
          "guest_name": "Guest 1",
          "check_in": "2026-04-29",
          "check_out": "2026-05-06"
        }
      ]
    }
  ]
}
```

---

### Sync All Properties iCals
**Endpoint:** `POST /sync/ical`

**Response:**
```json
{
  "success": true,
  "message": "iCal sync triggered"
}
```

---

### Reset and Sync Everything
**Endpoint:** `POST /admin/reset-and-sync`

**Response:**
```json
{
  "success": true,
  "message": "Reset complete! All reservations deleted and re-synced from iCals",
  "steps": [
    "[OK] Deleted all reservations from database",
    "[OK] Re-synced iCals with deduplication"
  ],
  "properties": [
    {
      "id": "p1",
      "name": "Cama doble 12 min S. Familia",
      "hasIcal": true,
      "ical": "https://www.airbnb.es/calendar/ical/50886202..."
    }
  ],
  "reservationCounts": {
    "p1": 8,
    "p2": 7
  }
}
```

---

### Fix Property Configuration
**Endpoint:** `POST /admin/fix-properties`

**Response:**
```json
{
  "success": true,
  "message": "Properties fixed and re-synced",
  "steps": [
    "[OK] Deleted all reservations",
    "[OK] Fixed property names",
    "[OK] Re-synced iCals with deduplication"
  ],
  "reservationCounts": {
    "p1": 8,
    "p2": 7
  }
}
```

---

### Cleanup Duplicates (p2 only)
**Endpoint:** `POST /admin/cleanup-duplicates`

**Response:**
```json
{
  "success": true,
  "message": "Cleaned up duplicate reservations from p2"
}
```

**Warning:** Deletes ALL reservations from property p2. Use with caution.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": { }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing required fields)
- `404` - Resource not found
- `500` - Server error

---

## Data Models

### Property
```typescript
interface Property {
  id: string              // Unique identifier (p1, p2, etc)
  userId: string          // Owner user ID
  name: string            // Display name
  address?: string        // Property address
  city?: string           // City
  mossosId?: string       // Mossos registration ID
  icalUrl: string         // Airbnb iCal calendar URL
  coverColor: string      // Hex color for UI
}
```

### Reservation
```typescript
interface Reservation {
  id: string              // Composite: {propertyId}-{airbnbCode}
  propertyId: string      // Property ID
  airbnbCode: string      // Airbnb confirmation code
  guestName: string       // Guest name from iCal
  checkIn: string         // YYYY-MM-DD
  checkOut: string        // YYYY-MM-DD
  nights: number          // Number of nights
  guests: number          // Number of guests
  tel_suffix?: string     // Last 4 digits of phone from iCal
  checkedInAt?: string    // ISO timestamp when checked in
}
```

---

## Usage Examples

### Complete Flow: Add New Property

1. **Create property:**
```bash
curl -X POST http://localhost:3000/api/admin/properties/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "p3",
    "name": "New Room",
    "icalUrl": "https://www.airbnb.es/calendar/ical/12345.ics?t=...",
    "mossosId": "ID50044239"
  }'
```

2. **Test iCal URL:**
```bash
curl -X POST http://localhost:3000/api/admin/properties/test-ical \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "p3"}'
```

3. **Sync reservations:**
```bash
curl -X POST http://localhost:3000/api/admin/properties/sync \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "p3"}'
```

---

## Notes

- **Deduplication:** Reservations are automatically deduplicated by `airbnbCode` across all properties
- **Blocking Events:** Events with "blocked", "unavailable", "airbnb" in summary are filtered out
- **Concurrent Access:** Safe for multiple simultaneous requests (Supabase handles row-level locking)
- **iCal Parsing:** Supports RFC 5545 format with Airbnb extensions

---

## TODO

- [ ] Add NextAuth session authentication
- [ ] Add role-based access control (admin only)
- [ ] Add request logging and audit trail
- [ ] Add rate limiting
- [ ] Add webhook support for real-time updates
- [ ] Add GraphQL layer
- [ ] Add API versioning (v1, v2, etc)
