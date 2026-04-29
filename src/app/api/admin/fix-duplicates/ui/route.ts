import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Fix Duplicates</title>
  <style>
    body { font-family: Arial; max-width: 600px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; }
    button { padding: 12px 24px; font-size: 16px; cursor: pointer; background: #0066cc; color: white; border: none; border-radius: 5px; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .warning { color: #d9534f; margin: 20px 0; padding: 10px; background: #f2dede; border: 1px solid #ebccd1; border-radius: 4px; }
    .success { color: #3c763d; margin: 20px 0; padding: 10px; background: #dff0d8; border: 1px solid #d6e9c6; border-radius: 4px; }
    .error { color: #d9534f; margin: 20px 0; padding: 10px; background: #f2dede; border: 1px solid #ebccd1; border-radius: 4px; }
    pre { background: #f5f5f5; padding: 15px; overflow: auto; border-radius: 4px; font-size: 13px; }
    .step { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>🔧 Arreglar Duplicados</h1>
  <p>Este proceso:</p>
  <ol>
    <li>Elimina todas las reservas duplicadas de p2 ("12 min")</li>
    <li>Sincroniza los iCals con deduplicación</li>
    <li>El dashboard mostrará solo reservas de p1 ("cama doble")</li>
  </ol>
  <div class="warning">⚠️ Esta acción es irreversible - se eliminarán TODAS las reservas de p2</div>
  <button onclick="fixDuplicates()">Arreglar ahora</button>
  <div id="status"></div>
  <pre id="output" style="display:none;"></pre>

  <script>
    async function fixDuplicates() {
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = '⏳ Procesando...';

      try {
        const res = await fetch('/api/admin/fix-duplicates', { method: 'POST' });
        const data = await res.json();

        document.getElementById('output').style.display = 'block';
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);

        if (res.ok) {
          let html = '<div class="success"><strong>✓ ¡Éxito!</strong>';
          if (data.steps) {
            html += '<div style="margin-top: 10px;">';
            data.steps.forEach(step => {
              html += '<div class="step">' + step + '</div>';
            });
            html += '</div>';
          }
          html += '</div>';
          document.getElementById('status').innerHTML = html;
        } else {
          document.getElementById('status').innerHTML = '<div class="error"><strong>✗ Error:</strong> ' + data.error + '</div>';
        }
      } catch (e) {
        document.getElementById('status').innerHTML = '<div class="error"><strong>✗ Error:</strong> ' + e.message + '</div>';
      }
    }
  </script>
</body>
</html>
  `
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
