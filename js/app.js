/**
 * CEFS VESTIBULAR MONITOR - Versão Dinâmica 2026
 */
class CEFSVestibularMonitor {
    constructor() {
        this.resultados = [];
        this.emExecucao = false;
        this.init();
    }

    init() { this.preencherFiltros(); this.bindEventos(); }

    async iniciarBusca() {
        if (this.emExecucao) return;
        this.emExecucao = true;
        this.resultados = [];
        
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';

        for (const uni of UNIVERSIDADES) {
            try {
                // Buscamos sempre a URL que contém editais
                const res = await proxyManager.fetch(uni.urls[0]);
                if (res.success) {
                    const novosEditais = this.processarHTML(res.html, uni, uni.urls[0]);
                    this.resultados.push(...novosEditais);
                }
            } catch (e) { console.error(`Erro em ${uni.sigla}`); }
            await new Promise(r => setTimeout(r, 1000));
        }

        this.renderizarPagina();
        this.emExecucao = false;
        if (loading) loading.style.display = 'none';
    }

    processarHTML(html, universidade, url) {
        const editais = [];
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const seletores = universidade.selectores.container.split(',');
        
        seletores.forEach(sel => {
            const elementos = doc.querySelectorAll(sel.trim());
            elementos.forEach(el => {
                const linkElem = el.querySelector('a');
                const href = linkElem ? linkElem.href : url;
                const textoCompleto = el.textContent.trim();
                
                // O Parser retorna null se NÃO encontrar "2026" no texto
                const info = parser.parse(textoCompleto, href, universidade);
                
                if (info && info.titulo) {
                    editais.push({
                        ...info,
                        sigla: universidade.sigla,
                        universidade: universidade.nome,
                        estado: universidade.estado,
                        cidade: universidade.cidade
                    });
                }
            });
        });
        return editais;
    }

    renderizarPagina() {
        const container = document.getElementById('results-container');
        container.innerHTML = '';
        
        if (this.resultados.length === 0) {
            document.getElementById('no-results').style.display = 'block';
            return;
        }

        document.getElementById('no-results').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        this.resultados.forEach(edital => {
            const card = document.createElement('div');
            card.className = 'edital-card-cefs';
            card.innerHTML = `
                <div class="edital-header-cefs">
                    <span class="edital-tipo-badge type-${edital.tipo.color}">${edital.tipo.label}</span>
                    <h4>${edital.sigla} - ${edital.universidade}</h4>
                </div>
                <div class="edital-body-cefs">
                    <p><strong>Edital:</strong> ${edital.titulo}</p>
                    <p><strong>Prova:</strong> ${edital.dataProva}</p>
                </div>
                <div class="edital-footer-cefs">
                    <a href="${edital.link}" target="_blank" class="btn-edital primary">Abrir Edital Oficial</a>
                </div>`;
            container.appendChild(card);
        });
    }

    // ... (Manter funções de filtros e preenchimento)
}
const app = new CEFSVestibularMonitor();
