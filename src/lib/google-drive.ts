import { google } from 'googleapis'
import { Readable } from 'stream'

function getDriveClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurado')
  const credentials = JSON.parse(json)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function uploadToDrive({
  folderId,
  filename,
  content,
  mimeType,
}: {
  folderId: string
  filename: string
  content: Buffer | string
  mimeType: string
}) {
  const drive = getDriveClient()
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

export async function testDriveFolder(folderId: string) {
  const drive = getDriveClient()
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize: 1,
    fields: 'files(id,name)',
  })
  return res.data.files ?? []
}
