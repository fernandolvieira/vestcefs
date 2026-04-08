/**
 * CEFS VESTIBULAR MONITOR
 * Aplicação Principal - Versão Final Estabilizada para Backend Próprio
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
        console.log('CEFS Vestibular Monitor inicializado com sucesso [v2.0 - Render Backend]');
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

        // BUSCA SEQUENCIAL PARA ESTABILIDADE
        for (const uni of universidades) {
            try {
                // Tenta a primeira URL da universidade
                const urlParaBuscar = uni.urls[0];
                const resultado = await proxyManager.fetch(urlParaBuscar);
                
                this.atualizarProgresso(uni, resultado);
                
                if (resultado.success) {
                    const editais = this.processarHTML(resultado.html, uni, urlParaBuscar);
                    this.resultados.push(...editais);
                }
            } catch (err) {
                console.error(`Erro ao consultar ${uni.sigla}:`, err);
            }
            // Pequeno delay para o servidor Render não gargalar
            await new Promise(r => setTimeout(r, 1000));
        }

        // LÓGICA DE CONTINGÊNCIA (FALLBACK)
        if (this.resultados.length === 0) {
            console.warn("Busca online sem resultados ou servidor offline. Carregando dados de fallback.");
            this.resultados = [...EDITAIS_BASE]; // Carrega dados do data.js
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
        if (progressFill) progressFill.style.width = '0%';
    }

    atualizarProgresso(uni, resultado) {
        const elemento = document.getElementById(`prog-${uni.sigla}`);
        if (elemento) {
            const icon = resultado.success ? 'fa-check' : 'fa-times';
            elemento.className = `university-item ${resultado.success ? 'success' : 'error'}`;
            elemento.innerHTML = `<i class="fas ${icon}"></i> <span><strong>${uni.sigla}</strong></span>`;
        }
    }

    processarHTML(html, universidade, url) {
        const editais = [];
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            // Tenta o primeiro seletor de container definido no universities.js
            const containerSelector = universidade.selectores.container.split(',')[0].trim();
            const elementos = doc.querySelectorAll(containerSelector);

            elementos.forEach((el, i) => {
                if (i > 4) return; // Limita a 5 editais por universidade para não poluir
                
                const tituloSelector = universidade.selectores.titulo.split(',')[0].trim();
                const tituloElem = el.querySelector(tituloSelector);
                
                if (tituloElem) {
                    const textoRaw = tituloElem.textContent.trim();
                    // Passa pelo parser inteligente para extrair datas e taxas
                    const infoExtraida = parser.parse(textoRaw, url, universidade);

                    editais.push({
                        id: `${universidade.sigla}-${i}-${Date.now()}`,
                        universidade: universidade.nome,
                        sigla: universidade.sigla,
                        estado: universidade.estado,
                        cidade: universidade.cidade,
                        tipo: infoExtraida.tipo,
                        titulo: textoRaw,
                        dataProva: infoExtraida.dataProva,
                        inscricao: infoExtraida.inscricao,
                        taxa: infoExtraida.taxa,
                        link: url,
                        rawText: textoRaw
                    });
                }
            });
        } catch (e) { 
            console.error(`Erro no processamento de ${universidade.sigla}:`, e); 
        }
        return editais;
    }

    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 40).toLowerCase()}`;
            return vistos.has(chave) ? false : vistos.add(chave);
        });
    }

    ordenarResultados(editais) {
        // Prioriza Vestibulares Seriados no topo
        return editais.sort((a, b) => {
            if (a.tipo?.tipo === 'VESTIBULAR_SERIADO' && b.tipo?.tipo !== 'VESTIBULAR_SERIADO') return -1;
            if (a.tipo?.tipo !== 'VESTIBULAR_SERIADO' && b.tipo?.tipo === 'VESTIBULAR_SERIADO') return 1;
            return 0;
        });
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
        const noResults = document.getElementById('no-results');
        
        if (!container) return;

        container.innerHTML = '';
        
        if (this.resultadosFiltrados.length === 0) {
            noResults.style.display = 'block';
            section.style.display = 'block';
        } else {
            noResults.style.display = 'none';
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
        
        // Formata exibição da inscrição
        let inscricaoTxt = 'Ver edital';
        if (edital.inscricao && edital.inscricao.fim) {
            inscricaoTxt = `Até ${edital.inscricao.fim}`;
        }

        div.innerHTML = `
            <div class="edital-header-cefs">
                <span class="edital-tipo-badge type-${tipo.color}">
                    <i class="fas ${tipo.icon}"></i> ${tipo.label}
                </span>
                <div class="edital-universidade">${edital.universidade}</div>
                <div class="edital-local">${edital.cidade} - ${edital.estado}</div>
            </div>
            <div class="edital-body-cefs">
                <h4 class="edital-titulo">${edital.titulo}</h4>
                <div class="edital-info-grid">
                    <div class="info-item-cefs">
                        <i class="fas fa-calendar-alt"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Data da Prova</div>
                            <div class="info-value-cefs highlight">${edital.dataProva || 'A definir'}</div>
                        </div>
                    </div>
                    <div class="info-item-cefs">
                        <i class="fas fa-edit"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Inscrições</div>
                            <div class="info-value-cefs">${inscricaoTxt}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="edital-footer-cefs">
                <a href="${edital.link}" target="_blank" class="btn-edital primary">
                    <i class="fas fa-external-link-alt"></i> Abrir Edital
                </a>
            </div>`;
        return div;
    }

    atualizarStats() {
        const statEditais = document.getElementById('stat-editais');
        const statAtualizacao = document.getElementById('stat-atualizacao');
        if (statEditais) statEditais.textContent = this.resultadosFiltrados.length;
        if (statAtualizacao) statAtualizacao.textContent = new Date().toLocaleTimeString('pt-BR');
    }

    limparFiltros() {
        const ids = ['filter-estado', 'filter-tipo', 'filter-universidade'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 'todos';
        });
        const curso = document.getElementById('filter-curso');
        if (curso) curso.value = '';
        this.filtrarERenderizar();
    }
}

// Inicialização Global
let app;
document.addEventListener('DOMContentLoaded', () => { 
    app = new CEFSVestibularMonitor(); 
});
