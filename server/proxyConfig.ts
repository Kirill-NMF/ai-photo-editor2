import { setGlobalDispatcher, ProxyAgent } from 'undici';

// Загружаем все прокси из .env файла
const proxies: string[] = [];
let i = 1;
while (process.env[`PROXY_${i}`]) {
  proxies.push(process.env[`PROXY_${i}`] as string);
  i++;
}

if (proxies.length === 0) {
  console.warn('⚠️ Внимание: Прокси для Gemini API не настроены! Запросы пойдут напрямую.');
}

let currentProxyIndex = 0;

// Функция для получения следующего прокси по кругу
function getNextProxy(): string | undefined {
  if (proxies.length === 0) {
    return undefined;
  }
  const proxy = proxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
  return proxy;
}

// Установка глобального прокси для всех fetch запросов
export function setupGlobalProxy() {
  const proxyUrl = getNextProxy();

  if (proxyUrl) {
    console.log(`🚀 Устанавливаем глобальный прокси: ${proxyUrl.split('@')[1]}`);
    
    const dispatcher = new ProxyAgent({
      uri: new URL(proxyUrl).toString(),
    });

    setGlobalDispatcher(dispatcher);
  } else {
    console.log('🌍 Глобальный прокси не установлен. Запросы пойдут напрямую.');
  }
}
