import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Fix Properties</title>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial; max-width: 700px; margin: 40px auto; padding: 20px; }
    h1 { color: #d9534f; }
    button { padding: 12px 24px; font-size: 16px; cursor: pointer; background: #d9534f; color: white; border: none; border-radius: 5px; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .info { color: #31708f; margin: 20px 0; padding: 15px; background: #d9edf7; border: 1px solid #bce8f1; border-radius: 4px; }
    .success { color: #3c763d; margin: 20px 0; padding: 10px; background: #dff0d8; border: 1px solid #d6e9c6; border-radius: 4px; }
    .error { color: #d9534f; margin: 20px 0; padding: 10px; background: #f2dede; border: 1px solid #ebccd1; border-radius: 4px; }
    pre { background: #f5f5f5; padding: 15px; overflow: auto; border-radius: 4px; font-size: 12px; max-height: 400px; }
    .step { margin: 10px 0; font-size: 15px; }
  </style>
</head>
<body>
  <h1>Fix Property Configuration</h1>

  <div class="info">
    Esto corregira los nombres de las propiedades en Supabase:
    <ul>
      <li>p1: "Cama doble 12 min S. Familia" (con iCal 50886202)</li>
      <li>p2: "12 minutes from Sagrada Familia by metro" (con iCal 50050101)</li>
    </ul>
    Luego eliminara y re-sincronizara todas las reservas.
  </div>

  <button onclick="fix()">Corregir y re-sincronizar</button>

  <div id="status"></div>
  <pre id="output" style="display:none;"></pre>

  <script>
    async function fix() {
      const btn = event.target;
      btn.disabled = true;
      btn.textContent = '[Procesando...] Corrigiendo propiedades...';

      try {
        const res = await fetch('/api/admin/fix-properties', { method: 'POST' });
        const data = await res.json();

        document.getElementById('output').style.display = 'block';
        document.getElementById('output').textContent = JSON.stringify(data, null, 2);

        if (res.ok) {
          let html = '<div class="success"><strong>[OK] Exito!</strong>';
          if (data.steps) {
            html += '<div style="margin-top: 10px;">';
            data.steps.forEach(step => {
              html += '<div class="step">' + step + '</div>';
            });
            html += '</div>';
          }
          if (data.reservationCounts) {
            html += '<h4>Reservas sincronizadas:</h4><ul>';
            for (const [propId, count] of Object.entries(data.reservationCounts)) {
              html += '<li><strong>' + propId + ':</strong> ' + count + ' reservas</li>';
            }
            html += '</ul>';
          }
          html += '</div>';
          document.getElementById('status').innerHTML = html;
        } else {
          const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
          document.getElementById('status').innerHTML = '<div class="error"><strong>[ERROR]</strong> ' + errMsg + '</div>';
        }
      } catch (e) {
        document.getElementById('status').innerHTML = '<div class="error"><strong>[ERROR]</strong> ' + e.message + '</div>';
      }
    }
  </script>
</body>
</html>
  `
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}
