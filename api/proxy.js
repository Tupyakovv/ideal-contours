// Этот код будет работать как ваша серверная функция
export default async function handler(request) {
  // Получаем целевой URL из параметра запроса (?url=...)
  const { searchParams } = new URL(request.url, `https://_`);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  // Копируем заголовки из оригинального запроса (включая Authorization)
  const headers = new Headers(request.headers);

  // Устанавливаем заголовки для CORS, чтобы браузер разрешил доступ
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Делаем запрос к API Яндекса от имени сервера
  const response = await fetch(targetUrl, {
    headers: headers,
  });

  // Возвращаем ответ от API Яндекса вашему приложению
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}
