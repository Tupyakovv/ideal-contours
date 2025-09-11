export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Токен берём из Authorization: "OAuth <token>" или из env (YANDEX_TOKEN)
  const hdr = req.headers.authorization || '';
  const token = hdr.replace(/^OAuth\s+/i, '') || process.env.YANDEX_TOKEN;
  const path = (req.query.path || 'disk:/ideal_contours_data.json');

  if (!token) {
    res.status(401).json({ error: 'Missing Yandex Disk token' });
    return;
  }
  const auth = 'OAuth ' + token;

  if (req.method === 'GET') {
    // 1) линк на скачивание
    const dl = await fetch(
      'https://cloud-api.yandex.net/v1/disk/resources/download?path=' + encodeURIComponent(path),
      { headers: { Authorization: auth } }
    );
    if (!dl.ok) {
      const text = await dl.text().catch(()=> '');
      res.status(dl.status).send(text || 'download link error');
      return;
    }
    const { href } = await dl.json();

    // 2) собственно файл
    const fileRes = await fetch(href);
    if (!fileRes.ok) {
      const text = await fileRes.text().catch(()=> '');
      res.status(fileRes.status).send(text || 'download error');
      return;
    }
    const text = await fileRes.text();
    const data = text ? JSON.parse(text) : {};
    res.status(200).json(data);
    return;
  }

  if (req.method === 'PUT') {
    // 1) линк на загрузку
    const up = await fetch(
      'https://cloud-api.yandex.net/v1/disk/resources/upload?overwrite=true&path=' + encodeURIComponent(path),
      { headers: { Authorization: auth } }
    );
    if (!up.ok) {
      const text = await up.text().catch(()=> '');
      res.status(up.status).send(text || 'upload link error');
      return;
    }
    const { href } = await up.json();

    // 2) PUT файла
    const putRes = await fetch(href, {
      method: 'PUT',
      body: JSON.stringify(req.body || {}),
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(()=> '');
      res.status(putRes.status).send(text || 'upload error');
      return;
    }
    res.status(204).end();
    return;
  }

  res.setHeader('Allow', 'GET,PUT,OPTIONS');
  res.status(405).end('Method Not Allowed');
}
