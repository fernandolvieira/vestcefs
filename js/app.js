/**
 * Aplicação principal do Vestibular Monitor
 */

class VestibularMonitorApp {
    constructor() {
        this.resultados = [];
        this.emExecucao = false;
        this.init();
    }

    init() {
        this.preencherFiltros();
        this.bindEventos();
        this.atualizarStats();
    }

    /**
     * Preenche os filtros dinâmicos
     */
    preencherFiltros() {
        const selectUni = document.getElementById('filter-universidade');
        
        // Agrupar por estado
        const porEstado = {};
        UNIVERSIDADES.forEach(u => {
            if (!porEstado[u.estado]) porEstado[u.estado] = [];
            porEstado[u.estado].push(u);
        });

        // Criar optgroups
        Object.keys(porEstado).sort().forEach(estado => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${estado} (${porEstado[estado].length})`;
            
            porEstado[estado].forEach(u => {
                const option = document.createElement('option');
                option.value = u.sigla;
                option.textContent = `${u.sigla} - ${u.cidade}`;
                optgroup.appendChild(option);
            });
            
            selectUni.appendChild(optgroup);
        });
    }

    /**
     * Vincula eventos aos elementos
     */
    bindEventos() {
        document.getElementById('btn-buscar').addEventListener('click', () => this.iniciarBusca());
        
        // Filtros em tempo real
        ['filter-estado', 'filter-tipo', 'filter-universidade'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.filtrarResultados());
        });
    }

    /**
     * Inicia processo de busca
     */
    async iniciarBusca() {
        if (this.emExecucao) return;
        
        this.emExecucao = true;
        this.resultados = [];
        
        const btn = document.getElementById('btn-buscar');
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('results-section');
        
        // UI de loading
        btn.disabled = true;
        loading.style.display = 'flex';
        resultsSection.style.display = 'none';
        
        // Obter universidades filtradas
        const filtroEstado = document.getElementById('filter-estado').value;
        const filtroUni = document.getElementById('filter-universidade').value;
        
        let universidades = UNIVERSIDADES;
        
        if (filtroUni !== 'todos') {
            universidades = universidades.filter(u => u.sigla === filtroUni);
        } else if (filtroEstado !== 'todos') {
            universidades = universidades.filter(u => u.estado === filtroEstado);
        }

        // Preparar lista de URLs
        const urls = [];
        universidades.forEach(uni => {
            uni.urls.forEach((url, idx) => {
                urls.push({
                    url: url,
                    universidade: uni,
                    prioridade: idx // URLs principais têm prioridade
                });
            });
        });

        // Inicializar UI de progresso
        this.inicializarProgresso(universidades);

        // Executar buscas
        try {
            const resultados = await proxyManager.fetchAll(urls, (info, resultado) => {
                this.atualizarProgresso(info, resultado);
                
                if (resultado.success) {
                    const editais = this.processarHtml(resultado.html, info.universidade, info.url);
                    this.resultados.push(...editais);
                }
            });

            // Processar e exibir resultados
            this.resultados = this.removerDuplicatas(this.resultados);
            this.resultados = this.ordenarResultados(this.resultados);
            
            this.exibirResultados();
            this.atualizarStats();
            
        } catch (error) {
            console.error('Erro na busca:', error);
            alert('Ocorreu um erro durante a busca. Tente novamente.');
        } finally {
            this.emExecucao = false;
            btn.disabled = false;
            loading.style.display = 'none';
        }
    }

    /**
     * Inicializa interface de progresso
     */
    inicializarProgresso(universidades) {
        const container = document.getElementById('universities-list');
        const status = document.getElementById('loading-status');
        
        container.innerHTML = '';
        status.textContent = `Verificando ${universidades.length} universidades...`;
        
        universidades.forEach(uni => {
            const div = document.createElement('div');
            div.className = 'university-item pending';
            div.id = `prog-${uni.sigla}`;
            div.innerHTML = `
                <i class="fas fa-clock"></i>
                <span><strong>${uni.sigla}</strong> - ${uni.nome}</span>
            `;
            container.appendChild(div);
        });
        
        document.getElementById('progress-fill').style.width = '0%';
    }

    /**
     * Atualiza progresso visual
     */
    atualizarProgresso(info, resultado) {
        const sigla = info.universidade.sigla;
        const elemento = document.getElementById(`prog-${sigla}`);
        
        if (elemento) {
            elemento.className = `university-item ${resultado.success ? 'success' : 'error'}`;
            elemento.innerHTML = `
                <i class="fas ${resultado.success ? 'fa-check' : 'fa-times'}"></i>
                <span><strong>${sigla}</strong> - ${resultado.success ? 'OK' : 'Erro'}</span>
            `;
        }

        // Atualizar barra de progresso
        const total = document.querySelectorAll('.university-item').length;
        const processados = document.querySelectorAll('.university-item.success, .university-item.error').length;
        const percentual = (processados / total) * 100;
        
        document.getElementById('progress-fill').style.width = `${percentual}%`;
        document.getElementById('loading-status').textContent = 
            `Processando... ${processados}/${total} universidades`;
    }

    /**
     * Processa HTML e extrai editais
     */
    processarHtml(html, universidade, url) {
        const editais = [];
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Tentar múltiplos seletores
            const seletores = universidade.selectores.container.split(',').map(s => s.trim());
            let elementos = [];
            
            for (const seletor of seletores) {
                elementos = doc.querySelectorAll(seletor);
                if (elementos.length > 0) break;
            }

            elementos.forEach((el, idx) => {
                // Extrair texto
                let titulo = '';
                for (const sel of universidade.selectores.titulo.split(',')) {
                    const elem = el.querySelector(sel.trim());
                    if (elem) {
                        titulo = elem.textContent.trim();
                        break;
                    }
                }

                if (!titulo || titulo.length < 10) return;

                // Extrair link
                let link = '';
                for (const sel of universidade.selectores.link.split(',')) {
                    const elem = el.querySelector(sel.trim());
                    if (elem && elem.href) {
                        link = elem.href;
                        break;
                    }
                }
                if (!link) link = url;

                // Extrair descrição
                let descricao = '';
                for (const sel of universidade.selectores.descricao.split(',')) {
                    const elem = el.querySelector(sel.trim());
                    if (elem) {
                        descricao = elem.textContent.trim();
                        break;
                    }
                }

                // Extrair data
                let data = '';
                for (const sel of universidade.selectores.data.split(',')) {
                    const elem = el.querySelector(sel.trim());
                    if (elem) {
                        data = elem.textContent.trim();
                        break;
                    }
                }

                // Processar com parser inteligente
                const textoCompleto = `${titulo} ${descricao}`;
                const info = parser.parse(textoCompleto, link, universidade);

                // Criar objeto resultado
                editais.push({
                    id: `${universidade.sigla}-${idx}-${Date.now()}`,
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
                    descricao: descricao.substring(0, 300),
                    dataDeteccao: new Date().toLocaleString('pt-BR')
                });
            });

        } catch (error) {
            console.error(`Erro ao processar ${universidade.sigla}:`, error);
        }

        return editais;
    }

    /**
     * Remove duplicatas baseado no título e universidade
     */
    removerDuplicatas(editais) {
        const vistos = new Set();
        return editais.filter(e => {
            const chave = `${e.sigla}-${e.titulo.substring(0, 50)}`;
            if (vistos.has(chave)) return false;
            vistos.add(chave);
            return true;
        });
    }

    /**
     * Ordena resultados por relevância
     */
    ordenarResultados(editais) {
        return editais.sort((a, b) => {
            // Prioridade: Seriados > Convencionais > SISU
            const prioridade = {
                'VESTIBULAR_SERIADO': 3,
                'VESTIBULAR_CONVENCIONAL': 2,
                'SISU/ENEM': 1,
                'OUTRO': 0
            };
            
            const priA = prioridade[a.tipo.tipo] || 0;
            const priB = prioridade[b.tipo.tipo] || 0;
            
            if (priA !== priB) return priB - priA;
            
            // Depois por data de detecção (mais recente primeiro)
            return new Date(b.dataDeteccao) - new Date(a.dataDeteccao);
        });
    }

    /**
     * Exibe resultados na tela
     */
    exibirResultados() {
        const container = document.getElementById('results-container');
        const section = document.getElementById('results-section');
        const noResults = document.getElementById('no-results');
        
        container.innerHTML = '';
        
        // Aplicar filtros atuais
        const filtrados = this.aplicarFiltrosTela(this.resultados);
        
        if (filtrados.length === 0) {
            section.style.display = 'block';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        section.style.display = 'block';

        filtrados.forEach(edital => {
            const card = this.criarCard(edital);
            container.appendChild(card);
        });

        // Scroll suave para resultados
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Cria card de edital
     */
    criarCard(edital) {
        const div = document.createElement('div');
        div.className = 'edital-card';
        
        const tipo = edital.tipo;
        
        // Formatar datas
        let inscricaoHtml = '';
        if (edital.inscricao) {
            if (edital.inscricao.inicio && edital.inscricao.fim) {
                inscricaoHtml = `
                    <div class="info-value ${edital.inscricao.status === 'aberta' ? 'highlight' : ''}">
                        ${edital.inscricao.inicio} até ${edital.inscricao.fim}
                        ${edital.inscricao.status === 'aberta' ? ' (ABERTA!)' : ''}
                    </div>
                `;
            } else if (edital.inscricao.fim) {
                inscricaoHtml = `<div class="info-value">Até ${edital.inscricao.fim}</div>`;
            }
        } else {
            inscricaoHtml = '<div class="info-value">Consultar edital</div>';
        }

        // Documentação
        const docsHtml = edital.documentacao 
            ? edital.documentacao.slice(0, 4).map(d => `<li>${d}</li>`).join('')
            : '<li>Consultar edital oficial</li>';

        div.innerHTML = `
            <div class="edital-header">
                <span class="edital-type type-${tipo.color}">
                    <i class="fas ${tipo.icon}"></i> ${tipo.label}
                </span>
                <div class="edital-university">${edital.universidade}</div>
                <div class="edital-location">
                    <i class="fas fa-map-marker-alt"></i> ${edital.cidade} - ${edital.estado}
                </div>
            </div>
            
            <div class="edital-body">
                <h3 class="edital-title">${edital.titulo}</h3>
                
                <div class="edital-info">
                    <div class="info-row">
                        <i class="fas fa-calendar-check"></i>
                        <div>
                            <div class="info-label">Data da Prova</div>
                            <div class="info-value highlight">${edital.dataProva || 'A definir'}</div>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <i class="fas fa-edit"></i>
                        <div>
                            <div class="info-label">Inscrições</div>
                            ${inscricaoHtml}
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <i class="fas fa-money-bill-wave"></i>
                        <div>
                            <div class="info-label">Taxa de Inscrição</div>
                            <div class="info-value">${edital.taxa}</div>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <i class="fas fa-users"></i>
                        <div>
                            <div class="info-label">Público-Alvo</div>
                            <div class="info-value">${edital.publicoAlvo}</div>
                        </div>
                    </div>
                    
                    <div class="info-row">
                        <i class="fas fa-file-alt"></i>
                        <div>
                            <div class="info-label">Documentação Necessária</div>
                            <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 0.9em;">
                                ${docsHtml}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
           
