// Configuração completa das universidades monitoradas
const UNIVERSIDADES = [
    // MINAS GERAIS - Federais
    {
        sigla: 'UFMG',
        nome: 'Universidade Federal de Minas Gerais',
        cidade: 'Belo Horizonte',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufmg.br/ingresso',
            'https://www.ufmg.br/ufmg/ingresso/vestibular'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.noticia-ingresso, .box-ingresso, .views-row',
            titulo: 'h2, h3, .titulo-noticia, .views-field-title',
            data: '.data-publicacao, time, .views-field-created',
            link: 'a[href*="edital"], a[href*="ingresso"]',
            descricao: '.resumo, .views-field-body, p'
        }
    },
    {
        sigla: 'UFU',
        nome: 'Universidade Federal de Uberlândia',
        cidade: 'Uberlândia',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufu.br/ingresso',
            'https://www.ufu.br/graduacao/ingresso'
        ],
        processoSeletivo: 'PAS - Programa de Avaliação Seriada',
        temSeriado: true,
        selectores: {
            container: '.view-content .views-row, .noticia',
            titulo: '.views-field-title, .field-title, h3',
            data: '.views-field-created, .data',
            link: 'a[href*="pas"], a[href*="edital"]',
            descricao: '.views-field-body'
        }
    },
    {
        sigla: 'UFJF',
        nome: 'Universidade Federal de Juiz de Fora',
        cidade: 'Juiz de Fora',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufjf.br/ingresso/',
            'https://www.ufjf.br/copeve/'
        ],
        processoSeletivo: 'PSV - Processo Seletivo Seriado',
        temSeriado: true,
        selectores: {
            container: '.post, .item-list li, article',
            titulo: '.entry-title, h2 a, h3',
            data: '.published, .date, time',
            link: 'a[href*="vestibular"], a[href*="psv"], a[href*="edital"]',
            descricao: '.entry-summary, .excerpt'
        }
    },
    {
        sigla: 'UFV',
        nome: 'Universidade Federal de Viçosa',
        cidade: 'Viçosa',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufv.br/ingresso/',
            'https://www.ufv.br/ingresso/vestibular/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.noticia, .post, .views-row',
            titulo: 'h2.entry-title, h3',
            data: '.meta-data, .created',
            link: 'a[href*="ingresso"], a[href*="edital"]',
            descricao: '.entry-content p'
        }
    },
    {
        sigla: 'UFTM',
        nome: 'Universidade Federal do Triângulo Mineiro',
        cidade: 'Uberaba',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.uftm.edu.br/ingresso',
            'https://www.uftm.edu.br/vestibular'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.item-page, .blog, article',
            titulo: '.page-header, h2, h3',
            data: '.article-info, .published',
            link: 'a[href*="edital"]',
            descricao: 'p, .article-content'
        }
    },
    {
        sigla: 'UFLA',
        nome: 'Universidade Federal de Lavras',
        cidade: 'Lavras',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufla.br/ingresso/',
            'https://www.ufla.br/ingresso/vestibular/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.node-article, .views-row',
            titulo: '.field-title, h3',
            data: '.field-date, .created',
            link: 'a[href*="edital"]',
            descricao: '.field-body'
        }
    },
    {
        sigla: 'UFSJ',
        nome: 'Universidade Federal de São João del-Rei',
        cidade: 'São João del-Rei',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufsj.edu.br/ingresso/',
            'https://www.ufsj.edu.br/prorext/ingresso/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.content-section, .item',
            titulo: 'h3, h4, .title',
            data: '.date-display, .created',
            link: 'a[href*="ingresso"]',
            descricao: '.field-items, .content'
        }
    },
    {
        sigla: 'UFOP',
        nome: 'Universidade Federal de Ouro Preto',
        cidade: 'Ouro Preto',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufop.br/ingresso',
            'https://www.ufop.br/ingresso/vestibular'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.view-content .views-row',
            titulo: '.views-field-title a, h3',
            data: '.views-field-created',
            link: 'a[href*="edital"]',
            descricao: '.views-field-body'
        }
    },
    {
        sigla: 'UNIFAL-MG',
        nome: 'Universidade Federal de Alfenas',
        cidade: 'Alfenas',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.unifal-mg.edu.br/ingresso/',
            'https://www.unifal-mg.edu.br/proen/ingresso/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.post-content, article',
            titulo: '.entry-title, h2',
            data: '.entry-date, .created',
            link: 'a[href*="edital"]',
            descricao: '.entry-content'
        }
    },
    {
        sigla: 'UNIFEI',
        nome: 'Universidade Federal de Itajubá',
        cidade: 'Itajubá',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.unifei.edu.br/ingresso/',
            'https://www.unifei.edu.br/ingresso/vestibular/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        observacao: 'Forte em Engenharia e TI',
        selectores: {
            container: '.item-page, .blog-featured',
            titulo: '.page-header, h2',
            data: '.article-info dd, .created',
            link: 'a[href*="edital"]',
            descricao: 'p'
        }
    },
    {
        sigla: 'UFVJM',
        nome: 'Universidade Federal dos Vales do Jequitinhonha e Mucuri',
        cidade: 'Diamantina',
        estado: 'MG',
        tipo: 'Federal',
        urls: [
            'https://www.ufvjm.edu.br/ingresso/',
            'https://www.ufvjm.edu.br/ingresso/vestibular/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.contentpaneopen, .item',
            titulo: '.contentheading, h2',
            data: '.createdate, .created',
            link: 'a[href*="edital"]',
            descricao: '.article-content'
        }
    },

    // SÃO PAULO - Federais
    {
        sigla: 'UNIFESP',
        nome: 'Universidade Federal de São Paulo',
        cidade: 'São Paulo',
        estado: 'SP',
        tipo: 'Federal',
        urls: [
            'https://www.unifesp.br/ingresso/',
            'https://www.unifesp.br/ingresso/vestibular/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.content-article, .item',
            titulo: '.page-title, h2',
            data: '.documentByLine, .created',
            link: 'a[href*="edital"]',
            descricao: '.documentDescription'
        }
    },
    {
        sigla: 'UFSCar',
        nome: 'Universidade Federal de São Carlos',
        cidade: 'São Carlos',
        estado: 'SP',
        tipo: 'Federal',
        urls: [
            'https://www.ufscar.br/ingresso/',
            'https://www.prograd.ufscar.br/ingresso/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.view-content .views-row',
            titulo: '.views-field-title',
            data: '.views-field-created',
            link: 'a[href*="edital"]',
            descricao: '.views-field-body'
        }
    },
    {
        sigla: 'UFABC',
        nome: 'Universidade Federal do ABC',
        cidade: 'Santo André/São Bernardo',
        estado: 'SP',
        tipo: 'Federal',
        urls: [
            'https://www.ufabc.edu.br/ingresso/',
            'https://prograd.ufabc.edu.br/ingresso/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.view-content .views-row',
            titulo: '.views-field-title a',
            data: '.views-field-created',
            link: 'a[href*="edital"]',
            descricao: '.views-field-body'
        }
    },

    // SÃO PAULO - Estaduais
    {
        sigla: 'USP',
        nome: 'Universidade de São Paulo',
        cidade: 'São Paulo',
        estado: 'SP',
        tipo: 'Estadual',
        urls: [
            'https://www.fuvest.usp.br',
            'https://www5.usp.br/ingresso/'
        ],
        processoSeletivo: 'FUVEST',
        temSeriado: false,
        selectores: {
            container: '.edital-item, .noticia, .views-row',
            titulo: 'h3, .titulo, .views-field-title a',
            data: '.data, .views-field-created, .date-display-single',
            link: 'a[href*="edital"], a[href*="fuvest"]',
            descricao: '.resumo, .views-field-body'
        }
    },
    {
        sigla: 'UNICAMP',
        nome: 'Universidade Estadual de Campinas',
        cidade: 'Campinas',
        estado: 'SP',
        tipo: 'Estadual',
        urls: [
            'https://www.comvest.unicamp.br/',
            'https://www.comvest.unicamp.br/vestibular-2026/'
        ],
        processoSeletivo: 'COMVEST',
        temSeriado: true,
        nomeSeriado: 'PSV - Programa de Seleção de Variantes',
        selectores: {
            container: '.noticia, .item-list li, .views-row',
            titulo: 'h2, h3, .titulo-noticia',
            data: '.data, .data-publicacao',
            link: 'a[href*="edital"], a[href*="vestibular"]',
            descricao: '.resumo, .field-body'
        }
    },
    {
        sigla: 'UNESP',
        nome: 'Universidade Estadual Paulista',
        cidade: 'Várias',
        estado: 'SP',
        tipo: 'Estadual',
        urls: [
            'https://www.vunesp.com.br/',
            'https://www.vunesp.com.br/VEST2026/'
        ],
        processoSeletivo: 'VUNESP',
        temSeriado: true,
        nomeSeriado: 'Vestibular Seriado Unesp',
        selectores: {
            container: '.noticia, .item, .conteudo-lista li',
            titulo: 'h3, .titulo, a',
            data: '.data, .publicacao',
            link: 'a[href*="edital"], a[href*="vest"]',
            descricao: '.resumo, p'
        }
    },

    // RIO DE JANEIRO - Federais
    {
        sigla: 'UFRJ',
        nome: 'Universidade Federal do Rio de Janeiro',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        tipo: 'Federal',
        urls: [
            'https://www.ufrj.br/ingresso/',
            'https://ingresso.ufrj.br/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.noticia, .item',
            titulo: 'h2, h3',
            data: '.data',
            link: 'a[href*="edital"]',
            descricao: '.resumo'
        }
    },
    {
        sigla: 'UFF',
        nome: 'Universidade Federal Fluminense',
        cidade: 'Niterói',
        estado: 'RJ',
        tipo: 'Federal',
        urls: [
            'https://www.uff.br/ingresso',
            'https://www.uff.br/ingresso/vestibular'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.view-content .views-row',
            titulo: '.views-field-title',
            data: '.views-field-created',
            link: 'a[href*="edital"]',
            descricao: '.views-field-body'
        }
    },
    {
        sigla: 'UNIRIO',
        nome: 'Universidade Federal do Estado do Rio de Janeiro',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        tipo: 'Federal',
        urls: [
            'https://www.unirio.br/ingresso',
            'https://www.unirio.br/graduacao/ingresso'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.view-content .views-row',
            titulo: '.views-field-title',
            data: '.views-field-created',
            link: 'a[href*="edital"]',
            descricao: '.views-field-body'
        }
    },
    {
        sigla: 'UFRRJ',
        nome: 'Universidade Federal Rural do Rio de Janeiro',
        cidade: 'Seropédica',
        estado: 'RJ',
        tipo: 'Federal',
        urls: [
            'https://www.ufrrj.br/ingresso/',
            'https://www.ufrrj.br/ingresso/vestibular/'
        ],
        processoSeletivo: 'SISU/ENEM',
        temSeriado: false,
        selectores: {
            container: '.item-page, .blog',
            titulo: '.page-header',
            data: '.article-info',
            link: 'a[href*="edital"]',
            descricao: 'p'
        }
    }
];

// Função auxiliar para obter universidades por estado
function getUniversidadesPorEstado(estado) {
    return UNIVERSIDADES.filter(u => u.estado === estado);
}

// Função auxiliar para obter universidades com seriado
function getUniversidadesSeriado() {
    return UNIVERSIDADES.filter(u => u.temSeriado);
}

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UNIVERSIDADES, getUniversidadesPorEstado, getUniversidadesSeriado };
}
