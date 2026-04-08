const UNIVERSIDADES = [
    {
        sigla: 'UFMG',
        nome: 'Univ. Federal de Minas Gerais',
        estado: 'MG',
        cidade: 'Belo Horizonte',
        urls: ['https://www.ufmg.br/ingresso'],
        selectores: {
            container: '.views-row, .noticia-ingresso, article',
            titulo: 'h2, h3, .title',
            link: 'a'
        }
    },
    // Repita para as outras 17 universidades mantendo o padrão de URL de ingresso
];
