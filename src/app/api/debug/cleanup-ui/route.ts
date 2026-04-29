import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Cleanup Duplicates</title>
  <style>
    body { font-family: Arial; max-width: 600px; margin: 40px auto; }
    button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
    .warning { color: red; margin: 20px 0; }
    .success { color: green; margin: 20px 0; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; }
  </style>
</head>
<body>
  <h1>🧹 Limpiar Duplicados</h1>
  <p>Esto eliminará TODAS las reservas de p2 ("12 min") que son duplicadas.</p>
  <div class="warning">⚠️ Esta acción es irreversible</div>
  <button onclick="cleanup()">Eliminar duplicados</button>
  <pre id="output"></pre>

  <script>
    async function cleanup() {
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = 'Procesando...';

      try {
        const res = await fetch('/api/admin/cleanup-duplicates', { method: 'POST' });
        const data = await res.json();

        document.getElementById('output').textContent = JSON.stringify(data, null, 2);

        if (res.ok) {
          document.body.innerHTML += '<div class="success">✓ Duplicados eliminados</div>';
        } else {
          document.body.innerHTML += '<div class="warning">✗ Error: ' + data.error + '</div>';
        }
      } catch (e) {
        document.getElementById('output').textContent = e.message;
      }
    }
  </script>
</body>
</html>
  `
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
