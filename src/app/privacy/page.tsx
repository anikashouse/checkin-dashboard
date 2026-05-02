export const metadata = {
  title: 'Privacy Policy — CheckIn Dashboard',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-10">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Overview</h2>
        <p className="text-sm leading-relaxed">
          CheckIn Dashboard is a property management tool for short-term rental hosts. It helps
          hosts collect guest identification data required by Spanish law (Mossos d'Esquadra /
          Guardia Civil registration) and optionally store records in Google Drive.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Data We Collect</h2>
        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li><strong>Guest data:</strong> name, document number, nationality, date of birth, address, phone, email — collected via the guest check-in form and required by Spanish regulations.</li>
          <li><strong>Reservation data:</strong> check-in/check-out dates, Airbnb reservation codes — imported from Airbnb iCal feeds.</li>
          <li><strong>Host account data:</strong> email address and name from Google Sign-In, used solely to authenticate access to the dashboard.</li>
          <li><strong>Google Drive:</strong> if you connect Drive, we store an OAuth refresh token to upload check-in records (TXT files and PDF receipts) to a folder you specify. We only create and upload files — we never read, modify, or delete other files in your Drive.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
          <li>To generate and submit guest registration files to Mossos d'Esquadra as required by Spanish law.</li>
          <li>To display reservation and check-in status in the dashboard.</li>
          <li>To upload copies of registration files to your connected Google Drive folder.</li>
          <li>To send notifications (Telegram) about completed check-ins and Mossos submissions.</li>
        </ul>
        <p className="text-sm leading-relaxed mt-3">
          We do not sell, share, or use your data for advertising or any purpose beyond operating the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Google Drive Scope</h2>
        <p className="text-sm leading-relaxed">
          We request the <code className="bg-slate-100 px-1 rounded">https://www.googleapis.com/auth/drive.file</code> scope,
          which allows us to create and manage only the files that this application creates.
          We cannot access any other files in your Google Drive.
          You can revoke this access at any time from your{' '}
          <a href="https://myaccount.google.com/permissions" className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Google Account permissions
          </a>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Data Storage</h2>
        <p className="text-sm leading-relaxed">
          Data is stored in Supabase (PostgreSQL), hosted in the EU. Guest data is retained
          as long as needed for legal compliance with Spanish short-term rental regulations.
          You can request deletion of your data by contacting us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Third-Party Services</h2>
        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside">
          <li>Supabase — database hosting</li>
          <li>Vercel — application hosting</li>
          <li>Google Drive API — optional file storage</li>
          <li>Mossos d'Esquadra — mandatory legal submission</li>
          <li>Telegram — optional notifications</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Contact</h2>
        <p className="text-sm leading-relaxed">
          For questions or data deletion requests, contact:{' '}
          <a href="mailto:anikashouse1@gmail.com" className="text-orange-600 hover:underline">
            anikashouse1@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
