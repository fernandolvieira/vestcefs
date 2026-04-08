/**
 * CEFS VESTIBULAR MONITOR
 * Aplicação principal - Versão Completa
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
        console.log('CEFS Vestibular Monitor inicializado');
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
                if (u.temSeriado) texto += ' ★';
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

        // Filtros em tempo real
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
        document.getElementById('stat-universidades').textContent = UNIVERSIDADES.length;
        document.getElementById('stat-editais').textContent = '-';
    }

    async iniciarBusca() {
        if (this.emExecucao) {
            console.log('Busca já em execução');
            return;
        }
        
        this.emExecucao = true;
        this.resultados = [];
        this.paginaAtual = 1;
        
        const btn = document.getElementById('btn-buscar');
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('results-section');
        
        // UI de loading
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>BUSCANDO...</span>';
        }
        if (loading) loading.style.display = 'flex';
        if (resultsSection) resultsSection.style.display = 'none';

        // Obter filtros
        const filtroEstado = document.getElementById('filter-estado')?.value || 'todos';
        const filtroUni = document.getElementById('filter-universidade')?.value || 'todos';
        
        let universidades = UNIVERSIDADES;
        if (filtroUni !== 'todos') {
            universidades = universidades.filter(u => u.sigla === filtroUni);
        } else if (filtroEstado !== 'todos') {
            universidades = universidades.filter(u => u.estado === filtroEstado);
        }

        console.log(`Buscando em ${universidades.length} universidades...`);

        // Preparar URLs
        const urls = [];
        universidades.forEach(uni => {
            uni.urls.forEach((url, idx) => {
                urls.push({ 
                    url: url, 
                    universidade: uni, 
                    prioridade: idx,
                    id: `${uni.sigla}-${idx}`
                });
            });
        });

        this.inicializarProgresso(universidades);

        try {
            // Buscar em lotes de 3 para não sobrecarregar
            const loteSize = 3;
            for (let i = 0; i < urls.length; i += loteSize) {
                const lote = urls.slice(i, i + loteSize);
                
                await Promise.all(lote.map(async (urlInfo) => {
                    const resultado = await proxyManager.fetch(urlInfo.url);
                    this.atualizarProgresso(urlInfo, resultado);
                    
                    if (resultado.success) {
                        const editais = this.processarHTML(
                            resultado.html, 
                            urlInfo.universidade, 
                            urlInfo.url
                        );
                        this.resultados.push(...editais);
                        console.log(`${urlInfo.universidade.sigla}: ${editais.length} editais`);
                    }
                }));

                // Delay entre lotes
                if (i + loteSize < urls.length) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            console.log(`Total bruto: ${this.resultados.length} editais`);
            
            // Processar resultados
            this.resultados = this.removerDuplicatas(this.resultados);
            this.resultados = this.ordenarResultados(this.resultados);
            
            console.log(`Total após deduplicação: ${this.resultados.length} editais`);
            
            this.filtrarERenderizar();
            this.atualizarStats();
            
        } catch (err) {
            console.error('Erro na busca:', err);
            alert('Ocorreu um erro durante a busca. Verifique o console para detalhes.');
        } finally {
            this.emExecucao = false;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-search"></i> <span>BUSCAR EDITAIS AGORA</span>';
            }
            if (loading) loading.style.display = 'none';
        }
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
                div.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span><strong>${uni.sigla}</strong> - ${uni.nome.substring(0, 30)}...</span>
                `;
                container.appendChild(div);
            });
        }
        
        if (status) status.textContent = `Consultando ${universidades.length} universidades...`;
        if (progressFill) progressFill.style.width = '0%';
    }

    atualizarProgresso(info, resultado) {
        const sigla = info.universidade.sigla;
        const elemento = document.getElementById(`prog-${sigla}`);
        
        if (elemento) {
            const icon = resultado.success ? 'fa-check' : 'fa-times';
            const classe = resultado.success ? 'success' : 'error';
            elemento.className = `university-item ${classe}`;
            elemento.innerHTML = `
                <i class="fas ${icon}"></i>
                <span><strong>${sigla}</strong> - ${resultado.success ? 'OK' : 'Erro'}</span>
            `;
        }

        // Atualizar barra de progresso
        const total = UNIVERSIDADES.length;
        const processados = document.querySelectorAll('.university-item.success, .university-item.error').length;
        const percentual = Math.round((processados / total) * 100);
        
        const progressFill = document.getElementById('progress-fill');
        const loadingStatus = document.getElementById('loading-status');
        
        if (progressFill) progressFill.style.width = `${percentual}%`;
        if (loadingStatus) loadingStatus.textContent = `Progresso: ${percentual}% (${processados}/${total})`;
    }

    processarHTML(html, universidade, url) {
        const editais = [];
        
        try {
            const domParser = new DOMParser();
            const doc = domParser.parseFromString(html, 'text/html');
            
            // Tentar múltiplos seletores
            const seletores = universidade.selectores.container.split(',').map(s => s.trim());
            let elementos = [];
            
            for (const seletor of seletores) {
                try {
                    elementos = doc.querySelectorAll(seletor);
                    if (elementos.length > 0) break;
                } catch (e) {
                    continue;
                }
            }

            // Limitar a 5 elementos por página para evitar excesso
            const maxElementos = Math.min(elementos.length, 5);
            
            for (let i = 0; i < maxElementos; i++) {
                const el = elementos[i];
                
                // Extrair título
                let titulo = '';
                for (const sel of universidade.selectores.titulo.split(',')) {
                    try {
                        const elem = el.querySelector(sel.trim());
                        if (elem && elem.textContent) {
                            titulo = elem.textContent.trim();
                            break;
                        }
                    } catch (e) { continue; }
                }

                if (!titulo || titulo.length < 10) continue;

                // Extrair link
                let link = '';
                for (const sel of universidade.selectores.link.split(',')) {
                    try {
                        const elem = el.querySelector(sel.trim());
                        if (elem && elem.href) {
                            link = elem.href;
                            break;
                        }
                    } catch (e) { continue; }
                }
                if (!link) link = url;

                // Extrair descrição
                let descricao = '';
                for (const sel of universidade.selectores.descricao.split(',')) {
                    try {
                        const elem = el.querySelector(sel.trim());
                        if (elem && elem.textContent) {
                            descricao = elem.textContent.trim();
                            break;
                        }
                    } catch (e) { continue; }
                }

                // Extrair data
                let data = '';
                for (const sel of universidade.selectores.data.split(',')) {
                    try {
                        const elem = el.querySelector(sel.trim());
                        if (elem && elem.textContent) {
                            data = elem.textContent.trim();
                            break;
                        }
                    } catch (e) { continue; }
                }

                // Usar parser inteligente
                const textoCompleto = `${titulo} ${descricao}`;
                const info = parser.parse(textoCompleto, link, universidade);

                // Criar objeto edital
                const edital = {
                    id: `${universidade.sigla}-${i}-${Date.now()}`,
                    universidade: universidade.nome,
                    sigla: universidade.sigla,
                    estado: universidade.estado,
                    cidade: universidade.cidade,
                    tipo: info.tipo,
                    titulo: info.titulo || titulo,
                    dataProva: info.dataProva,
                    inscricao: info.inscricao,
                    taxa: info.taxa,
                    documentacao: info.documentacao,
                    publicoAlvo: info.publicoAlvo,
                    vagas: info.vagas,
                    link: info.link,
                    descricao: descricao.substring(0, 250),
                    dataDeteccao: new Date().toLocaleString('pt-BR'),
                    rawText: textoCompleto
                };

                // Filtrar apenas editais relevantes (não notícias genéricas)
                if (this.isEditalRelevante(edital)) {
                    editais.push(edital);
                }
            }

        } catch (error) {
            console.error(`Erro ao processar ${universidade.sigla}:`, error);
        }

        return editais;
    }

    isEditalRelevante(edital) {
        const texto = (edital.titulo + ' ' + edital.descricao).toLowerCase();
        
        // Palavras-chave que indicam edital de vestibular
        const palavrasChave = [
            'vestibular', 'edital', 'ingresso', 'seleção', 'concurso',
            'prova', 'inscrição', 'matrícula', 'calendário', 'fuvest',
            'comvest', 'vunesp', 'sisu', 'enem', 'seriado', 'pas', 'psv'
        ];
        
        return palavrasChave.some(palavra => texto.includes(palavra));
    }

    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 50).toLowerCase()}`;
            if (vistos.has(chave)) return false;
            vistos.add(chave);
            return true;
        });
    }

    ordenarResultados(editais) {
        const prioridade = {
            'VESTIBULAR_SERIADO': 3,
            'VESTIBULAR_CONVENCIONAL': 2,
            'SISU/ENEM': 1,
            'OUTRO': 0
        };
        
        return editais.sort((a, b) => {
            const priA = prioridade[a.tipo?.tipo] || 0;
            const priB = prioridade[b.tipo?.tipo] || 0;
            if (priA !== priB) return priB - priA;
            return new Date(b.dataDeteccao) - new Date(a.dataDeteccao);
        });
    }

    filtrarERenderizar() {
        const filtroTipo = document.getElementById('filter-tipo')?.value || 'todos';
        const filtroCurso = document.getElementById('filter-curso')?.value?.toLowerCase() || '';
        const apenasAbertas = document.getElementById('check-inscricoes-abertas')?.checked || false;

        this.resultadosFiltrados = this.resultados.filter(e => {
            // Filtro por tipo
            if (filtroTipo !== 'todos' && e.tipo?.tipo !== filtroTipo) {
                return false;
            }
            
            // Filtro por curso
            if (filtroCurso && !e.rawText?.toLowerCase().includes(filtroCurso)) {
                return false;
            }
            
            // Filtro inscrições abertas
            if (apenasAbertas && e.inscricao?.status !== 'aberta') {
                return false;
            }
            
            return true;
        });

        this.renderizarPagina();
    }

    renderizarPagina() {
        const container = document.getElementById('results-container');
        const section = document.getElementById('results-section');
        const noResults = document.getElementById('no-results');
        const countSpan = document.getElementById('results-count');
        
        if (!container) return;

        // Paginação
        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const paginaItens = this.resultadosFiltrados.slice(inicio, fim);

        container.innerHTML = '';

        if (paginaItens.length === 0) {
            if (section) section.style.display = 'block';
            if (noResults) noResults.style.display = 'block';
            if (countSpan) countSpan.textContent = '(0 editais)';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        if (section) section.style.display = 'block';
        if (countSpan) countSpan.textContent = `(${this.resultadosFiltrados.length} editais)`;

        paginaItens.forEach(edital => {
            const card = this.criarCard(edital);
            container.appendChild(card);
        });

        this.renderizarPaginacao();
        
        // Scroll suave
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    criarCard(edital) {
        const div = document.createElement('div');
        div.className = 'edital-card-cefs';
        
        const tipo = edital.tipo || { tipo: 'OUTRO', label: 'Edital', color: 'default', icon: 'fa-file-alt' };
        
        // Formatar inscrição
        let inscricaoHtml = '';
        if (edital.inscricao) {
            if (edital.inscricao.inicio && edital.inscricao.fim) {
                const statusClass = edital.inscricao.status === 'aberta' ? 'highlight' : '';
                const statusText = edital.inscricao.status === 'aberta' ? ' - ABERTA!' : '';
                inscricaoHtml = `<div class="info-value-cefs ${statusClass}">${edital.inscricao.inicio} até ${edital.inscricao.fim}${statusText}</div>`;
            } else if (edital.inscricao.fim) {
                inscricaoHtml = `<div class="info-value-cefs">Até ${edital.inscricao.fim}</div>`;
            }
        } else {
            inscricaoHtml = '<div class="info-value-cefs">Consultar edital</div>';
        }

        // Documentação
        const docsHtml = edital.documentacao?.slice(0, 3).map(d => 
            `<li><i class="fas fa-check-circle" style="color: var(--cefs-vermelho); font-size: 0.8em; margin-right: 5px;"></i>${d}</li>`
        ).join('') || '<li>Consultar edital oficial</li>';

        div.innerHTML = `
            <div class="edital-header-cefs">
                <span class="edital-tipo-badge type-${tipo.color}">
                    <i class="fas ${tipo.icon}"></i> ${tipo.label}
                </span>
                <div class="edital-universidade">${edital.universidade}</div>
                <div class="edital-local">
                    <i class="fas fa-map-marker-alt"></i> ${edital.cidade} - ${edital.estado}
                </div>
            </div>
            
            <div class="edital-body-cefs">
                <h4 class="edital-titulo">${edital.titulo}</h4>
                
                <div class="edital-info-grid">
                    <div class="info-item-cefs">
                        <i class="fas fa-calendar-check"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Data da Prova</div>
                            <div class="info-value-cefs highlight">${edital.dataProva || 'A definir'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item-cefs">
                        <i class="fas fa-edit"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Inscrições</div>
                            ${inscricaoHtml}
                        </div>
                    </div>
                    
                    <div class="info-item-cefs">
                        <i class="fas fa-money-bill-wave"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Taxa</div>
                            <div class="info-value-cefs">${edital.taxa || 'Consultar'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item-cefs">
                        <i class="fas fa-users"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Público-Alvo</div>
                            <div class="info-value-cefs">${edital.publicoAlvo}</div>
                        </div>
                    </div>
                    
                    <div class="info-item-cefs">
                        <i class="fas fa-file-alt"></i>
                        <div class="info-content">
                            <div class="info-label-cefs">Documentação</div>
                            <ul class="info-docs">
                                ${docsHtml}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="edital-footer-cefs">
                <a href="${edital.link}" target="_blank" class="btn-edital primary">
                    <i class="fas fa-external-link-alt"></i> Ver Edital
                </a>
                <button class="btn-edital secondary" onclick="copiarInfo('${edital.id}')">
                    <i class="fas fa-copy"></i> Copiar
                </button>
            </div>
        `;
        
        return div;
    }

    renderizarPaginacao() {
        const container = document.getElementById('pagination');
        const info = document.getElementById('pagina-atual');
        
        if (!container || !info) return;

        const totalPaginas = Math.ceil(this.resultadosFiltrados.length / this.itensPorPagina);
        
        if (totalPaginas <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        info.textContent = `Página ${this.paginaAtual} de ${totalPaginas}`;
        
        // Habilitar/desabilitar botões
        const botoes = container.querySelectorAll('.btn-page');
        if (botoes[0]) botoes[0].disabled = this.paginaAtual === 1;
        if (botoes[1]) botoes[1].disabled = this.paginaAtual === totalPaginas;
    }

    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.renderizarPagina();
        }
    }

    proximaPagina() {
        const totalPaginas = Math.ceil(this.resultadosFiltrados.length / this.itensPorPagina);
        if (this.paginaAtual < totalPaginas) {
            this.paginaAtual++;
            this.renderizarPagina();
        }
    }

    atualizarStats() {
        const statEditais = document.getElementById('stat-editais');
        const statAtualizacao = document.getElementById('stat-atualizacao');
        
        if (statEditais) statEditais.textContent = this.resultadosFiltrados.length;
        if (statAtualizacao) statAtualizacao.textContent = new Date().toLocaleTimeString('pt-BR');
    }

    limparFiltros() {
        document.getElementById('filter-estado').value = 'todos';
        document.getElementById('filter-tipo').value = 'todos';
        document.getElementById('filter-universidade').value = 'todos';
        document.getElementById('filter-curso').value = '';
        document.getElementById('check-inscricoes-abertas').checked = false;
        
        if (this.resultados.length > 0) {
            this.filtrarERenderizar();
        }
    }
}

// Instanciar quando DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CEFSVestibularMonitor();
});

// Funções globais para botões
function paginaAnterior() {
    app?.paginaAnterior();
}

function proximaPagina() {
    app?.proximaPagina();
}

function exportarCSV() {
    if (!app || app.resultadosFiltrados.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    const headers = ['Universidade', 'Sigla', 'Tipo', 'Título', 'Data Prova', 'Inscrição', 'Taxa', 'Link'];
    const rows = app.resultadosFiltrados.map(e => [
        e.universidade,
        e.sigla,
        e.tipo?.label || 'Outro',
        `"${e.titulo.replace(/"/g, '""')}"`,
        e.dataProva || '',
        e.inscricao ? `${e.inscricao.inicio || ''} a ${e.inscricao.fim || ''}` : '',
        e.taxa || '',
        e.link
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `editais-cefs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function imprimirResultados() {
    window.print();
}

function compartilhar() {
    if (navigator.share) {
        navigator.share({
            title: 'CEFS Vestibular Monitor',
            text: `Encontrei ${app?.resultadosFiltrados.length || 0} editais de vestibular!`,
            url: window.location.href
        });
    } else {
        alert('Link copiado para a área de transferência!');
    }
}

function resetarFiltros() {
    app?.limparFiltros();
}

function copiarInfo(id) {
    const edital = app?.resultadosFiltrados.find(e => e.id === id);
    if (edital) {
        const texto = `${edital.universidade} - ${edital.titulo}\nData: ${edital.dataProva || 'A definir'}\nLink: ${edital.link}`;
        navigator.clipboard?.writeText(texto).then(() => alert('Informações copiadas!'));
    }
}
