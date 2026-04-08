/**
 * CEFS VESTIBULAR MONITOR - v3.2 (Versão Consolidada e Completa)
 * Desenvolvido para: Centro Educacional Frei Seráfico
 * Foco: Varredura Dinâmica 2026 e Estabilidade no Render
 */

class CEFSVestibularMonitor {
    constructor() {
        this.resultados = [];
        this.emExecucao = false;
        this.init();
    }

    /**
     * Inicializa os componentes do sistema
     */
    init() {
        this.preencherFiltros();
        this.bindEventos();
        console.log('CEFS Vestibular Monitor v3.2 inicializado com sucesso');
    }

    /**
     * Preenche o select de universidades dinamicamente com base no universities.js
     */
    preencherFiltros() {
        const select = document.getElementById('filter-universidade');
        if (!select) return;
        
        // Limpa o select e adiciona a opção padrão
        select.innerHTML = '<option value="todos">Todas as Universidades</option>';

        const porEstado = {};
        UNIVERSIDADES.forEach(u => {
            if (!porEstado[u.estado]) porEstado[u.estado] = [];
            porEstado[u.estado].push(u);
        });

        // Organiza as opções em grupos por estado
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

    /**
     * Configura os ouvintes de eventos para os botões de busca e limpeza
     */
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
     * Lógica principal de varredura sequencial através do backend no Render
     */
    async iniciarBusca() {
        if (this.emExecucao) return;
        this.emExecucao = true;
        this.resultados = [];
        
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('results-section');
        
        if (loading) loading.style.display = 'flex';
        if (resultsSection) resultsSection.style.display = 'none';

        // Captura dos valores atuais dos filtros no HTML
        const filtroEstado = document.getElementById('filter-estado')?.value || 'todos';
        const filtroUni = document.getElementById('filter-universidade')?.value || 'todos';
        
        // Lógica de filtragem da lista de busca
        let universidadesParaBuscar = [...UNIVERSIDADES]; 

        if (filtroUni !== 'todos') {
            // Se escolheu uma uni específica, ignora o estado e foca nela
            universidadesParaBuscar = UNIVERSIDADES.filter(u => u.sigla === filtroUni);
        } else if (filtroEstado !== 'todos') {
            // Se escolheu um estado, filtra todas daquele estado
            universidadesParaBuscar = UNIVERSIDADES.filter(u => u.estado === filtroEstado);
        }

        this.inicializarProgresso(universidadesParaBuscar);

        console.log(`[SISTEMA] Iniciando varredura em ${universidadesParaBuscar.length} universidades...`);

        for (const uni of universidadesParaBuscar) {
            console.log(`[MONITOR] Solicitando dados de: ${uni.sigla}...`);
            
            try {
                // Requisição enviada ao seu backend exclusivo no Render
                const res = await proxyManager.fetch(uni.urls[0]);
                this.atualizarProgresso(uni, res);
                
                if (res.success) {
                    const editaisExtraidos = this.processarHTML(res.html, uni, uni.urls[0]);
                    
                    if (editaisExtraidos.length > 0) {
                        console.log(`[SUCESSO] ${editaisExtraidos.length} editais de 2026 encontrados em ${uni.sigla}`);
                        this.resultados.push(...editaisExtraidos);
                    } else {
                        console.log(`[INFO] ${uni.sigla} processada, mas nenhum edital de 2026 detectado.`);
                    }
                }
            } catch (err) {
                console.error(`[ERRO] Falha de comunicação com ${uni.sigla}:`, err);
            }
            
            // Delay de 1.2s para evitar sobrecarga na instância gratuita do Render
            await new Promise(r => setTimeout(r, 1200));
        }

        this.renderizarPagina();
        
        this.emExecucao = false;
        if (loading) loading.style.display = 'none';
        this.atualizarStats();
        console.log("[SISTEMA] Varredura completa finalizada.");
    }

    /**
     * Cria a lista visual de progresso na interface
     */
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

    /**
     * Atualiza o ícone de status (sucesso/erro) de cada universidade
     */
    atualizarProgresso(uni, resultado) {
        const elemento = document.getElementById(`prog-${uni.sigla}`);
        if (elemento) {
            elemento.className = `university-item ${resultado.success ? 'success' : 'error'}`;
            elemento.innerHTML = `<i class="fas ${resultado.success ? 'fa-check' : 'fa-times'}"></i> <span>${uni.sigla}</span>`;
        }
    }

    /**
     * Processa o HTML bruto e utiliza o parser.js para filtrar apenas 2026
     */
    processarHTML(html, universidade, url) {
        const editais = [];
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        // Utiliza o primeiro seletor de container definido no universities.js
        const containerSelector = universidade.selectores.container.split(',')[0].trim();
        const elementos = doc.querySelectorAll(containerSelector);

        elementos.forEach(el => {
            const textoCompleto = el.textContent.trim();
            const linkElem = el.querySelector('a');
            const href = linkElem ? linkElem.href : url;
            
            // O parser.js valida se a informação pertence ao ano de 2026
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

    /**
     * Renderiza os cards de resultados na tela
     */
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
        
        // Remove duplicatas baseadas no título
        const unicos = this.removerDuplicatas(this.resultados);

        unicos.forEach(edital => {
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

    /**
     * Utilitário para evitar que o mesmo edital apareça várias vezes
     */
    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 35).toLowerCase()}`;
            return vistos.has(chave) ? false : vistos.add(chave);
        });
    }

    /**
     * Atualiza o contador de editais encontrados
     */
    atualizarStats() {
        const statEditais = document.getElementById('stat-editais');
        if (statEditais) statEditais.textContent = this.resultados.length;
    }

    /**
     * Reseta os campos de busca para o estado inicial
     */
    limparFiltros() {
        const selects = ['filter-universidade', 'filter-estado', 'filter-tipo'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 'todos';
        });
        
        const curso = document.getElementById('filter-curso');
        if (curso) curso.value = '';
        console.log("[SISTEMA] Filtros resetados.");
    }
}

// Inicialização Global
let app;
document.addEventListener('DOMContentLoaded', () => { 
    app = new CEFSVestibularMonitor(); 
});

/**
 * FUNÇÕES GLOBAIS (Pontes entre o HTML e a Classe)
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
