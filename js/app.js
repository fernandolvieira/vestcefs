/**
 * CEFS VESTIBULAR MONITOR - v3.1 (Estabilizada)
 * Foco: Busca Dinâmica 2026 e Estabilidade no Render
 */

class CEFSVestibularMonitor {
    constructor() {
        this.resultados = [];
        this.emExecucao = false;
        this.init();
    }

    init() {
        this.preencherFiltros();
        this.bindEventos();
        console.log('CEFS Vestibular Monitor v3.1 inicializado com sucesso');
    }

    /**
     * Preenche o select de universidades dinamicamente com base no universities.js
     */
    preencherFiltros() {
        const select = document.getElementById('filter-universidade');
        if (!select) return;
        
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

    /**
     * Lógica principal de varredura sequencial
     */
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

        console.log(`[SISTEMA] Iniciando varredura em ${universidadesParaBuscar.length} universidades...`);

        for (const uni of universidadesParaBuscar) {
            console.log(`[MONITOR] Solicitando dados de: ${uni.sigla}...`);
            
            try {
                // Requisição via seu Backend no Render
                const res = await proxyManager.fetch(uni.urls[0]);
                this.atualizarProgresso(uni, res);
                
                if (res.success) {
                    const editaisExtraidos = this.processarHTML(res.html, uni, uni.urls[0]);
                    
                    if (editaisExtraidos.length > 0) {
                        console.log(`[SUCESSO] ${editaisExtraidos.length} editais de 2026 em ${uni.sigla}`);
                        this.resultados.push(...editaisExtraidos);
                    } else {
                        console.log(`[INFO] ${uni.sigla} lida, mas sem editais de 2026 no momento.`);
                    }
                }
            } catch (err) {
                console.error(`[ERRO] Falha crítica em ${uni.sigla}:`, err);
            }
            
            // Delay de 1.5s para estabilidade do servidor gratuito
            await new Promise(r => setTimeout(r, 1500));
        }

        this.renderizarPagina();
        
        this.emExecucao = false;
        if (loading) loading.style.display = 'none';
        this.atualizarStats();
        console.log("[SISTEMA] Varredura completa finalizada.");
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
        
        // Usa o primeiro seletor configurado no universities.js
        const containerSelector = universidade.selectores.container.split(',')[0].trim();
        const elementos = doc.querySelectorAll(containerSelector);

        elementos.forEach(el => {
            const textoCompleto = el.textContent.trim();
            const linkElem = el.querySelector('a');
            const href = linkElem ? linkElem.href : url;
            
            // O parser.js validará se o texto contém "2026"
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
        
        // Remove duplicatas óbvias
        const únicos = this.removerDuplicatas(this.resultados);

        únicos.forEach(edital => {
            const card = document.createElement('div');
            card.className = 'edital-card-cefs';
            card.innerHTML = `
                <div class="edital-header-cefs">
                    <span class="edital-tipo-badge type-${edital.tipo.color}">${edital.tipo.label}</span>
                    <div class="edital-universidade">${edital.sigla} - ${edital.universidade}</div>
                </div>
                <div class="edital-body-cefs">
                    <h4 class="edital-titulo">${edital.titulo}</h4>
                    <div class="info-value-cefs highlight"><i class="fas fa-calendar"></i> Prova: ${edital.dataProva}</div>
                </div>
                <div class="edital-footer-cefs">
                    <a href="${edital.link}" target="_blank" class="btn-edital primary">
                        <i class="fas fa-external-link-alt"></i> Abrir Edital Oficial
                    </a>
                </div>`;
            container.appendChild(card);
        });
    }

    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 35).toLowerCase()}`;
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
        console.log("[SISTEMA] Filtros resetados.");
    }
}

// Inicialização da Instância
let app;
document.addEventListener('DOMContentLoaded', () => { 
    app = new CEFSVestibularMonitor(); 
});

/**
 * FUNÇÕES GLOBAIS (Pontes para o HTML)
 * Necessárias para os botões "onclick" do index.html
 */
function resetarFiltros() {
    if (app) app.limparFiltros();
}

function imprimirResultados() {
    window.print();
}

function exportarCSV() {
    if (!app || app.resultados.length === 0) {
        alert('Nenhum resultado disponível para exportação.');
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
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `monitor-cefs-2026.csv`;
    link.click();
}
