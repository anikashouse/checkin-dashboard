import { google } from 'googleapis'
import { Readable } from 'stream'

export async function uploadToDrive({
  folderId,
  filename,
  content,
  mimeType,
  refreshToken,
}: {
  folderId: string
  filename: string
  content: Buffer | string
  mimeType: string
  refreshToken: string
}) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: refreshToken })

  const drive = google.drive({ version: 'v3', auth })
  const buf = typeof content === 'string' ? Buffer.from(content) : content

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buf),
    },
  })
}
