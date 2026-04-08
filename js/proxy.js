/**
 * Gerenciador de Proxy CORS - Versão Estabilizada para GitHub Pages
 */

class ProxyManager {
    constructor() {
        this.proxies = [
            {
                name: 'AllOrigins',
                url: 'https://api.allorigins.win/raw?url=',
                active: true,
                timeout: 30000 // Aumentado para 30s para evitar o Erro 408
            },
            {
                name: 'AllOrigins-JSON',
                url: 'https://api.allorigins.win/get?url=',
                active: true,
                timeout: 30000,
                needsParse: true
            }
        ];
        
        this.proxyAtual = 0;
        this.maxTentativas = 2; // Reduzido para evitar loops infinitos em caso de queda do serviço
    }

    async fetch(url, tentativa = 0) {
        if (tentativa >= this.maxTentativas) {
            return { success: false, error: 'Timeout ou bloqueio persistente' };
        }

        const proxy = this.proxies[this.proxyAtual];
        if (!proxy.active) {
            this.rotacionarProxy();
            return this.fetch(url, tentativa + 1);
        }

        try {
            const proxyUrl = proxy.url + encodeURIComponent(url);
            console.log(`[${proxy.name}] Tentativa ${tentativa + 1}: ${url.substring(0, 40)}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), proxy.timeout);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            let html;
            if (proxy.needsParse) {
                const data = await response.json();
                html = data.contents;
            } else {
                html = await response.text();
            }
            
            if (!html || html.length < 200) throw new Error('Conteúdo insuficiente');
            
            return { success: true, html: html, proxy: proxy.name };
            
        } catch (error) {
            console.warn(`Falha no ${proxy.name}:`, error.message);
            this.rotacionarProxy();
            return this.fetch(url, tentativa + 1);
        }
    }

    rotacionarProxy() {
        this.proxyAtual = (this.proxyAtual + 1) % this.proxies.length;
    }
}

const proxyManager = new ProxyManager();
