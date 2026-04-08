/**
 * Gerenciador de requisições com proxy CORS
 * Resolve problema de CORS ao acessar sites das universidades
 */

class ProxyManager {
    constructor() {
        // Lista de proxies CORS gratuitos (ordem de preferência)
        this.proxies = [
            {
                name: 'AllOrigins',
                url: 'https://api.allorigins.win/raw?url=',
                active: true
            },
            {
                name: 'CORS-Anywhere',
                url: 'https://cors-anywhere.herokuapp.com/',
                active: true
            },
            {
                name: 'ThingProxy',
                url: 'https://thingproxy.freeboard.io/fetch/',
                active: true
            }
        ];
        
        this.proxyAtual = 0;
        this.timeout = 15000; // 15 segundos
    }

    /**
     * Busca conteúdo de uma URL usando proxy
     */
    async fetch(url, tentativas = 3) {
        let ultimoErro;
        
        for (let i = 0; i < tentativas; i++) {
            const proxy = this.proxies[this.proxyAtual];
            
            if (!proxy.active) {
                this.rotacionarProxy();
                continue;
            }
            
            try {
                const proxyUrl = proxy.url + encodeURIComponent(url);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Origin': window.location.origin
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                return { success: true, html, proxy: proxy.name };
                
            } catch (error) {
                ultimoErro = error;
                console.warn(`Proxy ${proxy.name} falhou:`, error.message);
                
                // Desativar proxy temporariamente se falhar
                if (error.message.includes('403') || error.message.includes('429')) {
                    proxy.active = false;
                    setTimeout(() => proxy.active = true, 60000); // Reativar em 1 min
                }
                
                this.rotacionarProxy();
            }
        }
        
        return { 
            success: false, 
            error: ultimoErro?.message || 'Todas as tentativas falharam',
            html: null 
        };
    }

    /**
     * Rotaciona para o próximo proxy
     */
    rotacionarProxy() {
        this.proxyAtual = (this.proxyAtual + 1) % this.proxies.length;
    }

    /**
     * Busca múltiplas URLs em paralelo com limite
     */
    async fetchAll(urls, onProgress) {
        const resultados = [];
        const limite = 3; // Máximo de requisições simultâneas
        
        for (let i = 0; i < urls.length; i += limite) {
            const batch = urls.slice(i, i + limite);
            
            const promises = batch.map(async (urlInfo) => {
                const resultado = await this.fetch(urlInfo.url);
                
                if (onProgress) {
                    onProgress(urlInfo, resultado);
                }
                
                return { ...urlInfo, ...resultado };
            });
            
            const batchResultados = await Promise.all(promises);
            resultados.push(...batchResultados);
            
            // Delay entre batches para não sobrecarregar
            if (i + limite < urls.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        
        return resultados;
    }
}

// Instância global
const proxyManager = new ProxyManager();
