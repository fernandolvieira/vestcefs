/**
 * CEFS VESTIBULAR MONITOR
 * Aplicação Principal - Versão Final Estabilizada
 */

class CEFSVestibularMonitor {
    constructor() {
        this.resultados = [];
        this.resultadosFiltrados = [];
        this.emExecucao = false;
        this.paginaAtual = 1;
        this.itensPorPagina = 9;
        this.init();
    }

    init() {
        this.preencherFiltros();
        this.bindEventos();
        this.atualizarStatsIniciais();
        console.log('CEFS Vestibular Monitor inicializado com sucesso');
    }

    preencherFiltros() {
        const select = document.getElementById('filter-universidade');
        if (!select) return;
        
        const porEstado = {};
        UNIVERSIDADES.forEach(u => {
            if (!porEstado[u.estado]) porEstado[u.estado] = [];
            porEstado[u.estado].push(u);
        });

        Object.keys(porEstado).sort().forEach(estado => {
            const group = document.createElement('optgroup');
            group.label = `${estado} - ${this.getEstadoNome(estado)}`;
            
            porEstado[estado].forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.sigla;
                let texto = `${u.sigla} - ${u.cidade}`;
                if (u.temSeriado) texto += ' [SERIADO]';
                opt.textContent = texto;
                group.appendChild(opt);
            });
            
            select.appendChild(group);
        });
    }

    getEstadoNome(sigla) {
        const nomes = { 'MG': 'Minas Gerais', 'SP': 'São Paulo', 'RJ': 'Rio de Janeiro' };
        return nomes[sigla] || sigla;
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

        ['filter-estado', 'filter-tipo', 'filter-universidade'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    if (this.resultados.length > 0) this.filtrarERenderizar();
                });
            }
        });
    }

    atualizarStatsIniciais() {
        const statUni = document.getElementById('stat-universidades');
        if (statUni) statUni.textContent = UNIVERSIDADES.length;
    }

    async iniciarBusca() {
        if (this.emExecucao) return;
        
        this.emExecucao = true;
        this.resultados = [];
        this.paginaAtual = 1;
        
        const btn = document.getElementById('btn-buscar');
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('results-section');
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>BUSCANDO...</span>';
        }
        if (loading) loading.style.display = 'flex';
        if (resultsSection) resultsSection.style.display = 'none';

        const filtroEstado = document.getElementById('filter-estado')?.value || 'todos';
        const filtroUni = document.getElementById('filter-universidade')?.value || 'todos';
        
        let universidades = UNIVERSIDADES;
        if (filtroUni !== 'todos') {
            universidades = universidades.filter(u => u.sigla === filtroUni);
        } else if (filtroEstado !== 'todos') {
            universidades = universidades.filter(u => u.estado === filtroEstado);
        }

        this.inicializarProgresso(universidades);

        // PROCESSAMENTO SEQUENCIAL (Reduz chance de bloqueio 403/408)
        for (const uni of universidades) {
            const urlInfo = { url: uni.urls[0], universidade: uni };
            try {
                const resultado = await proxyManager.fetch(urlInfo.url);
                this.atualizarProgresso(urlInfo, resultado);
                
                if (resultado.success) {
                    const editais = this.processarHTML(resultado.html, uni, urlInfo.url);
                    this.resultados.push(...editais);
                }
            } catch (err) {
                console.error(`Falha em ${uni.sigla}:`, err);
            }
            // Delay técnico entre requisições
            await new Promise(r => setTimeout(r, 1200));
        }

        // LÓGICA DE FALLBACK: Se a busca falhar, carrega dados base
        if (this.resultados.length === 0) {
            console.warn("Sem resultados online. Ativando dados de contingência");
            this.resultados = [...EDITAIS_BASE];
        }

        this.resultados = this.removerDuplicatas(this.resultados);
        this.resultados = this.ordenarResultados(this.resultados);
        this.filtrarERenderizar();
        this.atualizarStats();
        
        this.emExecucao = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> <span>BUSCAR EDITAIS AGORA</span>';
        }
        if (loading) loading.style.display = 'none';
    }

    inicializarProgresso(universidades) {
        const container = document.getElementById('universities-list');
        const status = document.getElementById('loading-status');
        const progressFill = document.getElementById('progress-fill');
        
        if (container) {
            container.innerHTML = '';
            universidades.forEach(uni => {
                const div = document.createElement('div');
                div.className = 'university-item pending';
                div.id = `prog-${uni.sigla}`;
                div.innerHTML = `<i class="fas fa-clock"></i> <span><strong>${uni.sigla}</strong></span>`;
                container.appendChild(div);
            });
        }
        if (status) status.textContent = `Consultando ${universidades.length} universidades...`;
        if (progressFill) progressFill.style.width = '0%';
    }

    atualizarProgresso(info, resultado) {
        const elemento = document.getElementById(`prog-${info.universidade.sigla}`);
        if (elemento) {
            const icon = resultado.success ? 'fa-check' : 'fa-times';
            elemento.className = `university-item ${resultado.success ? 'success' : 'error'}`;
            elemento.innerHTML = `<i class="fas ${icon}"></i> <span><strong>${info.universidade.sigla}</strong></span>`;
        }
    }

    processarHTML(html, universidade, url) {
        const editais = [];
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const containerSelector = universidade.selectores.container.split(',')[0];
            const elementos = doc.querySelectorAll(containerSelector);

            elementos.forEach((el, i) => {
                if (i > 4) return;
                const tituloElem = el.querySelector(universidade.selectores.titulo.split(',')[0]);
                if (tituloElem) {
                    const texto = tituloElem.textContent.trim();
                    const info = parser.parse(texto, url, universidade);
                    editais.push({
                        id: `${universidade.sigla}-${i}-${Date.now()}`,
                        universidade: universidade.nome,
                        sigla: universidade.sigla,
                        estado: universidade.estado,
                        cidade: universidade.cidade,
                        tipo: info.tipo,
                        titulo: texto,
                        dataProva: info.dataProva,
                        inscricao: info.inscricao,
                        taxa: info.taxa,
                        link: url,
                        rawText: texto
                    });
                }
            });
        } catch (e) { console.error("Erro no parser:", e); }
        return editais;
    }

    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 30).toLowerCase()}`;
            return vistos.has(chave) ? false : vistos.add(chave);
        });
    }

    ordenarResultados(editais) {
        return editais.sort((a, b) => (b.tipo?.tipo === 'VESTIBULAR_SERIADO' ? 1 : -1));
    }

    filtrarERenderizar() {
        const filtroTipo = document.getElementById('filter-tipo')?.value || 'todos';
        const filtroCurso = document.getElementById('filter-curso')?.value?.toLowerCase() || '';

        this.resultadosFiltrados = this.resultados.filter(e => {
            if (filtroTipo !== 'todos' && e.tipo?.tipo !== filtroTipo) return false;
            if (filtroCurso && !e.rawText?.toLowerCase().includes(filtroCurso)) return false;
            return true;
        });

        this.renderizarPagina();
    }

    renderizarPagina() {
        const container = document.getElementById('results-container');
        const section = document.getElementById('results-section');
        if (!container) return;

        container.innerHTML = '';
        if (this.resultadosFiltrados.length === 0) {
            document.getElementById('no-results').style.display = 'block';
        } else {
            document.getElementById('no-results').style.display = 'none';
            section.style.display = 'block';
            this.resultadosFiltrados.slice(0, this.itensPorPagina).forEach(edital => {
                container.appendChild(this.criarCard(edital));
            });
        }
        this.atualizarStats();
    }

    criarCard(edital) {
        const div = document.createElement('div');
        div.className = 'edital-card-cefs';
        const tipo = edital.tipo || { label: 'Edital', color: 'default', icon: 'fa-file' };
        
        div.innerHTML = `
            <div class="edital-header-cefs">
                <span class="edital-tipo-badge type-${tipo.color}"><i class="fas ${tipo.icon}"></i> ${tipo.label}</span>
                <div class="edital-universidade">${edital.universidade}</div>
            </div>
            <div class="edital-body-cefs">
                <h4 class="edital-titulo">${edital.titulo}</h4>
                <div class="info-value-cefs highlight">Prova: ${edital.dataProva || 'Ver edital'}</div>
                <div class="info-value-cefs">Taxa: ${edital.taxa || 'Consultar'}</div>
            </div>
            <div class="edital-footer-cefs">
                <a href="${edital.link}" target="_blank" class="btn-edital primary">Ver Edital</a>
            </div>`;
        return div;
    }

    atualizarStats() {
        const statEditais = document.getElementById('stat-editais');
        if (statEditais) statEditais.textContent = this.resultadosFiltrados.length;
    }

    limparFiltros() {
        ['filter-estado', 'filter-tipo', 'filter-universidade'].forEach(id => document.getElementById(id).value = 'todos');
        document.getElementById('filter-curso').value = '';
        this.filtrarERenderizar();
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => { app = new CEFSVestibularMonitor(); });
