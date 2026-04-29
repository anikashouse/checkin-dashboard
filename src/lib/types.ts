export interface Property {
  id: string
  userId: string
  name: string
  address?: string
  city?: string
  ical_url: string
  mossos_id?: string
  coverColor?: string
  created_at?: string
  updated_at?: string
}

export interface Reservation {
  id: string
  propertyId: string
  guestName: string
  airbnbCode?: string
  checkIn: string
  checkOut: string
  nights?: number
  guests?: number
  checkedInAt?: string
  tel_suffix?: string
  created_at?: string
  updated_at?: string
}

export interface CheckinRecord {
  id: string
  property_id: string
  reservation_id: string
  guest_name: string
  check_in_date: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  created_at: string
  updated_at: string
}
