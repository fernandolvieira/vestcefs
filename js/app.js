/**
 * CEFS VESTIBULAR MONITOR
 * Sistema Híbrido: Dados estáticos + Busca online opcional
 */

class CEFSVestibularMonitor {
    constructor() {
        this.resultados = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 9;
        this.modoOnline = false;
        this.init();
    }

    init() {
        this.preencherFiltros();
        this.bindEventos();
        this.mostrarDadosIniciais();
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
                this.executarBusca();
            });
        }
        
        if (btnLimpar) {
            btnLimpar.addEventListener('click', (e) => {
                e.preventDefault();
                this.limparFiltros();
            });
        }

        ['filter-estado', 'filter-tipo', 'filter-universidade', 'filter-curso'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    if (this.resultados.length > 0) this.aplicarFiltros();
                });
            }
        });

        const checkAbertas = document.getElementById('check-inscricoes-abertas');
        if (checkAbertas) {
            checkAbertas.addEventListener('change', () => {
                if (this.resultados.length > 0) this.aplicarFiltros();
            });
        }
    }

    mostrarDadosIniciais() {
        // Mostrar dados do cache imediatamente
        const dados = dataManager.getDados();
        this.resultados = dados;
        this.aplicarFiltros();
        this.atualizarStats();
        
        // Mostrar aviso sobre dados
        const ultimaAtualizacao = dataManager.getUltimaAtualizacao();
        console.log(`Dados carregados. Última atualização: ${ultimaAtualizacao}`);
    }

    async executarBusca() {
        const btn = document.getElementById('btn-buscar');
        const loading = document.getElementById('loading');
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>ATUALIZANDO...</span>';
        }
        if (loading) loading.style.display = 'flex';

        // Obter filtros
        const filtros = {
            estado: document.getElementById('filter-estado')?.value || 'todos',
            tipo: document.getElementById('filter-tipo')?.value || 'todos',
            sigla: document.getElementById('filter-universidade')?.value || 'todos',
            curso: document.getElementById('filter-curso')?.value || '',
            apenasAbertas: document.getElementById('check-inscricoes-abertas')?.checked || false
        };

        // Mostrar progresso visual
        this.simularProgresso();

        // Tentar busca online (não bloqueante)
        const online = await dataManager.tentarBuscaOnline();
        
        if (online.disponivel) {
            console.log('Dados online disponíveis, processando...');
            // Aqui poderia processar HTML e extrair novos editais
            // Por enquanto, usamos dados estáticos atualizados manualmente
        }

        // Carregar dados (do cache ou base)
        this.resultados = dataManager.getDados(filtros);
        
        // Pequeno delay para UX
        await new Promise(r => setTimeout(r, 800));

        this.aplicarFiltros();
        this.atualizarStats();
        
        // Esconder loading
        if (loading) loading.style.display = 'none';
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i> <span>BUSCAR EDITAIS</span>';
        }

        // Scroll para resultados
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    simularProgresso() {
        const container = document.getElementById('universities-list');
        const status = document.getElementById('loading-status');
        const progressFill = document.getElementById('progress-fill');
        
        if (!container) return;

        const universidades = UNIVERSIDADES.slice(0, 6); // Mostrar apenas 6 para não poluir
        
        container.innerHTML = '';
        universidades.forEach((uni, i) => {
            const div = document.createElement('div');
            div.className = 'university-item pending';
            div.id = `prog-${uni.sigla}`;
            div.innerHTML = `
                <i class="fas fa-clock"></i>
                <span><strong>${uni.sigla}</strong> - ${uni.nome.substring(0, 30)}...</span>
            `;
            container.appendChild(div);
            
            // Animar progresso
            setTimeout(() => {
                const el = document.getElementById(`prog-${uni.sigla}`);
                if (el) {
                    el.className = 'university-item success';
                    el.innerHTML = `<i class="fas fa-check"></i><span><strong>${uni.sigla}</strong> - OK</span>`;
                }
                
                if (progressFill) {
                    progressFill.style.width = `${((i + 1) / universidades.length) * 100}%`;
                }
            }, 300 + (i * 200));
        });
        
        if (status) status.textContent = 'Carregando dados...';
    }

    aplicarFiltros() {
        const filtros = {
            estado: document.getElementById('filter-estado')?.value || 'todos',
            tipo: document.getElementById('filter-tipo')?.value || 'todos',
            sigla: document.getElementById('filter-universidade')?.value || 'todos',
            curso: document.getElementById('filter-curso')?.value || '',
            apenasAbertas: document.getElementById('check-inscricoes-abertas')?.checked || false
        };

        this.resultados = dataManager.getDados(filtros);
        this.paginaAtual = 1;
        this.renderizar();
    }

    renderizar() {
        const container = document.getElementById('results-container');
        const section = document.getElementById('results-section');
        const noResults = document.getElementById('no-results');
        const countSpan = document.getElementById('results-count');
        
        if (!container) return;

        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const paginaItens = this.resultados.slice(inicio, fim);

        container.innerHTML = '';

        if (paginaItens.length === 0) {
            if (section) section.style.display = 'block';
            if (noResults) noResults.style.display = 'block';
            if (countSpan) countSpan.textContent = '(0 editais)';
            document.getElementById('pagination').style.display = 'none';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        if (section) section.style.display = 'block';
        if (countSpan) countSpan.textContent = `(${this.resultados.length} editais)`;

        paginaItens.forEach(edital => {
            const card = this.criarCard(edital);
            container.appendChild(card);
        });

        this.renderizarPaginacao();
    }

    criarCard(edital) {
        const div = document.createElement('div');
        div.className = 'edital-card-cefs';
        
        const tipo = edital.tipo;
        
        let inscricaoHtml = '';
        if (edital.inscricao) {
            const statusClass = edital.inscricao.status === 'aberta' ? 'highlight' : '';
            const statusText = edital.inscricao.status === 'aberta' ? ' - ABERTA!' : 
                              edital.inscricao.status === 'futura' ? ' (Em breve)' : ' (Encerrada)';
            
            if (edital.inscricao.inicio && edital.inscricao.fim) {
                inscricaoHtml = `<div class="info-value-cefs ${statusClass}">${edital.inscricao.inicio} até ${edital.inscricao.fim}${statusText}</div>`;
            } else {
                inscricaoHtml = `<div class="info-value-cefs">${edital.inscricao.fim || 'Consultar edital'}${statusText}</div>`;
            }
        }

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
                            <div class="info-label-cefs">Data da Prova / Seleção</div>
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
                            <div class="info-label-cefs">Taxa de Inscrição</div>
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
                            <div class="info-label-cefs">Documentação Necessária</div>
                            <ul class="info-docs">
                                ${docsHtml}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="edital-footer-cefs">
                <a href="${edital.link}" target="_blank" rel="noopener" class="btn-edital primary">
                    <i class="fas fa-external-link-alt"></i> Acessar Edital
                </a>
                <button class="btn-edital secondary" onclick="copiarInfo('${edital.id}')">
                    <i class="fas fa-copy"></i> Copiar Info
                </button>
            </div>
        `;
        
        return div;
    }

    renderizarPaginacao() {
        const container = document.getElementById('pagination');
        const info = document.getElementById('pagina-atual');
        
        if (!container || !info) return;

        const totalPaginas = Math.ceil(this.resultados.length / this.itensPorPagina);
        
        if (totalPaginas <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        info.textContent = `Página ${this.paginaAtual} de ${totalPaginas}`;
        
        const botoes = container.querySelectorAll('.btn-page');
        if (botoes[0]) botoes[0].disabled = this.paginaAtual === 1;
        if (botoes[1]) botoes[1].disabled = this.paginaAtual === totalPaginas;
    }

    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.renderizar();
        }
    }

    proximaPagina() {
        const totalPaginas = Math.ceil(this.resultados.length / this.itensPorPagina);
        if (this.paginaAtual < totalPaginas) {
            this.paginaAtual++;
            this.renderizar();
        }
    }

    atualizarStats() {
        const statEditais = document.getElementById('stat-editais');
        const statAtualizacao = document.getElementById('stat-atualizacao');
        
        if (statEditais) statEditais.textContent = this.resultados.length;
        if (statAtualualizacao) statAtualizacao.textContent = new Date().toLocaleTimeString('pt-BR');
    }

    limparFiltros() {
        const ids = ['filter-estado', 'filter-tipo', 'filter-universidade'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 'todos';
        });
        
        const curso = document.getElementById('filter-curso');
        if (curso) curso.value = '';
        
        const check = document.getElementById('check-inscricoes-abertas');
        if (check) check.checked = false;
        
        this.aplicarFiltros();
    }
}

// Inicialização
let app;
document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new CEFSVestibularMonitor();
    } catch (e) {
        console.error('Erro ao iniciar:', e);
    }
});

// Funções globais
function paginaAnterior() { app?.paginaAnterior(); }
function proximaPagina() { app?.proximaPagina(); }

function exportarCSV() {
    if (!app || app.resultados.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    const headers = ['Universidade', 'Sigla', 'Tipo', 'Título', 'Data Prova', 'Inscrição', 'Taxa', 'Link'];
    const rows = app.resultados.map(e => [
        e.universidade,
        e.sigla,
        e.tipo?.label || 'Outro',
        '"' + (e.titulo || '').replace(/"/g, '""') + '"',
        e.dataProva || '',
        (e.inscricao?.inicio || '') + ' a ' + (e.inscricao?.fim || ''),
        e.taxa || '',
        e.link
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'editais-cefs-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function imprimirResultados() {
    window.print();
}

function compartilhar() {
    const count = app?.resultados?.length || 0;
    const text = `Encontrei ${count} editais de vestibular no CEFS Vestibular Monitor!`;
    
    if (navigator.share) {
        navigator.share({ title: 'CEFS Vestibular Monitor', text: text, url: window.location.href });
    } else {
        navigator.clipboard?.writeText(window.location.href).then(() => alert('Link copiado!'));
    }
}

function resetarFiltros() {
    app?.limparFiltros();
}

function copiarInfo(id) {
    const edital = app?.resultados?.find(e => e.id === id);
    if (edital) {
        const texto = `${edital.universidade}\n${edital.titulo}\nData: ${edital.dataProva || 'A definir'}\nLink: ${edital.link}`;
        navigator.clipboard?.writeText(texto).then(() => alert('Copiado!'));
    }
}
