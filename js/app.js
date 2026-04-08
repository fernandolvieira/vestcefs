/**
 * CEFS VESTIBULAR MONITOR - v3.0 Dinâmica 2026
 * Sistema 100% dependente dos sites oficiais (sem banco estático)
 */

class CEFSVestibularMonitor {
    constructor() {
        this.resultados = [];
        this.emExecucao = false;
        this.init();
    }

    init() {
        // Agora as funções existem abaixo, então o erro TypeError sumirá
        this.preencherFiltros();
        this.bindEventos();
        console.log('CEFS Vestibular Monitor v3.0 inicializado com sucesso');
    }

    preencherFiltros() {
        const select = document.getElementById('filter-universidade');
        if (!select) return;
        
        // Limpa o select antes de preencher
        select.innerHTML = '<option value="todos">Todas as Universidades</option>';

        const porEstado = {};
        UNIVERSIDADES.forEach(u => {
            if (!porEstado[u.estado]) porEstado[u.estado] = [];
            porEstado[u.estado].push(u);
        });

        Object.keys(porEstado).sort().forEach(estado => {
            const group = document.createElement('optgroup');
            group.label = estado;
            
            porEstado[estado].forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.sigla;
                opt.textContent = `${u.sigla} - ${u.cidade}`;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });
    }

    bindEventos() {
        const btnBuscar = document.getElementById('btn-buscar');
        const btnLimpar = document.getElementById('btn-limpar');
        
        if (btnBuscar) {
            btnBuscar.addEventListener('click', (e) => {
                e.preventDefault();
                this.iniciarBusca();
            });
        }
        
        if (btnLimpar) {
            btnLimpar.addEventListener('click', (e) => {
                e.preventDefault();
                this.limparFiltros();
            });
        }
    }

    async iniciarBusca() {
        if (this.emExecucao) return;
        this.emExecucao = true;
        this.resultados = [];
        
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('results-section');
        
        if (loading) loading.style.display = 'flex';
        if (resultsSection) resultsSection.style.display = 'none';

        const filtroUni = document.getElementById('filter-universidade')?.value || 'todos';
        let universidadesParaBuscar = (filtroUni !== 'todos') ? 
            UNIVERSIDADES.filter(u => u.sigla === filtroUni) : UNIVERSIDADES;

        this.inicializarProgresso(universidadesParaBuscar);

        for (const uni of universidadesParaBuscar) {
            try {
                // Busca via seu backend no Render
                const res = await proxyManager.fetch(uni.urls[0]);
                this.atualizarProgresso(uni, res);
                
                if (res.success) {
                    const editaisExtraidos = this.processarHTML(res.html, uni, uni.urls[0]);
                    this.resultados.push(...editaisExtraidos);
                }
            } catch (err) {
                console.error(`Erro em ${uni.sigla}:`, err);
            }
            // Delay para evitar bloqueio por excesso de requisições
            await new Promise(r => setTimeout(r, 1000));
        }

        this.renderizarPagina();
        
        this.emExecucao = false;
        if (loading) loading.style.display = 'none';
        this.atualizarStats();
    }

    inicializarProgresso(universidades) {
        const container = document.getElementById('universities-list');
        if (container) {
            container.innerHTML = '';
            universidades.forEach(uni => {
                const div = document.createElement('div');
                div.className = 'university-item pending';
                div.id = `prog-${uni.sigla}`;
                div.innerHTML = `<i class="fas fa-clock"></i> <span>${uni.sigla}</span>`;
                container.appendChild(div);
            });
        }
    }

    atualizarProgresso(uni, resultado) {
        const elemento = document.getElementById(`prog-${uni.sigla}`);
        if (elemento) {
            elemento.className = `university-item ${resultado.success ? 'success' : 'error'}`;
            elemento.innerHTML = `<i class="fas ${resultado.success ? 'fa-check' : 'fa-times'}"></i> <span>${uni.sigla}</span>`;
        }
    }

    processarHTML(html, universidade, url) {
        const editais = [];
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const containerSelector = universidade.selectores.container.split(',')[0].trim();
        const elementos = doc.querySelectorAll(containerSelector);

        elementos.forEach(el => {
            const textoCompleto = el.textContent.trim();
            const linkElem = el.querySelector('a');
            const href = linkElem ? linkElem.href : url;
            
            // O Parser só retorna objeto se encontrar "2026"
            const info = parser.parse(textoCompleto, href, universidade);
            
            if (info) {
                editais.push({
                    ...info,
                    sigla: universidade.sigla,
                    universidade: universidade.nome,
                    estado: universidade.estado,
                    cidade: universidade.cidade
                });
            }
        });
        return editais;
    }

    renderizarPagina() {
        const container = document.getElementById('results-container');
        const section = document.getElementById('results-section');
        const noResults = document.getElementById('no-results');
        
        if (!container) return;
        container.innerHTML = '';

        if (this.resultados.length === 0) {
            if (noResults) noResults.style.display = 'block';
            if (section) section.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        if (section) section.style.display = 'block';
        
        this.resultados = this.removerDuplicatas(this.resultados);

        this.resultados.forEach(edital => {
            const card = document.createElement('div');
            card.className = 'edital-card-cefs';
            card.innerHTML = `
                <div class="edital-header-cefs">
                    <span class="edital-tipo-badge type-${edital.tipo.color}">${edital.tipo.label}</span>
                    <div class="edital-universidade">${edital.sigla} - ${edital.universidade}</div>
                </div>
                <div class="edital-body-cefs">
                    <h4 class="edital-titulo">${edital.titulo}</h4>
                    <div class="info-value-cefs highlight">Prova: ${edital.dataProva}</div>
                </div>
                <div class="edital-footer-cefs">
                    <a href="${edital.link}" target="_blank" class="btn-edital primary">Abrir Edital Oficial</a>
                </div>`;
            container.appendChild(card);
        });
    }

    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 30).toLowerCase()}`;
            return vistos.has(chave) ? false : vistos.add(chave);
        });
    }

    atualizarStats() {
        const statEditais = document.getElementById('stat-editais');
        if (statEditais) statEditais.textContent = this.resultados.length;
    }

    limparFiltros() {
        document.getElementById('filter-universidade').value = 'todos';
        document.getElementById('filter-tipo').value = 'todos';
        document.getElementById('filter-estado').value = 'todos';
        const curso = document.getElementById('filter-curso');
        if (curso) curso.value = '';
    }
}

// Inicialização única
let app;
document.addEventListener('DOMContentLoaded', () => { 
    app = new CEFSVestibularMonitor(); 
});
// Funções de ponte para o HTML (Globais)
function resetarFiltros() {
    if (app) app.limparFiltros();
}

function imprimirResultados() {
    window.print();
}

function exportarCSV() {
    if (!app || app.resultados.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    const headers = ['Universidade', 'Sigla', 'Tipo', 'Título', 'Prova', 'Link'];
    const rows = app.resultados.map(e => [
        e.universidade,
        e.sigla,
        e.tipo?.label || 'Outro',
        `"${e.titulo.replace(/"/g, '""')}"`,
        e.dataProva,
        e.link
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `editais-cefs-2026.csv`;
    link.click();
}
