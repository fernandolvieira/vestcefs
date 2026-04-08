/**
 * CEFS VESTIBULAR MONITOR - Sistema de Dados
 * Combina dados estáticos com tentativa de busca online
 */

const EDITAIS_BASE = [
    // UFMG - SISU 2026 (Exemplo real)
    {
        id: 'ufmg-sisu-2026',
        universidade: 'Universidade Federal de Minas Gerais',
        sigla: 'UFMG',
        estado: 'MG',
        cidade: 'Belo Horizonte',
        tipo: {
            tipo: 'SISU/ENEM',
            label: 'SISU/ENEM',
            color: 'sisu',
            icon: 'fa-file-alt'
        },
        titulo: 'SISU 2026 - Edital de Seleção via ENEM',
        dataProva: 'Utiliza nota ENEM 2025',
        inscricao: {
            inicio: '10/02/2026',
            fim: '14/02/2026',
            status: 'futura'
        },
        taxa: 'Isento',
        documentacao: [
            'Nota do ENEM 2025',
            'Documento de identidade',
            'CPF',
            'Comprovante de residência'
        ],
        publicoAlvo: 'Candidatos com nota do ENEM 2025',
        link: 'https://www.ufmg.br/ingresso/sisu-2026',
        descricao: 'Processo seletivo via Sistema de Seleção Unificada utilizando notas do ENEM 2025.',
        dataAtualizacao: '2026-04-08'
    },
    
    // UFU - PAS 2026 (Seriado)
    {
        id: 'ufu-pas-2026',
        universidade: 'Universidade Federal de Uberlândia',
        sigla: 'UFU',
        estado: 'MG',
        cidade: 'Uberlândia',
        tipo: {
            tipo: 'VESTIBULAR_SERIADO',
            label: 'PAS - Seriado',
            color: 'seriado',
            icon: 'fa-layer-group'
        },
        titulo: 'PAS 2026 - Programa de Avaliação Seriada',
        dataProva: '22/06/2025 (PAS 1)',
        inscricao: {
            inicio: '05/05/2025',
            fim: '20/05/2025',
            status: 'futura'
        },
        taxa: 'R$ 90,00',
        documentacao: [
            'RG ou CNH',
            'CPF',
            'Certidão de nascimento',
            'Comprovante de pagamento',
            'Foto 3x4 digital'
        ],
        publicoAlvo: 'Estudantes do 1º ano do Ensino Médio (ingresso em 2026)',
        link: 'https://www.ufu.br/pas-2026',
        descricao: 'Processo Seriado em 3 etapas para ingresso nos cursos de graduação da UFU.',
        dataAtualizacao: '2026-04-08'
    },
    
    // UFJF - PSV 2026 (Seriado)
    {
        id: 'ufjf-psv-2026',
        universidade: 'Universidade Federal de Juiz de Fora',
        sigla: 'UFJF',
        estado: 'MG',
        cidade: 'Juiz de Fora',
        tipo: {
            tipo: 'VESTIBULAR_SERIADO',
            label: 'PSV - Seriado',
            color: 'seriado',
            icon: 'fa-layer-group'
        },
        titulo: 'PSV 2026 - Processo Seletivo Seriado',
        dataProva: 'Agosto/2025',
        inscricao: {
            inicio: 'Julho/2025',
            fim: 'Agosto/2025',
            status: 'futura'
        },
        taxa: 'R$ 85,00',
        documentacao: [
            'RG',
            'CPF',
            'Histórico escolar',
            'Comprovante de pagamento'
        ],
        publicoAlvo: 'Estudantes do Ensino Médio',
        link: 'https://www.ufjf.br/copeve/psv-2026',
        descricao: 'Seleção seriada para cursos de graduação da UFJF.',
        dataAtualizacao: '2026-04-08'
    },
    
    // USP - FUVEST 2026
    {
        id: 'usp-fuvest-2026',
        universidade: 'Universidade de São Paulo',
        sigla: 'USP',
        estado: 'SP',
        cidade: 'São Paulo',
        tipo: {
            tipo: 'VESTIBULAR_CONVENCIONAL',
            label: 'FUVEST',
            color: 'convencional',
            icon: 'fa-edit'
        },
        titulo: 'FUVEST 2026 - Vestibular USP',
        dataProva: '30/11/2025 (1ª fase)',
        inscricao: {
            inicio: '01/08/2025',
            fim: '15/09/2025',
            status: 'futura'
        },
        taxa: 'R$ 180,00',
        documentacao: [
            'RG ou CNH',
            'CPF',
            'Comprovante de pagamento',
            'Foto digital'
        ],
        publicoAlvo: 'Concluintes ou concluídos do Ensino Médio',
        link: 'https://www.fuvest.usp.br',
        descricao: 'Vestibular tradicional da USP em duas fases.',
        dataAtualizacao: '2026-04-08'
    },
    
    // UNICAMP - COMVEST 2026
    {
        id: 'unicamp-comvest-2026',
        universidade: 'Universidade Estadual de Campinas',
        sigla: 'UNICAMP',
        estado: 'SP',
        cidade: 'Campinas',
        tipo: {
            tipo: 'VESTIBULAR_CONVENCIONAL',
            label: 'COMVEST',
            color: 'convencional',
            icon: 'fa-edit'
        },
        titulo: 'COMVEST 2026 - Vestibular UNICAMP',
        dataProva: '07/12/2025 (1ª fase)',
        inscricao: {
            inicio: '01/09/2025',
            fim: '15/10/2025',
            status: 'futura'
        },
        taxa: 'R$ 160,00',
        documentacao: [
            'RG',
            'CPF',
            'Comprovante de pagamento'
        ],
        publicoAlvo: 'Concluintes do Ensino Médio',
        link: 'https://www.comvest.unicamp.br',
        descricao: 'Vestibular da UNICAMP com primeira fase objetiva e segunda fase discursiva.',
        dataAtualizacao: '2026-04-08'
    },
    
    // UNICAMP - PSV (Seriado)
    {
        id: 'unicamp-psv-2026',
        universidade: 'Universidade Estadual de Campinas',
        sigla: 'UNICAMP',
        estado: 'SP',
        cidade: 'Campinas',
        tipo: {
            tipo: 'VESTIBULAR_SERIADO',
            label: 'PSV - Seriado',
            color: 'seriado',
            icon: 'fa-layer-group'
        },
        titulo: 'PSV 2026 - Programa de Seleção de Variantes',
        dataProva: 'Abril/2025',
        inscricao: {
            inicio: 'Fevereiro/2025',
            fim: 'Março/2025',
            status: 'encerrada'
        },
        taxa: 'R$ 140,00',
        documentacao: [
            'RG',
            'CPF',
            'Comprovante de matrícula no EM'
        ],
        publicoAlvo: 'Estudantes do 2º ano do Ensino Médio',
        link: 'https://www.comvest.unicamp.br/psv',
        descricao: 'Processo seriado da UNICAMP para ingresso antecipado.',
        dataAtualizacao: '2026-04-08'
    },
    
    // UNESP - VUNESP 2026
    {
        id: 'unesp-vunesp-2026',
        universidade: 'Universidade Estadual Paulista',
        sigla: 'UNESP',
        estado: 'SP',
        cidade: 'Várias',
        tipo: {
            tipo: 'VESTIBULAR_CONVENCIONAL',
            label: 'VUNESP',
            color: 'convencional',
            icon: 'fa-edit'
        },
        titulo: 'VUNESP 2026 - Vestibular UNESP',
        dataProva: '15/12/2025',
        inscricao: {
            inicio: '01/09/2025',
            fim: '10/10/2025',
            status: 'futura'
        },
        taxa: 'R$ 150,00',
        documentacao: [
            'RG ou CNH',
            'CPF',
            'Comprovante de pagamento'
        ],
        publicoAlvo: 'Concluintes do Ensino Médio',
        link: 'https://www.vunesp.com.br',
        descricao: 'Vestibular tradicional da UNESP.',
        dataAtualizacao: '2026-04-08'
    },
    
    // UFRJ - SISU 2026
    {
        id: 'ufrj-sisu-2026',
        universidade: 'Universidade Federal do Rio de Janeiro',
        sigla: 'UFRJ',
        estado: 'RJ',
        cidade: 'Rio de Janeiro',
        tipo: {
            tipo: 'SISU/ENEM',
            label: 'SISU/ENEM',
            color: 'sisu',
            icon: 'fa-file-alt'
        },
        titulo: 'SISU 2026 - UFRJ',
        dataProva: 'Nota ENEM 2025',
        inscricao: {
            inicio: '10/02/2026',
            fim: '14/02/2026',
            status: 'futura'
        },
        taxa: 'Isento',
        documentacao: [
            'Nota ENEM 2025',
            'RG',
            'CPF'
        ],
        publicoAlvo: 'Candidatos com nota do ENEM 2025',
        link: 'https://www.ufrj.br/ingresso',
        descricao: 'Seleção via SISU utilizando notas do ENEM.',
        dataAtualizacao: '2026-04-08'
    }
];

/**
 * Sistema de dados híbrido
 */
class DataManager {
    constructor() {
        this.dados = this.carregarDados();
    }

    carregarDados() {
        // Tentar carregar do localStorage primeiro
        try {
            const salvos = localStorage.getItem('cefs_editais');
            if (salvos) {
                const parsed = JSON.parse(salvos);
                // Verificar se dados não estão muito antigos (7 dias)
                const ultimaAtualizacao = new Date(parsed.ultimaAtualizacao || 0);
                const agora = new Date();
                const diasDiff = (agora - ultimaAtualizacao) / (1000 * 60 * 60 * 24);
                
                if (diasDiff < 7 && parsed.editais && parsed.editais.length > 0) {
                    console.log('Dados carregados do cache local');
                    return parsed.editais;
                }
            }
        } catch (e) {
            console.log('Erro ao carregar cache:', e);
        }
        
        // Usar dados base
        console.log('Usando dados base');
        return [...EDITAIS_BASE];
    }

    salvarDados(novosDados) {
        try {
            const pacote = {
                editais: novosDados,
                ultimaAtualizacao: new Date().toISOString()
            };
            localStorage.setItem('cefs_editais', JSON.stringify(pacote));
            this.dados = novosDados;
            return true;
        } catch (e) {
            console.error('Erro ao salvar:', e);
            return false;
        }
    }

    getDados(filtros = {}) {
        let resultado = [...this.dados];
        
        if (filtros.estado && filtros.estado !== 'todos') {
            resultado = resultado.filter(e => e.estado === filtros.estado);
        }
        
        if (filtros.tipo && filtros.tipo !== 'todos') {
            resultado = resultado.filter(e => e.tipo.tipo === filtros.tipo);
        }
        
        if (filtros.sigla && filtros.sigla !== 'todos') {
            resultado = resultado.filter(e => e.sigla === filtros.sigla);
        }
        
        if (filtros.curso) {
            const termo = filtros.curso.toLowerCase();
            resultado = resultado.filter(e => 
                e.titulo.toLowerCase().includes(termo) ||
                e.descricao.toLowerCase().includes(termo)
            );
        }
        
        if (filtros.apenasAbertas) {
            resultado = resultado.filter(e => e.inscricao?.status === 'aberta');
        }
        
        return resultado;
    }

    async tentarBuscaOnline() {
        // Tentativa de busca online com fallback imediato
        console.log('Tentando busca online...');
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            
            // Tentar buscar uma universidade de teste
            const teste = await fetch('https://api.allorigins.win/raw?url=https://www.ufmg.br/ingresso', {
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (teste.ok) {
                console.log('Busca online disponível');
                return { disponivel: true, html: await teste.text() };
            }
        } catch (e) {
            console.log('Busca online indisponível:', e.message);
        }
        
        return { disponivel: false };
    }

    getUltimaAtualizacao() {
        try {
            const salvos = localStorage.getItem('cefs_editais');
            if (salvos) {
                const parsed = JSON.parse(salvos);
                return new Date(parsed.ultimaAtualizacao).toLocaleString('pt-BR');
            }
        } catch (e) {}
        return 'Dados de exemplo';
    }
}

// Instância global
const dataManager = new DataManager();
