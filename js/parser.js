/**
 * Parser inteligente com Trava de Ano 2026
 */
class EditalParser {
    constructor() {
        this.anoAlvo = "2026";
    }

    parse(texto, url, universidade) {
        const txtLowerCase = texto.toLowerCase();
        
        // REGRA DE OURO: Se o texto do edital não cita 2026, ele é ignorado
        if (!texto.includes(this.anoAlvo)) {
            return null; 
        }

        return {
            titulo: this.extrairTitulo(texto),
            tipo: this.classificarTipo(texto, universidade),
            dataProva: this.extrairDataProva(texto),
            inscricao: this.extrairPeriodoInscricao(texto),
            taxa: this.extrairTaxa(texto),
            link: url,
            detectadoEm: new Date().toISOString()
        };
    }

    classificarTipo(texto, universidade) {
        const txt = texto.toLowerCase();
        if (txt.includes('seriado') || txt.includes('pas') || txt.includes('psv')) {
            return { tipo: 'VESTIBULAR_SERIADO', label: 'Seriado', color: 'seriado', icon: 'fa-layer-group' };
        }
        if (txt.includes('sisu') || txt.includes('enem')) {
            return { tipo: 'SISU/ENEM', label: 'SISU/ENEM', color: 'sisu', icon: 'fa-file-alt' };
        }
        return { tipo: 'VESTIBULAR_CONVENCIONAL', label: 'Vestibular', color: 'convencional', icon: 'fa-edit' };
    }

    extrairTitulo(texto) { return texto.split('\n')[0].substring(0, 100).trim(); }
    
    extrairDataProva(texto) {
        const match = texto.match(/(\d{2}\/\d{2}\/2026)/);
        return match ? match[1] : "A definir (2026)";
    }

    extrairPeriodoInscricao(texto) {
        const match = texto.match(/(\d{2}\/\d{2})/g);
        return match ? { fim: match[match.length - 1] + "/2026" } : null;
    }

    extrairTaxa(texto) {
        const match = texto.match(/R\$\s?(\d+[,.]\d{2})/i);
        return match ? match[0] : "Consultar Edital";
    }
}

const parser = new EditalParser();
