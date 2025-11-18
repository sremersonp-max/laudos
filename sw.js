// Service Worker para Laudo Vasos PWA
const CACHE_NAME = 'laudo-vasos-v1.5';
const urlsToCache = [
  './',
  './index.html',
  './laudo.html',
  './laudo.css',
  './laudo.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalação - Cache dos arquivos
self.addEventListener('install', function(event) {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache aberto, adicionando arquivos...');
        return cache.addAll(urlsToCache).catch(error => {
          console.log('Falha ao adicionar ao cache:', error);
        });
      })
  );
  self.skipWaiting(); // Força ativação imediata
});

// Ativação - Limpa caches antigos
self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercepta requisições
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retorna do cache ou busca na rede
        if (response) {
          return response;
        }
        return fetch(event.request).then(function(response) {
          // Não cacheamos tudo, apenas os arquivos essenciais
          return response;
        });
      })
      .catch(function() {
        // Fallback para páginas
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});