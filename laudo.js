// --- Script para Funcionalidades Interativas ---

// Contador global para IDs de fotos de medição
let measurementPhotoCounter = 1;
let currentPage = 1;
const totalPages = 16;

// Inicialização da página
window.onload = function() {
    // Configurar data atual
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('currentDate').textContent = formatDate(today);
    document.getElementById('dataInicio').value = today;
    document.getElementById('dataFim').value = today;
    document.getElementById('dataLaudo').value = today;
    
    // Configurar próxima inspeção (5 anos depois)
    const nextInspection = new Date();
    nextInspection.setFullYear(nextInspection.getFullYear() + 5);
    document.getElementById('proximaInspecao').value = nextInspection.toISOString().split('T')[0];
    
    // Mostrar a primeira página
    document.getElementById('page-1').style.display = 'block';
    updateNavigation();
    updateTagHeaders();
    
    // Configurar título para impressão
    document.title = "Laudo Técnico - Vaso de Pressão";
    
    // Configurar checkboxes para seleção única
    setupCheckboxGroups();
    
    // Configurar event listeners
    setupEventListeners();
};

// Configurar todos os event listeners
function setupEventListeners() {
    // Navegação
    document.getElementById('prevBtn').addEventListener('click', () => navigatePages(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigatePages(1));
    document.getElementById('pdfButton').addEventListener('click', generatePDF);
    
    // Upload de imagens
    setupImageUploadListeners();
    
    // Cálculo PMTA
    setupPMTACalculationListeners();
    
    // Tabela dinâmica
    document.querySelector('.add-row-btn').addEventListener('click', addMeasurementRow);
    
    // Atualização automática de TAG
    document.getElementById('tag').addEventListener('input', updateTagHeaders);
    document.getElementById('tagEquipamento').addEventListener('input', function() {
        document.getElementById('tag').value = this.value;
        updateTagHeaders();
    });
}

// Configurar listeners para upload de imagens
function setupImageUploadListeners() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(event) {
            const imgId = this.id.replace('file_gallery_', '').replace('file_camera_', '');
            handleImageUpload(event, imgId);
        });
    });
}

// Configurar listeners para cálculo PMTA
function setupPMTACalculationListeners() {
    const pmtaInputs = ['D', 'tc', 'ttl', 'tts', 'sc', 'st', 'el', 'ec', 'pmtaAdotada'];
    pmtaInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculatePMTA);
        }
    });
}

// Formatar data para exibição
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Configurar grupos de checkbox para seleção única
function setupCheckboxGroups() {
    // Grupo de tipo de inspeção
    const tipoInspecaoCheckboxes = document.querySelectorAll('input[name="tipoInspecao"]');
    tipoInspecaoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                tipoInspecaoCheckboxes.forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
    
    // Grupo de resultado (aprovado/reprovado)
    const resultadoCheckboxes = document.querySelectorAll('input[name="resultado"]');
    resultadoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                resultadoCheckboxes.forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
}

// Atualizar headers com a TAG
function updateTagHeaders() {
    const tag = document.getElementById('tag').value || '[TAG]';
    for (let i = 2; i <= 16; i++) {
        const header = document.getElementById(`tagHeader${i}`);
        if (header) header.textContent = tag;
    }
}

// 1. Upload de Imagem
function handleImageUpload(event, imgId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        const imgElement = document.getElementById(imgId);
        
        // Encontra os botões/placeholder dentro do uploader específico
        const uploader = document.getElementById(imgId).closest('.image-uploader');
        const placeholder = uploader.querySelector('.placeholder-text');
        
        reader.onload = function(e) {
            imgElement.src = e.target.result;
            imgElement.style.display = 'block';
            if (placeholder) {
                placeholder.style.display = 'none'; // Esconde os botões
            }
        }
        reader.readAsDataURL(file);
        
        // Limpa o input para permitir selecionar a mesma imagem novamente
        event.target.value = '';
    }
}

// 2. Navegação entre páginas
function navigatePages(direction) {
    // Esconde a página atual
    document.getElementById(`page-${currentPage}`).style.display = 'none';
    
    // Atualiza a página atual
    currentPage += direction;
    
    // Garante que fique dentro dos limites
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Mostra a nova página
    document.getElementById(`page-${currentPage}`).style.display = 'block';
    
    // Atualiza a navegação
    updateNavigation();
}

function updateNavigation() {
    // Atualiza o indicador de página
    document.getElementById('pageIndicator').textContent = `Página ${currentPage} de ${totalPages}`;
    
    // Atualiza os botões de navegação
    document.getElementById('prevBtn').disabled = (currentPage === 1);
    document.getElementById('nextBtn').disabled = (currentPage === totalPages);
    
    // Atualiza headers com TAG
    updateTagHeaders();
}

// 3. Tabela de Medição Dinâmica (Página 10)
function addMeasurementRow() {
    measurementPhotoCounter++; // Incrementa o contador para ID único
    const tableBody = document.getElementById('measurementTableBody');
    const newRow = tableBody.insertRow();
    
    const cell1 = newRow.insertCell(0); // Ponto
    const cell2 = newRow.insertCell(1); // Espessura
    const cell3 = newRow.insertCell(2); // Foto da Leitura
    const cell4 = newRow.insertCell(3); // Ação
    
    cell1.innerHTML = '<input type="text" placeholder="Ponto...">';
    cell2.innerHTML = '<input type="number" step="0.1" placeholder="0.0">';
    
    // Adiciona o uploader de imagem com ID único e os dois botões
    const newImgId = `medPhoto${measurementPhotoCounter}`;
    cell3.innerHTML = `
        <div class="image-uploader" style="min-height: 50px; margin:0; padding: 5px;">
            <img id="${newImgId}" class="image-preview" alt="Foto Leitura" style="max-height: 50px;">
            <span class="placeholder-text" style="font-size: 9pt;">
                <label for="file_gallery_${newImgId}" class="upload-btn-small">Arquivo</label>
                <label for="file_camera_${newImgId}" class="upload-btn-small camera-btn">📷</label>
            </span>
            <input type="file" accept="image/*" id="file_gallery_${newImgId}" class="hidden-input">
            <input type="file" accept="image/*;capture=camera" id="file_camera_${newImgId}" class="hidden-input">
        </div>`;
    
    cell4.innerHTML = '<button type="button" class="remove-row-btn">Remover</button>';
    cell4.style.textAlign = 'center';
    
    // Adiciona event listener para o botão remover
    cell4.querySelector('.remove-row-btn').addEventListener('click', function() {
        removeMeasurementRow(this);
    });
    
    // Adiciona event listeners para os novos inputs de arquivo
    const newFileInputs = cell3.querySelectorAll('input[type="file"]');
    newFileInputs.forEach(input => {
        input.addEventListener('change', function(event) {
            handleImageUpload(event, newImgId);
        });
    });
}

function removeMeasurementRow(button) {
    const row = button.closest('tr');
    row.parentNode.removeChild(row);
}

// 4. Cálculo Automático de PMTA
function calculatePMTA() {
    // Pegar valores dos inputs
    const D = parseFloat(document.getElementById('D').value) || 0;
    const Tc = parseFloat(document.getElementById('tc').value) || 0;
    const Ttl = parseFloat(document.getElementById('ttl').value) || 0;
    const Tts = parseFloat(document.getElementById('tts').value) || 0;
    const Sc = parseFloat(document.getElementById('sc').value) || 0;
    const St = parseFloat(document.getElementById('st').value) || 0;
    const El = parseFloat(document.getElementById('el').value) || 0;
    const Ec = parseFloat(document.getElementById('ec').value) || 0;
    const pmtaAdotada = parseFloat(document.getElementById('pmtaAdotada').value) || 0;

    // Checagem de segurança
    if (!D || !Tc || !Ttl || !Tts || !Sc || !St || !El || !Ec) {
        // Se algum campo essencial estiver vazio, não calcula
        return;
    }

    // Fórmulas do Laudo
    const L = 0.9045 * D;
    const r = 0.1727 * D;
    const M = 0.25 * (3 + Math.sqrt(L / r));

    // P1 (Casco Long.)
    const P1_num = 2 * Sc * Tc * El;
    const P1_den = (D / 2) - (0.4 * Tc);
    const P1 = P1_den !== 0 ? (P1_num / P1_den) : 0;
    
    // P2 (Casco Circ.)
    const P2_num = Sc * Tc * Ec;
    const P2_den = (D / 2) + (0.6 * Tc);
    const P2 = P2_den !== 0 ? (P2_num / P2_den) : 0;
    
    // P3 (Tampo Esq.) - Usando T_C no denominador conforme laudo
    const P3_num = 2 * St * Ttl * Ec;
    const P3_den = (M * L) + (0.2 * Tc);
    const P3 = P3_den !== 0 ? (P3_num / P3_den) : 0;
    
    // P4 (Tampo Dir.) - Usando T_C no denominador conforme laudo
    const P4_num = 2 * St * Tts * Ec;
    const P4_den = (M * L) + (0.2 * Tc);
    const P4 = P4_den !== 0 ? (P4_num / P4_den) : 0;
    
    // PMTA Calculada (Menor entre P2, P3, P4 - P1 não é limitante de PMTA)
    const pmtaCalc = Math.min(P2, P3, P4);

    // Teste Hidrostático (baseado na PMTA *Adotada*)
    const Pth = pmtaAdotada * 1.5;

    // Constantes de conversão
    const kgfcm2_to_mpa = 0.0980665;
    const kgfcm2_to_psi = 14.2233;

    // Atualizar campos de saída (Página 13)
    document.getElementById('outP1').innerText = P1 > 0 ? P1.toFixed(2) : '-';
    document.getElementById('outP2').innerText = P2 > 0 ? P2.toFixed(2) : '-';
    document.getElementById('outP3').innerText = P3 > 0 ? P3.toFixed(2) : '-';
    document.getElementById('outP4').innerText = P4 > 0 ? P4.toFixed(2) : '-';
    document.getElementById('outPth').innerText = Pth > 0 ? Pth.toFixed(2) : '-';
    
    // Atualizar campos de saída (Página 14)
    document.getElementById('outPmtaCalc').innerText = pmtaCalc > 0 ? pmtaCalc.toFixed(2) : '-';
    document.getElementById('outPmtaCalcMPa').innerText = pmtaCalc > 0 ? (pmtaCalc * kgfcm2_to_mpa).toFixed(2) : '-';
    document.getElementById('outPmtaCalcPSI').innerText = pmtaCalc > 0 ? (pmtaCalc * kgfcm2_to_psi).toFixed(2) : '-';

    // Atualizar campos finais (Página 16)
    if (pmtaAdotada > 0) {
        document.getElementById('pmtaFinalResultado').value = pmtaAdotada.toFixed(2) + " Kgf/cm²";
        
        const parecer = document.getElementById('parecerConclusivo');
        parecer.textContent = `Através dos resultados obtidos inspeção de espessura de chapa em obediência à NR-13 e atendendo os requisitos apontados neste laudo, o equipamento estará liberado para funcionamento normal, dentro dos limites estabelecidos pela PMTA. O valor da PMTA calculado pelo presente documento foi de ${pmtaAdotada.toFixed(2)} kgf/cm².`;
    }
}

// 5. Função para gerar PDF
// 5. Função para gerar PDF - OTIMIZADA
function generatePDF() {
    // Esconder elementos de navegação antes da impressão
    document.querySelector('.nav-buttons').style.display = 'none';
    document.querySelector('.page-indicator').style.display = 'none';
    document.getElementById('pdfButton').style.display = 'none';
    
    // Mostrar todas as páginas antes de imprimir
    for (let i = 1; i <= totalPages; i++) {
        const page = document.getElementById(`page-${i}`);
        page.style.display = 'block';
        page.style.position = 'relative';
        page.style.margin = '0';
    }
    
    // Aguardar um momento para garantir renderização
    setTimeout(() => {
        window.print();
        
        // Restaurar a visualização normal após a impressão
        setTimeout(() => {
            restorePageView();
        }, 500);
    }, 300);
}// [TODO O CÓDIGO JS EXISTENTE PERMANECE IGUAL ATÉ A FUNÇÃO calculatePMTA]

// 4. Cálculo Automático de PMTA - ATUALIZADA
function calculatePMTA() {
    // Pegar valores dos inputs
    const D = parseFloat(document.getElementById('D').value) || 0;
    const Tc = parseFloat(document.getElementById('tc').value) || 0;
    const Ttl = parseFloat(document.getElementById('ttl').value) || 0;
    const Tts = parseFloat(document.getElementById('tts').value) || 0;
    const Sc = parseFloat(document.getElementById('sc').value) || 0;
    const St = parseFloat(document.getElementById('st').value) || 0;
    const El = parseFloat(document.getElementById('el').value) || 0;
    const Ec = parseFloat(document.getElementById('ec').value) || 0;
    const pmtaAdotada = parseFloat(document.getElementById('pmtaAdotada').value) || 0;

    // Checagem de segurança
    if (!D || !Tc || !Ttl || !Tts || !Sc || !St || !El || !Ec) {
        // Se algum campo essencial estiver vazio, não calcula
        return;
    }

    // CÁLCULOS INTERMEDIÁRIOS - TAMPOS TORISFÉRICOS
    const L = 0.9045 * D;
    const r = 0.1727 * D;
    const M = 0.25 * (3 + Math.sqrt(L / r));

    // Fórmulas do Laudo
    // P1 (Casco Long.)
    const P1_num = 2 * Sc * Tc * El;
    const P1_den = (D / 2) - (0.4 * Tc);
    const P1 = P1_den !== 0 ? (P1_num / P1_den) : 0;
    
    // P2 (Casco Circ.)
    const P2_num = Sc * Tc * Ec;
    const P2_den = (D / 2) + (0.6 * Tc);
    const P2 = P2_den !== 0 ? (P2_num / P2_den) : 0;
    
    // P3 (Tampo Esq.)
    const P3_num = 2 * St * Ttl * Ec;
    const P3_den = (M * L) + (0.2 * Tc);
    const P3 = P3_den !== 0 ? (P3_num / P3_den) : 0;
    
    // P4 (Tampo Dir.)
    const P4_num = 2 * St * Tts * Ec;
    const P4_den = (M * L) + (0.2 * Tc);
    const P4 = P4_den !== 0 ? (P4_num / P4_den) : 0;
    
    // PMTA Calculada (Menor entre P2, P3, P4)
    const pmtaCalc = Math.min(P2, P3, P4);

    // Teste Hidrostático (baseado na PMTA *Adotada*)
    const Pth = pmtaAdotada * 1.5;

    // Constantes de conversão
    const kgfcm2_to_mpa = 0.0980665;
    const kgfcm2_to_psi = 14.2233;

    // Atualizar campos de saída (Página 13)
    document.getElementById('outP1').innerText = P1 > 0 ? P1.toFixed(2) : '-';
    document.getElementById('outP2').innerText = P2 > 0 ? P2.toFixed(2) : '-';
    document.getElementById('outP3').innerText = P3 > 0 ? P3.toFixed(2) : '-';
    document.getElementById('outP4').innerText = P4 > 0 ? P4.toFixed(2) : '-';
    document.getElementById('outPth').innerText = Pth > 0 ? Pth.toFixed(2) : '-';
    
    // Atualizar cálculos intermediários (Página 13)
    document.getElementById('outL').innerText = L > 0 ? L.toFixed(2) : '-';
    document.getElementById('outR').innerText = r > 0 ? r.toFixed(2) : '-';
    document.getElementById('outM').innerText = M > 0 ? M.toFixed(4) : '-';
    
    // Atualizar campos de saída (Página 14)
    document.getElementById('outPmtaCalc').innerText = pmtaCalc > 0 ? pmtaCalc.toFixed(2) : '-';
    document.getElementById('outPmtaCalcMPa').innerText = pmtaCalc > 0 ? (pmtaCalc * kgfcm2_to_mpa).toFixed(2) : '-';
    document.getElementById('outPmtaCalcPSI').innerText = pmtaCalc > 0 ? (pmtaCalc * kgfcm2_to_psi).toFixed(2) : '-';

    // Atualizar campos finais (Página 16)
    if (pmtaAdotada > 0) {
        document.getElementById('pmtaFinalResultado').value = pmtaAdotada.toFixed(2) + " Kgf/cm²";
        
        const parecer = document.getElementById('parecerConclusivo');
        parecer.textContent = `Através dos resultados obtidos inspeção de espessura de chapa em obediência à NR-13 e atendendo os requisitos apontados neste laudo, o equipamento estará liberado para funcionamento normal, dentro dos limites estabelecidos pela PMTA. O valor da PMTA calculado pelo presente documento foi de ${pmtaAdotada.toFixed(2)} kgf/cm².`;
    }

    // Forçar atualização das equações MathJax
    if (window.MathJax) {
        MathJax.typeset();
    }
}

// [O RESTO DO CÓDIGO JS PERMANECE IGUAL]

// Função para restaurar visualização normal
function restorePageView() {
    // Restaurar elementos de navegação
    document.querySelector('.nav-buttons').style.display = 'flex';
    document.querySelector('.page-indicator').style.display = 'block';
    document.getElementById('pdfButton').style.display = 'block';
    
    // Restaurar visualização da página atual
    for (let i = 1; i <= totalPages; i++) {
        document.getElementById(`page-${i}`).style.display = 'none';
    }
    document.getElementById(`page-${currentPage}`).style.display = 'block';
}





