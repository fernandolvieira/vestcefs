/**
 * CEFS VESTIBULAR MONITOR - Lógica de Busca Sequencial com Fallback
 */

// ... (Mantenha o constructor e init iguais)

    async iniciarBusca() {
        if (this.emExecucao) return;
        
        this.emExecucao = true;
        this.resultados = [];
        
        const btn = document.getElementById('btn-buscar');
        const loading = document.getElementById('loading');
        if (btn) btn.disabled = true;
        if (loading) loading.style.display = 'flex';

        const filtroUni = document.getElementById('filter-universidade')?.value || 'todos';
        let universidadesParaBuscar = (filtroUni !== 'todos') ? 
            UNIVERSIDADES.filter(u => u.sigla === filtroUni) : UNIVERSIDADES;

        this.inicializarProgresso(universidadesParaBuscar);

        // CONFIGURAÇÃO DE SEGURANÇA: Processar uma por uma (Sequencial)
        // Isso evita o erro 403/429 de excesso de requisições
        for (const uni of universidadesParaBuscar) {
            const urlPrincipal = uni.urls[0];
            try {
                const res = await proxyManager.fetch(urlPrincipal);
                this.atualizarProgresso({ universidade: uni }, res);
                
                if (res.success) {
                    const editaisExtraidos = this.processarHTML(res.html, uni, urlPrincipal);
                    this.resultados.push(...editaisExtraidos);
                }
            } catch (err) {
                console.error(`Erro crítico em ${uni.sigla}:`, err);
            }
            // Delay de 1.5s entre cada universidade para "enganar" o WAF
            await new Promise(r => setTimeout(r, 1500));
        }

        // ESTRATÉGIA DE FALLBACK: Se a busca online falhar, usa os dados base do data.js
        if (this.resultados.length === 0) {
            console.log("Busca online sem resultados. Aplicando dados de contingência...");
            this.resultados = [...EDITAIS_BASE];
        }

        this.resultados = this.removerDuplicatas(this.resultados);
        this.filtrarERenderizar();
        this.atualizarStats();
        
        this.emExecucao = false;
        if (btn) btn.disabled = false;
        if (loading) loading.style.display = 'none';
    }

// ... (Mantenha o restante das funções como criarCard e renderizar)
