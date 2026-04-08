/**
 * CEFS VESTIBULAR MONITOR - Sistema de Dados
 * Versão: 100% Dinâmica (Sem dados estáticos)
 */

// Deixamos a lista vazia para forçar a busca real
const EDITAIS_BASE = [];

class DataManager {
    constructor() {
        this.dados = [];
    }

    getDados(filtros = {}) {
        return this.dados;
    }

    getUltimaAtualizacao() {
        return new Date().toLocaleString('pt-BR');
    }
}

const dataManager = new DataManager();
