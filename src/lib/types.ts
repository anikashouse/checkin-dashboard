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

export interface GuestData {
  // Identity
  nom?: string
  ap1?: string
  ap2?: string
  sexe?: string
  naix?: string
  nac?: string
  menor?: string        // S/N
  // Document (pos 2/3 depending on tipo, pos 4=expedición, pos 25=soporte DNI)
  tipo?: string
  numdoc?: string
  expedicion?: string
  soporte_dni?: string
  // Stay
  entrada?: string
  hora_entrada?: string
  salida?: string
  hora_salida?: string
  // Contact
  tel?: string
  email?: string
  // Address (pos 27=calle, 28=provincia ESP, 29=municipio ESP, 30=localidad, 31=país, 32=CP)
  direccion?: string
  provincia?: string
  municipio?: string    // ESP only
  localidad?: string    // non-ESP
  pais_residencia?: string
  cp?: string
}

export interface CheckinStatus {
  formComplete: boolean
  txtGenerated: boolean
  mossosSent: boolean
  sentAt?: string
  guestSurname?: string
  guests?: GuestData[]
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
  checkinStatus?: CheckinStatus
  created_at?: string
  updated_at?: string
}

export interface CheckinRecord {
  id: string
  reservation_id: string
  airbnb_code: string
  guest_data?: Record<string, unknown>
  txt_content?: string
  txt_filename?: string
  txt_path?: string
  pdf_path?: string
  form_complete: boolean
  mossos_sent: boolean
  sent_at?: string
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
