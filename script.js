document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const inputs = {
        valorVeiculo: document.getElementById('valor-veiculo'),
        parcelaDesejada: document.getElementById('parcela-desejada'),
        valorEntrada: document.getElementById('valor-entrada'),
        sliderEntrada: document.getElementById('slider-entrada'),
        valorUsado: document.getElementById('valor-usado'),
        taxaJuros: document.getElementById('taxa-juros'),
        prazo: document.getElementById('prazo'),
        taxaDocumentacao: document.getElementById('taxa-documentacao'),
        valorSeguro: document.getElementById('valor-seguro'),
        dataPrimeira: document.getElementById('data-primeira'),
        whatsappNumero: document.getElementById('whatsapp-numero')
    };

    const buttons = {
        modoVeiculo: document.getElementById('btn-modo-veiculo'),
        modoParcela: document.getElementById('btn-modo-parcela'),
        addEntrada: document.getElementById('btn-add-entrada'),
        addPrazo: document.getElementById('btn-add-prazo'),
        toggleExtras: document.getElementById('btn-toggle-extras'),
        whatsapp: document.getElementById('btn-whatsapp')
    };

    const displays = {
        resParcela: document.getElementById('res-parcela'),
        resFinanciado: document.getElementById('res-financiado'),
        resTotalPago: document.getElementById('res-total-pago'),
        resTotalJuros: document.getElementById('res-total-juros'),
        resVeiculoSugerido: document.getElementById('res-veiculo-sugerido'),
        resContainerParcela: document.getElementById('res-container-parcela'),
        resContainerVeiculoSugerido: document.getElementById('res-container-veiculo-sugerido'),
        feedback: document.getElementById('feedback-dinamico'),
        comparisonGrid: document.getElementById('comparison-grid'),
        extrasContainer: document.getElementById('extras-container'),
        groupVeiculo: document.getElementById('group-valor-veiculo'),
        groupParcela: document.getElementById('group-valor-parcela-desejada')
    };

    let currentMode = 'veiculo'; // 'veiculo' ou 'parcela'

    // Inicialização
    init();

    function init() {
        loadFromLocalStorage();
        setupEventListeners();
        updateSimulation();
    }

    function setupEventListeners() {
        // Inputs change
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', () => {
                if (input === inputs.sliderEntrada) {
                    const valorVeiculo = parseFloat(inputs.valorVeiculo.value) || 0;
                    inputs.valorEntrada.value = Math.round((valorVeiculo * inputs.sliderEntrada.value) / 100);
                }
                updateSimulation();
                saveToLocalStorage();
            });
        });

        // Botões de modo
        buttons.modoVeiculo.addEventListener('click', () => setMode('veiculo'));
        buttons.modoParcela.addEventListener('click', () => setMode('parcela'));

        // Botões rápidos
        buttons.addEntrada.addEventListener('click', () => {
            inputs.valorEntrada.value = (parseFloat(inputs.valorEntrada.value) || 0) + 2000;
            updateSimulation();
        });

        buttons.addPrazo.addEventListener('click', () => {
            let currentPrazo = parseInt(inputs.prazo.value);
            if (currentPrazo < 60) {
                inputs.prazo.value = currentPrazo + 12;
                updateSimulation();
            }
        });

        buttons.toggleExtras.addEventListener('click', () => {
            const isHidden = displays.extrasContainer.style.display === 'none';
            displays.extrasContainer.style.display = isHidden ? 'block' : 'none';
        });

        buttons.whatsapp.addEventListener('click', sendWhatsAppProposal);
    }

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'veiculo') {
            buttons.modoVeiculo.classList.add('active');
            buttons.modoParcela.classList.remove('active');
            displays.groupVeiculo.style.display = 'block';
            displays.groupParcela.style.display = 'none';
            displays.resContainerParcela.style.display = 'block';
            displays.resContainerVeiculoSugerido.style.display = 'none';
        } else {
            buttons.modoVeiculo.classList.remove('active');
            buttons.modoParcela.classList.add('active');
            displays.groupVeiculo.style.display = 'none';
            displays.groupParcela.style.display = 'block';
            displays.resContainerParcela.style.display = 'block'; // Mantém parcela visível
            displays.resContainerVeiculoSugerido.style.display = 'block';
        }
        updateSimulation();
    }

    function calculatePrice(pv, i, n) {
        if (i === 0) return pv / n;
        const monthlyRate = i / 100;
        return pv * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }

    function updateSimulation() {
        const valorVeiculo = parseFloat(inputs.valorVeiculo.value) || 0;
        const valorEntrada = parseFloat(inputs.valorEntrada.value) || 0;
        const valorUsado = parseFloat(inputs.valorUsado.value) || 0;
        const taxaJuros = parseFloat(inputs.taxaJuros.value) || 0;
        const prazo = parseInt(inputs.prazo.value) || 36;
        const taxaDoc = parseFloat(inputs.taxaDocumentacao.value) || 0;
        const valorSeguro = parseFloat(inputs.valorSeguro.value) || 0;

        let pv = 0;
        let pmt = 0;

        if (currentMode === 'veiculo') {
            pv = valorVeiculo - valorEntrada - valorUsado + taxaDoc + valorSeguro;
            if (pv < 0) pv = 0;
            pmt = calculatePrice(pv, taxaJuros, prazo);
        } else {
            // Modo Parcela: Ajustar valor do veículo baseado na parcela desejada
            const pmtDesejada = parseFloat(inputs.parcelaDesejada.value) || 0;
            const monthlyRate = taxaJuros / 100;
            
            if (monthlyRate > 0) {
                pv = pmtDesejada * (Math.pow(1 + monthlyRate, prazo) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, prazo));
            } else {
                pv = pmtDesejada * prazo;
            }
            
            // O valor sugerido do veículo seria PV + Entrada + Usado - Taxas
            const valorSugerido = pv + valorEntrada + valorUsado - taxaDoc - valorSeguro;
            displays.resVeiculoSugerido.textContent = formatCurrency(valorSugerido);
            pmt = pmtDesejada;
        }

        const totalPago = (pmt * prazo) + valorEntrada + valorUsado;
        const totalJuros = (pmt * prazo) - pv;

        // Atualizar Displays
        displays.resParcela.textContent = formatCurrency(pmt);
        displays.resFinanciado.textContent = formatCurrency(pv);
        displays.resTotalPago.textContent = formatCurrency(totalPago);
        displays.resTotalJuros.textContent = formatCurrency(totalJuros);

        updateFeedback(valorEntrada, pv, taxaJuros, prazo);
        updateComparison(pv, taxaJuros);
    }

    function updateFeedback(entrada, pv, taxa, prazo) {
        const extraEntrada = 2000;
        const pmtAtual = calculatePrice(pv, taxa, prazo);
        const pmtComMaisEntrada = calculatePrice(pv - extraEntrada, taxa, prazo);
        
        const economiaJuros = (pmtAtual * prazo) - (pmtComMaisEntrada * prazo + extraEntrada);
        
        if (pv > extraEntrada) {
            displays.feedback.innerHTML = `💡 Aumentando <strong>R$ 2.000</strong> na entrada, você economiza aproximadamente <strong>${formatCurrency(Math.abs(economiaJuros))}</strong> em juros totais.`;
        } else {
            displays.feedback.innerHTML = "";
        }
    }

    function updateComparison(pv, taxa) {
        const prazos = [12, 24, 36, 48, 60];
        displays.comparisonGrid.innerHTML = '';

        let menorParcela = Infinity;
        let menorCustoTotal = Infinity;
        let resultados = [];

        prazos.forEach(n => {
            const pmt = calculatePrice(pv, taxa, n);
            const totalJuros = (pmt * n) - pv;
            const totalPago = pmt * n;

            if (pmt < menorParcela) menorParcela = pmt;
            if (totalJuros < menorCustoTotal) menorCustoTotal = totalJuros;

            resultados.push({ n, pmt, totalJuros, totalPago });
        });

        resultados.forEach(res => {
            const card = document.createElement('div');
            card.className = 'comparison-card';
            
            let badges = '';
            if (res.pmt === menorParcela) badges += '<span class="badge badge-parcela">Menor Parcela</span>';
            if (res.totalJuros === menorCustoTotal) badges += '<span class="badge badge-juros">Menor Juros</span>';

            card.innerHTML = `
                <div class="comp-header">
                    <span class="comp-prazo">${res.n}x</span>
                    ${badges}
                </div>
                <div class="comp-body">
                    <div class="comp-item">
                        <span class="label">Parcela</span>
                        <span class="value">${formatCurrency(res.pmt)}</span>
                    </div>
                    <div class="comp-item">
                        <span class="label">Total Juros</span>
                        <span class="value">${formatCurrency(res.totalJuros)}</span>
                    </div>
                    <div class="comp-item">
                        <span class="label">Total Pago</span>
                        <span class="value">${formatCurrency(res.totalPago)}</span>
                    </div>
                </div>
            `;
            displays.comparisonGrid.appendChild(card);
        });
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function saveToLocalStorage() {
        const data = {};
        Object.keys(inputs).forEach(key => {
            data[key] = inputs[key].value;
        });
        data.currentMode = currentMode;
        localStorage.setItem('simulador_data', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
        const saved = localStorage.getItem('simulador_data');
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(key => {
                if (inputs[key]) inputs[key].value = data[key];
            });
            if (data.currentMode) setMode(data.currentMode);
        }
    }

    function sendWhatsAppProposal() {
        const numero = inputs.whatsappNumero.value.replace(/\D/g, '');
        if (!numero) {
            alert('Por favor, insira o número do WhatsApp do cliente.');
            return;
        }

        const valorVeiculo = formatCurrency(inputs.valorVeiculo.value);
        const entrada = formatCurrency(inputs.valorEntrada.value);
        const prazo = inputs.prazo.value;
        const parcela = displays.resParcela.textContent;
        const totalPago = displays.resTotalPago.textContent;

        const mensagem = `*Proposta de Financiamento - Bragança Veículos*\n\n` +
            `🚗 *Veículo:* ${valorVeiculo}\n` +
            `💰 *Entrada:* ${entrada}\n` +
            `📅 *Plano:* ${prazo}x de ${parcela}\n` +
            `📈 *Total Pago:* ${totalPago}\n\n` +
            `Simulação realizada para fins informativos. Sujeito a análise de crédito.\n\n` +
            `📍 Av. José Gomes da Rocha Leal, 1267 - Centro\n` +
            `📞 (11) 2473-0601`;

        const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    }
});
