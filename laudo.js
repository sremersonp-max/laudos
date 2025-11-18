// --- Configurações Globais ---
let measurementPhotoCounter = 1;
let currentPage = 1;
const totalPages = 16;
const LAUDOS_KEY = 'laudos_nr13';

// --- Inicialização Unificada ---
document.addEventListener('DOMContentLoaded', function() {
    // 1. Configurar Datas
    const today = new Date().toISOString().split('T')[0];
    const elmDate = document.getElementById('currentDate');
    if(elmDate) elmDate.textContent = formatDate(today);
    
    setValIfEmpty('dataInicio', today);
    setValIfEmpty('dataFim', today);
    setValIfEmpty('dataLaudo', today);
    
    // Configurar próxima inspeção (5 anos)
    const nextInspection = new Date();
    nextInspection.setFullYear(nextInspection.getFullYear() + 5);
    setValIfEmpty('proximaInspecao', nextInspection.toISOString().split('T')[0]);

    // 2. Configurar Event Listeners
    setupEventListeners();
    setupCheckboxGroups();
    setupSaveButtons(); // Adiciona botões Salvar/Cancelar

    // 3. Verificar Modo (Novo ou Edição)
    const urlParams = new URLSearchParams(window.location.search);
    const isVisualizacao = urlParams.get('modo') === 'visualizacao';
    
    const laudoEmEdicao = JSON.parse(localStorage.getItem('laudo_em_edicao') || 'null');
    if (laudoEmEdicao) {
        preencherLaudoComDados(laudoEmEdicao);
    }

    if (isVisualizacao) {
        bloquearEdicao();
    }

    // 4. Mostrar Primeira Página (Fundamental para não ficar tela branca)
    showPage(1);
    updateTagHeaders();
});

function setValIfEmpty(id, val) {
    const el = document.getElementById(id);
    if(el && !el.value) el.value = val;
}

// --- Navegação ---
function setupEventListeners() {
    // Botões de Navegação
    document.getElementById('prevBtn').addEventListener('click', () => navigatePages(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigatePages(1));
    
    // PDF
    document.getElementById('pdfButton').addEventListener('click', generatePDF);
    
    // Uploads de Imagem
    setupImageUploadListeners();
    
    // Tabela Dinâmica (Pág 10)
    const addRowBtn = document.querySelector('.add-row-btn');
    if(addRowBtn) addRowBtn.addEventListener('click', addMeasurementRow);
    
    // Atualização de TAG
    document.getElementById('tag').addEventListener('input', updateTagHeaders);
    document.getElementById('tagEquipamento').addEventListener('input', function() {
        document.getElementById('tag').value = this.value;
        updateTagHeaders();
    });

    // Cálculo PMTA
    const pmtaInputs = ['D', 'tc', 'ttl', 'tts', 'sc', 'st', 'el', 'ec', 'pmtaAdotada'];
    pmtaInputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', calculatePMTA);
    });
}

function navigatePages(direction) {
    document.getElementById(`page-${currentPage}`).style.display = 'none';
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    showPage(currentPage);
}

function showPage(pageNum) {
    document.getElementById(`page-${pageNum}`).style.display = 'block';
    document.getElementById('pageIndicator').textContent = `Página ${pageNum} de ${totalPages}`;
    document.getElementById('prevBtn').disabled = (pageNum === 1);
    document.getElementById('nextBtn').disabled = (pageNum === totalPages);
    updateTagHeaders();
    window.scrollTo(0, 0);
}

function updateTagHeaders() {
    const tag = document.getElementById('tag').value || '[TAG]';
    for (let i = 2; i <= 16; i++) {
        const header = document.getElementById(`tagHeader${i}`);
        if (header) header.textContent = tag;
    }
}

// --- Imagens ---
function setupImageUploadListeners() {
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function(event) {
            // Pega o ID da imagem removendo prefixos
            let imgId = this.id.replace('file_gallery_', '').replace('file_camera_', '');
            handleImageUpload(event, imgId);
        });
    });
}

function handleImageUpload(event, imgId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        const imgElement = document.getElementById(imgId);
        reader.onload = function(e) {
            if(imgElement) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
                const uploader = imgElement.closest('.image-uploader');
                const placeholder = uploader ? uploader.querySelector('.placeholder-text') : null;
                if (placeholder) placeholder.style.display = 'none';
            }
        }
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset para permitir re-upload
    }
}

// --- Tabela Dinâmica ---
function addMeasurementRow() {
    measurementPhotoCounter++;
    const tableBody = document.getElementById('measurementTableBody');
    const newRow = tableBody.insertRow();
    
    const newImgId = `medPhoto${measurementPhotoCounter}`;
    
    newRow.innerHTML = `
        <td><input type="text" placeholder="Ponto..."></td>
        <td><input type="number" step="0.1" placeholder="0.0"></td>
        <td>
            <div class="image-uploader" style="min-height: 50px; margin:0; padding: 5px;">
                <img id="${newImgId}" class="image-preview" alt="Foto" style="max-height: 50px; display:none;">
                <span class="placeholder-text" style="font-size: 9pt;">
                    <label for="file_gallery_${newImgId}" class="upload-btn-small">Abrir</label>
                    <label for="file_camera_${newImgId}" class="upload-btn-small camera-btn">📷</label>
                </span>
                <input type="file" accept="image/*" id="file_gallery_${newImgId}" class="hidden-input">
                <input type="file" accept="image/*;capture=camera" id="file_camera_${newImgId}" class="hidden-input">
            </div>
        </td>
        <td class="center"><button type="button" class="remove-row-btn">Remover</button></td>
    `;

    // Re-atachar listeners para a nova linha
    newRow.querySelector('.remove-row-btn').addEventListener('click', function() {
        this.closest('tr').remove();
    });
    
    newRow.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function(e) {
            handleImageUpload(e, newImgId);
        });
    });
}

// --- Funções Auxiliares ---
function formatDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function setupCheckboxGroups() {
    ['tipoInspecao', 'resultado', 'superficie'].forEach(groupName => {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        checkboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if(this.checked) {
                    checkboxes.forEach(other => { if(other !== this) other.checked = false; });
                }
            });
        });
    });
}

// --- Cálculo PMTA ---
function calculatePMTA() {
    const val = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    const D = val('D'), Tc = val('tc'), Ttl = val('ttl'), Tts = val('tts');
    const Sc = val('sc'), St = val('st'), El = val('el'), Ec = val('ec');
    const pmtaAdotada = val('pmtaAdotada');

    if (!D || !Tc) return; // Mínimo necessário

    // Cálculos Intermediários
    const L = 0.9045 * D;
    const r = 0.1727 * D;
    const M = 0.25 * (3 + Math.sqrt(L / r));

    // Equações
    const P1 = ((D/2) - 0.4*Tc) !== 0 ? (2 * Sc * Tc * El) / ((D/2) - 0.4*Tc) : 0;
    const P2 = ((D/2) + 0.6*Tc) !== 0 ? (Sc * Tc * Ec) / ((D/2) + 0.6*Tc) : 0;
    const P3 = (M*L + 0.2*Tc) !== 0 ? (2 * St * Ttl * Ec) / (M*L + 0.2*Tc) : 0;
    const P4 = (M*L + 0.2*Tc) !== 0 ? (2 * St * Tts * Ec) / (M*L + 0.2*Tc) : 0;

    const pmtaCalc = Math.min(P2, P3, P4);
    const Pth = pmtaAdotada * 1.5;

    // Outputs
    const setTxt = (id, v) => { document.getElementById(id).innerText = v > 0 ? v.toFixed(2) : '-'; };
    
    setTxt('outP1', P1); setTxt('outP2', P2); setTxt('outP3', P3); setTxt('outP4', P4);
    setTxt('outPth', Pth);
    
    setTxt('outL', L); setTxt('outR', r); 
    document.getElementById('outM').innerText = M > 0 ? M.toFixed(4) : '-';

    setTxt('outPmtaCalc', pmtaCalc);
    setTxt('outPmtaCalcMPa', pmtaCalc * 0.0980665);
    setTxt('outPmtaCalcPSI', pmtaCalc * 14.2233);

    if (pmtaAdotada > 0) {
        document.getElementById('pmtaFinalResultado').value = pmtaAdotada.toFixed(2) + " Kgf/cm²";
        document.getElementById('parecerConclusivo').textContent = `Através dos resultados obtidos inspeção de espessura de chapa em obediência à NR-13 e atendendo os requisitos apontados neste laudo, o equipamento estará liberado para funcionamento normal, dentro dos limites estabelecidos pela PMTA. O valor da PMTA calculado pelo presente documento foi de ${pmtaAdotada.toFixed(2)} kgf/cm².`;
    }
    
    if (window.MathJax) MathJax.typeset();
}

// --- Geração de PDF ---
function generatePDF() {
    const navBtns = document.querySelector('.nav-buttons');
    const pageInd = document.querySelector('.page-indicator');
    const pdfBtn = document.getElementById('pdfButton');
    
    // Ocultar controles
    navBtns.style.display = 'none';
    pageInd.style.display = 'none';
    pdfBtn.style.display = 'none';
    
    // Mostrar todas as páginas
    for (let i = 1; i <= totalPages; i++) {
        const page = document.getElementById(`page-${i}`);
        page.style.display = 'block';
        page.style.margin = '0';
    }
    
    setTimeout(() => {
        window.print();
        // Restaurar
        setTimeout(() => {
            navBtns.style.display = 'flex';
            pageInd.style.display = 'block';
            pdfBtn.style.display = 'block';
            // Esconder páginas extras
            for (let i = 1; i <= totalPages; i++) {
                document.getElementById(`page-${i}`).style.display = (i === currentPage) ? 'block' : 'none';
            }
        }, 500);
    }, 300);
}

// --- Sistema de Save/Load ---

function setupSaveButtons() {
    const navButtons = document.querySelector('.nav-buttons');
    if (!document.getElementById('saveBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'nav-btn';
        saveBtn.id = 'saveBtn';
        saveBtn.textContent = 'Salvar';
        saveBtn.style.backgroundColor = '#28a745';
        saveBtn.onclick = salvarLaudo;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'nav-btn';
        cancelBtn.id = 'cancelBtn';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.backgroundColor = '#6c757d';
        cancelBtn.onclick = cancelarEdicao;
        
        navButtons.appendChild(cancelBtn);
        navButtons.appendChild(saveBtn);
    }
}

function coletarDadosLaudo() {
    // Helper para pegar valor
    const getVal = (sel) => { const el = document.querySelector(sel); return el ? el.value : ''; };
    
    return {
        tag: document.getElementById('tag').value,
        numeroLaudo: document.getElementById('numeroLaudo').value,
        numeroART: document.getElementById('numeroART').value,
        dataInicio: document.getElementById('dataInicio').value,
        dataFim: document.getElementById('dataFim').value,
        dataLaudo: document.getElementById('dataLaudo').value,
        
        tipoInspecao: Array.from(document.querySelectorAll('input[name="tipoInspecao"]:checked')).map(cb => cb.value),
        
        empresaContratante: {
            nomeFantasia: getVal('input[placeholder="Nome Fantasia"]'),
            razaoSocial: getVal('input[placeholder="Razão Social"]'),
            cnpj: getVal('input[placeholder="CNPJ"]'),
            cidade: getVal('input[placeholder="Cidade"]'),
            cep: getVal('input[placeholder="CEP"]'),
            email: getVal('input[placeholder="E-mail"]'),
            endereco: getVal('input[placeholder="Endereço Completo"]'),
            telefone: getVal('input[placeholder="Telefone"]')
        },
        equipamento: {
            tag: document.getElementById('tagEquipamento').value,
            categoria: getVal('input[placeholder="Categoria"]'),
            numeroSerie: getVal('input[placeholder="Número de Série"]'),
            pmtaFabricante: getVal('input[placeholder="PMTA do Fabricante"]'),
            modelo: getVal('input[placeholder="Modelo"]'),
            pressaoTeste: getVal('input[placeholder="Pressão de Teste"]'),
            fabricante: getVal('input[placeholder="Fabricante"]'),
            fluidoServico: getVal('input[placeholder="Fluido de Serviço"]'),
            anoFabricacao: getVal('input[placeholder="Ano de Fabricação"]'),
            volume: getVal('input[placeholder="Volume"]'),
            temperaturaMaxima: getVal('input[placeholder="Temperatura Máxima"]'),
            setor: getVal('input[placeholder="Setor"]'),
            codigoConstrucao: getVal('input[placeholder="Código de Construção"]'),
            tipoVaso: getVal('input[placeholder="Tipo de Vaso"]')
        },
        parametrosCalculo: {
            D: document.getElementById('D').value,
            tc: document.getElementById('tc').value,
            ttl: document.getElementById('ttl').value,
            tts: document.getElementById('tts').value,
            sc: document.getElementById('sc').value,
            st: document.getElementById('st').value,
            el: document.getElementById('el').value,
            ec: document.getElementById('ec').value
        },
        pmtaAdotada: document.getElementById('pmtaAdotada').value,
        pmtaFinalResultado: document.getElementById('pmtaFinalResultado').value,
        proximaInspecao: document.getElementById('proximaInspecao').value,
        
        // Coletar imagens principais (Base64)
        imagens: {
            imgPage1: document.getElementById('imgPage1').src,
            imgPlaca: document.getElementById('imgPlaca').src,
            imgValvula: document.getElementById('imgValvula').src,
            imgManometro: document.getElementById('imgManometro').src,
            imgReg1: document.getElementById('imgReg1')?.src,
            imgReg2: document.getElementById('imgReg2')?.src,
            imgReg3: document.getElementById('imgReg3')?.src,
            imgReg4: document.getElementById('imgReg4')?.src,
            imgReg5: document.getElementById('imgReg5')?.src,
            imgReg6: document.getElementById('imgReg6')?.src,
            imgCalcFoto: document.getElementById('imgCalcFoto')?.src,
            imgDiagramaCorpo: document.getElementById('imgDiagramaCorpo')?.src,
            imgDiagramaEsq: document.getElementById('imgDiagramaEsq')?.src,
            imgDiagramaDir: document.getElementById('imgDiagramaDir')?.src
        },
        dataSalvamento: new Date().toISOString()
    };
}

function preencherLaudoComDados(dados) {
    if (!dados) return;
    
    // Preencher campos básicos
    const setVal = (id, val) => { const el = document.getElementById(id); if(el && val) el.value = val; };
    const setPh = (ph, val) => { const el = document.querySelector(`input[placeholder="${ph}"]`); if(el && val) el.value = val; };
    
    setVal('tag', dados.tag);
    setVal('numeroLaudo', dados.numeroLaudo);
    setVal('numeroART', dados.numeroART);
    setVal('dataInicio', dados.dataInicio);
    setVal('dataFim', dados.dataFim);
    setVal('dataLaudo', dados.dataLaudo);
    setVal('pmtaAdotada', dados.pmtaAdotada);
    setVal('pmtaFinalResultado', dados.pmtaFinalResultado);
    setVal('proximaInspecao', dados.proximaInspecao);

    // Checkboxes
    if (dados.tipoInspecao) {
        document.querySelectorAll('input[name="tipoInspecao"]').forEach(cb => {
            cb.checked = dados.tipoInspecao.includes(cb.value);
        });
    }

    // Objetos aninhados
    if(dados.empresaContratante) {
        const e = dados.empresaContratante;
        setPh("Nome Fantasia", e.nomeFantasia); setPh("Razão Social", e.razaoSocial);
        setPh("CNPJ", e.cnpj); setPh("Cidade", e.cidade); setPh("CEP", e.cep);
        setPh("E-mail", e.email); setPh("Endereço Completo", e.endereco); setPh("Telefone", e.telefone);
    }
    
    if(dados.equipamento) {
        const q = dados.equipamento;
        setVal('tagEquipamento', q.tag);
        setPh("Categoria", q.categoria); setPh("Número de Série", q.numeroSerie);
        setPh("PMTA do Fabricante", q.pmtaFabricante); setPh("Modelo", q.modelo);
        setPh("Pressão de Teste", q.pressaoTeste); setPh("Fabricante", q.fabricante);
        setPh("Fluido de Serviço", q.fluidoServico); setPh("Ano de Fabricação", q.anoFabricacao);
        setPh("Volume", q.volume); setPh("Temperatura Máxima", q.temperaturaMaxima);
        setPh("Setor", q.setor); setPh("Código de Construção", q.codigoConstrucao);
        setPh("Tipo de Vaso", q.tipoVaso);
    }

    if(dados.parametrosCalculo) {
        const p = dados.parametrosCalculo;
        setVal('D', p.D); setVal('tc', p.tc); setVal('ttl', p.ttl); setVal('tts', p.tts);
        setVal('sc', p.sc); setVal('st', p.st); setVal('el', p.el); setVal('ec', p.ec);
    }

    // Imagens
    if(dados.imagens) {
        Object.keys(dados.imagens).forEach(id => {
            const el = document.getElementById(id);
            const src = dados.imagens[id];
            if(el && src && src.startsWith('data:')) {
                el.src = src;
                el.style.display = 'block';
                const uploader = el.closest('.image-uploader');
                if(uploader) {
                   const ph = uploader.querySelector('.placeholder-text');
                   if(ph) ph.style.display = 'none';
                }
            }
        });
    }

    calculatePMTA();
    updateTagHeaders();
}

function salvarLaudo() {
    const dados = coletarDadosLaudo();
    if (!dados.tag) {
        alert('Por favor, preencha a TAG do equipamento (Página 1) antes de salvar.');
        return;
    }
    
    const laudos = JSON.parse(localStorage.getItem(LAUDOS_KEY) || '[]');
    const laudoEmEdicao = JSON.parse(localStorage.getItem('laudo_em_edicao') || 'null');
    
    if (laudoEmEdicao && laudoEmEdicao.index !== undefined) {
        laudos[laudoEmEdicao.index] = dados; // Atualizar
    } else {
        laudos.push(dados); // Novo
    }
    
    localStorage.setItem(LAUDOS_KEY, JSON.stringify(laudos));
    localStorage.removeItem('laudo_em_edicao');
    
    alert('Laudo salvo com sucesso!');
    window.location.href = 'index.html';
}

function cancelarEdicao() {
    if (confirm('Tem certeza? Dados não salvos serão perdidos.')) {
        localStorage.removeItem('laudo_em_edicao');
        window.location.href = 'index.html';
    }
}

function bloquearEdicao() {
    document.querySelectorAll('.nav-buttons, #pdfButton, .upload-btn, .add-row-btn, .remove-row-btn').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input, textarea, select').forEach(el => el.readOnly = true);
    document.querySelectorAll('input[type="checkbox"]').forEach(el => el.disabled = true);
}