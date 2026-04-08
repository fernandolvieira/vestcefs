/**
 * Parser inteligente de editais de vestibular
 * Extrai informações estruturadas de texto HTML
 */

class EditalParser {
    constructor() {
        this.patterns = {
            // Datas
            dataProva: [
                /prova[s]?\s*(?:ser[aá]|em|dia)?\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
                /data\s*(?:da|das)?\s*prova[s]?\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
                /1[ªoa]?\s*fase\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
                /2[ªoa]?\s*fase\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
                /aplica[çc][aã]o\s*(?:da\s*)?prova\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i
            ],
            inscricao: [
                /inscri[çc][õo]es?\s*(?:de|no\s*per[íi]odo)?\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\s*(?:a|at[ée])\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
                /per[íi]odo\s*de\s*inscri[çc][aã]o\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\s*a\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i,
                /inscri[çc][aã]o\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i
            ],
            // Valores
            taxaInscricao: [
                /taxa\s*de\s*inscri[çc][aã]o\s*:?\s*R?\$?\s*(\d+[,.]?\d*)/i,
                /valor\s*da\s*inscri[çc][aã]o\s*:?\s*R?\$?\s*(\d+[,.]?\d*)/i,
                /inscri[çc][aã]o\s*:?\s*R?\$\s*(\d+[,.]?\d*)/i
            ],
            // Documentação
            documentacao: [
                /documenta[çc][aã]o\s*necess[áa]ria\s*:?([^]+?)(?=\n\s*\n|documento|\d+\.|$)/i,
                /documentos?\s*exigidos?\s*:?([^]+?)(?=\n\s*\n|\d+\.|$)/i
            ],
            // Público alvo
            publicoAlvo: [
                /p[úu]blico.?\s*alvo\s*:?([^]+?)(?=\n\s*\n|requisitos|crit[ée]rios|$)/i,
                /destinado\s*a\s*:?([^]+?)(?=\n\s*\n|requisitos|$)/i,
                /candidatos?\s*(?:devem|dever[aã]o|podem)\s*:?([^]+?)(?=\n\s*\n|requisitos|$)/i
            ],
            // Vagas
            vagas: [
                /(\d+)\s*vagas?\s*(?:para)?\s*([^\n,]+)/gi,
                /total\s*de\s*(\d+)\s*vagas?/i
            ]
        };
    }

    /**
     * Extrai todas as informações de um texto de edital
     */
    parse(texto, url, universidade) {
        const info = {
            titulo: this.extrairTitulo(texto),
            tipo: this.classificarTipo(texto, universidade),
            dataProva: this.extrairDataProva(texto),
            inscricao: this.extrairPeriodoInscricao(texto),
            taxa: this.extrairTaxa(texto),
            documentacao: this.extrairDocumentacao(texto),
            publicoAlvo: this.extrairPublicoAlvo(texto, universidade),
            vagas: this.extrairVagas(texto),
            link: url,
            detectadoEm: new Date().toISOString()
        };

        return info;
    }

    /**
     * Classifica o tipo de processo seletivo
     */
    classificarTipo(texto, universidade) {
        const txt = texto.toLowerCase();
        
        // Vestibular Seriado
        if (universidade.temSeriado || 
            /seriado|pas\s*\d|psv|1[ºo]\s*ano|2[ºo]\s*ano|3[ºo]\s*ano|ensino\s*m[ée]dio\s*-\s*\d/.test(txt)) {
            return {
                tipo: 'VESTIBULAR_SERIADO',
                label: 'Vestibular Seriado',
                descricao: universidade.nomeSeriado || 'Processo Seletivo Seriado',
                icon: 'fa-layer-group',
                color: 'seriado'
            };
        }
        
        // SISU/ENEM
        if (/sisu|enem|nota\s*do\s*enem|sistema\s*de\s*sele[çc][aã]o\s*unificada/.test(txt)) {
            return {
                tipo: 'SISU/ENEM',
                label: 'SISU/ENEM',
                descricao: 'Seleção via nota do ENEM',
                icon: 'fa-file-alt',
                color: 'sisu'
            };
        }
        
        // Vestibular Convencional
        if (/vestibular|fuvest|comvest|vunesp|concurso\s*vestibular|1[ªa]\s*fase|2[ªa]\s*fase/.test(txt)) {
            return {
                tipo: 'VESTIBULAR_CONVENCIONAL',
                label: 'Vestibular Convencional',
                descricao: 'Prova tradicional de ingresso',
                icon: 'fa-edit',
                color: 'convencional'
            };
        }
        
        return {
            tipo: 'OUTRO',
            label: 'Outro',
            descricao: 'Processo seletivo',
            icon: 'fa-question-circle',
            color: 'default'
        };
    }

    /**
     * Extrai título do edital
     */
    extrairTitulo(texto) {
        // Limpar e pegar primeira linha significativa
        const linhas = texto.split('\n').filter(l => l.trim().length > 10);
        return linhas[0]?.trim() || 'Edital de Vestibular';
    }

    /**
     * Extrai data da prova
     */
    extrairDataProva(texto) {
        for (const pattern of this.patterns.dataProva) {
            const match = texto.match(pattern);
            if (match) {
                return this.normalizarData(match[1]);
            }
        }
        return null;
    }

    /**
     * Extrai período de inscrição
     */
    extrairPeriodoInscricao(texto) {
        for (const pattern of this.patterns.inscricao) {
            const match = texto.match(pattern);
            if (match) {
                if (match[2]) {
                    return {
                        inicio: this.normalizarData(match[1]),
                        fim: this.normalizarData(match[2]),
                        status: this.calcularStatusInscricao(match[1], match[2])
                    };
                } else {
                    return {
                        fim: this.normalizarData(match[1]),
                        status: 'verificar'
                    };
                }
            }
        }
        return null;
    }

    /**
     * Extrai taxa de inscrição
     */
    extrairTaxa(texto) {
        for (const pattern of this.patterns.taxaInscricao) {
            const match = texto.match(pattern);
            if (match) {
                const valor = parseFloat(match[1].replace(',', '.'));
                return `R$ ${valor.toFixed(2)}`;
            }
        }
        return 'Consultar edital';
    }

    /**
     * Extrai documentação necessária
     */
    extrairDocumentacao(texto) {
        const docsComuns = [
            'Documento de identidade (RG ou CNH)',
            'CPF',
            'Certificado de conclusão do Ensino Médio',
            'Histórico Escolar',
            'Foto 3x4 recente',
            'Comprovante de pagamento da taxa de inscrição'
        ];

        // Tentar extrair do texto
        for (const pattern of this.patterns.documentacao) {
            const match = texto.match(pattern);
            if (match && match[1].length > 20) {
                const docs = match[1]
                    .split(/[;\n]/)
                    .map(d => d.trim())
                    .filter(d => d.length > 3 && d.length < 100)
                    .slice(0, 6);
                
                if (docs.length >= 3) return docs;
            }
        }

        return docsComuns;
    }

    /**
     * Extrai público-alvo
     */
    extrairPublicoAlvo(texto, universidade) {
        const txt = texto.toLowerCase();
        
        // Seriado
        if (universidade.temSeriado) {
            if (/1[ºo]\s*ano|primeiro\s*ano/.test(txt)) {
                return 'Estudantes do 1º ano do Ensino Médio';
            } else if (/2[ºo]\s*ano|segundo\s*ano/.test(txt)) {
                return 'Estudantes do 2º ano do Ensino Médio';
            } else if (/3[ºo]\s*ano|terceiro\s*ano/.test(txt)) {
                return 'Estudantes do 3º ano do Ensino Médio';
            }
            return 'Estudantes do Ensino Médio (todas as séries)';
        }
        
        // Extrair do texto
        for (const pattern of this.patterns.publicoAlvo) {
            const match = texto.match(pattern);
            if (match && match[1].length > 10) {
                return match[1].trim().substring(0, 200);
            }
        }

        // Padrão
        if (/segundo\s*grau|ensino\s*m[ée]dio/.test(txt)) {
            return 'Concluintes do Ensino Médio';
        }
        
        return 'Concluintes ou concluídos do Ensino Médio';
    }

    /**
     * Extrai informações sobre vagas
     */
    extrairVagas(texto) {
        const vagas = [];
        
        for (const pattern of this.patterns.vagas) {
            const matches = texto.matchAll(pattern);
            for (const match of matches) {
                if (match[2]) {
                    vagas.push({
                        quantidade: parseInt(match[1]),
                        curso: match[2].trim()
                    });
                } else {
                    vagas.push({
                        quantidade: parseInt(match[1]),
                        curso: 'Geral'
                    });
                }
            }
        }

        return vagas.length > 0 ? vagas : null;
    }

    /**
     * Normaliza formato de data
     */
    normalizarData(dataStr) {
        if (!dataStr) return null;
        
        // Remover caracteres não numéricos exceto /
        let limpa = dataStr.replace(/[^\d\/]/g, '');
        
        // Garantir formato DD/MM/YYYY
        const partes = limpa.split('/');
        if (partes.length === 3) {
            let [d, m, a] = partes;
            if (a.length === 2) a = '20' + a;
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${a}`;
        }
        
        return dataStr;
    }

    /**
     * Calcula status da inscrição
     */
    calcularStatusInscricao(inicio, fim) {
        const hoje = new Date();
        const dataInicio = this.parseData(inicio);
        const dataFim = this.parseData(fim);
        
        if (!dataInicio || !dataFim) return 'verificar';
        
        if (hoje < dataInicio) return 'futura';
        if (hoje > dataFim) return 'encerrada';
        return 'aberta';
    }

    parseData(dataStr) {
        const partes = dataStr.split(/[\/\.\-]/);
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]);
        }
        return null;
    }
}

// Instância global
const parser = new EditalParser();
