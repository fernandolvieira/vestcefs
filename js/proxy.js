/**
 * js/proxy.js - Integrado com Backend Próprio no Render
 */
class ProxyManager {
    constructor() {
        // Sua URL configurada com o endpoint de busca
        this.minhaApi = 'https://cefsvest-backend.onrender.com/proxy?url=';
    }

    async fetch(url) {
        try {
            console.log(`[Backend CEFS] Solicitando: ${url}`);
            const proxyUrl = this.minhaApi + encodeURIComponent(url);
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const html = await response.text();
            
            if (!html || html.length < 500) {
                throw new Error('Resposta do servidor muito curta ou inválida');
            }

            return { success: true, html: html };
        } catch (error) {
            console.error("Falha na busca via Backend Próprio:", error.message);
            return { success: false, error: error.message };
        }
    }
}

const proxyManager = new ProxyManager();
