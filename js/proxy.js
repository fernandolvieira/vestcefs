/**
 * Gerenciador de Proxy CORS
 * Resolve problema de CORS ao acessar sites das universidades
 */

class ProxyManager {
    constructor() {
        // Lista de proxies CORS gratuitos
        this.proxies = [
            {
                name: 'AllOrigins',
                url: 'https://api.allorigins.win/raw?url=',
                active: true,
                timeout: 15000
            },
            {
                name: 'AllOrigins2',
                url: 'https://api.allorigins.win/get?url=',
                active: true,
                timeout: 15000,
                needsParse: true // Retorna JSON com conteúdo em base64
            },
            {
                name: 'CORS-Anywhere',
                url: 'https://cors-anywhere.herokuapp.com/',
                active: true,
                timeout: 20000
            }
        ];
        
        this.proxyAtual = 0;
        this.maxTentativas = 3;
    }

    /**
     * Faz requisição através de proxy
     */
    async fetch(url, tentativa = 0) {
        if (tentativa >= this.maxTentativas) {
            return { 
                success: false, 
                error: 'Máximo de tentativas atingido',
                html: null 
            };
        }

        const proxy = this.proxies[this.proxyAtual];
        
        if (!proxy.active) {
            this.rotacionarProxy();
            return this.fetch(url, tentativa + 1);
        }

        try {
            const proxyUrl = proxy.url + encodeURIComponent(url);
            
            console.log(`[${proxy.name}] Buscando: ${url.substring(0, 50)}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), proxy.timeout);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    'Origin': window.location.origin
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let html;
            
            if (proxy.needsParse) {
                // AllOrigins formato JSON
                const data = await response.json();
                html = data.contents || atob(data.contents_b64 || '');
            } else {
                html = await response.text();
            }
            
            // Verificar se retornou algo útil
            if (!html || html.length < 100) {
                throw new Error('Resposta vazia ou muito curta');
            }
            
            // Verificar se não é página de erro do proxy
            if (html.includes('error') && html.length < 500) {
                throw new Error('Possível erro no proxy');
            }
            
            return { 
                success: true, 
                html: html,
                proxy: proxy.name 
            };
            
        } catch (error) {
            console.warn(`Proxy ${proxy.name} falhou:`, error.message);
            
            // Desativar temporariamente em caso de erro específico
            if (error.message.includes('403') || 
                error.message.includes('429') || 
                error.message.includes('blocked')) {
                proxy.active = false;
                setTimeout(() => {
                    proxy.active = true;
                    console.log(`Proxy ${proxy.name} reativado`);
                }, 60000);
            }
            
            this.rotacionarProxy();
            return this.fetch(url, tentativa + 1);
        }
    }

    /**
     * Rotaciona para próximo proxy disponível
     */
    rotacionarProxy() {
        const inicial = this.proxyAtual;
        do {
            this.proxyAtual = (this.proxyAtual + 1) % this.proxies.length;
            if (this.proxies[this.proxyAtual].active) break;
        } while (this.proxyAtual !== inicial);
        
        console.log(`Rotacionado para proxy: ${this.proxies[this.proxyAtual].name}`);
    }

    /**
     * Busca múltiplas URLs com controle de concorrência
     */
    async fetchAll(urls, onProgress) {
        const resultados = [];
        const concurrency = 2; // Máximo 2 requisições simultâneas
        
        for (let i = 0; i < urls.length; i += concurrency) {
            const batch = urls.slice(i, i + concurrency);
            
            const promises = batch.map(async (urlInfo) => {
                const resultado = await this.fetch(urlInfo.url);
                
                if (onProgress) {
                    onProgress(urlInfo, resultado);
                }
                
                return { ...urlInfo, ...resultado };
            });
            
            const batchResults = await Promise.all(promises);
            resultados.push(...batchResults);
            
            // Delay entre batches para não sobrecarregar
            if (i + concurrency < urls.length) {
                await new Promise(r => setTimeout(r, 1500));
            }
        }
        
        return resultados;
    }
}

// Instância global
const proxyManager = new ProxyManager();
