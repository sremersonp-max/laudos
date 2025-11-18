// --- Configurações Globais ---
let measurementPhotoCounter = 1;
let currentPage = 1;
const totalPages = 16;
const LAUDOS_KEY = 'laudos_nr13';

// --- Inicialização Unificada ---
document.addEventListener('DOMContentLoaded', function() {
    // 1. Configurar Datas Iniciais
    const today = new Date().toISOString().split('T')[0];
    const elmDate = document.getElementById('currentDate');
    if(elmDate) elmDate.textContent = formatDate(today);
    
    setValIfEmpty('dataInicio', today);
    setValIfEmpty('dataFim', today);
    setValIfEmpty('dataLaudo', today);
    
    // Próxima inspeção (5 anos)
    const nextInspection = new Date();
    nextInspection.setFullYear(nextInspection.getFullYear() + 5);
    setValIfEmpty('proximaInspecao', nextInspection.toISOString().split('T')[0]);

    // 2. Configurar Botões e Eventos
    setupActionButtons(); // Cria Salvar/Cancelar na barra
    setupEventListeners();
    setupCheckboxGroups();
    
    // Definir Ícones de Navegação
    document.getElementById('prevBtn').innerHTML = '&#8592;'; // Seta Esquerda
    document.getElementById('nextBtn').innerHTML = '&#8594;'; // Seta Direita

    // 3. Verificar Modo (Edição ou Novo)
    const urlParams = new URLSearchParams(window.location.search);
    const laudoEmEdicao = JSON.parse(localStorage.getItem('laudo_em_edicao') || 'null');
    
    if (laudoEmEdicao) {
        preencherLaudoComDados(laudoEmEdicao);
    }

    if (urlParams.get('modo') === 'visualizacao') {
        bloquearEdicao();
    }

    // 4. Iniciar na Página 1
    showPage(1);
});

// Função auxiliar para não sobrescrever dados se já existirem
function setValIfEmpty(id, val) {
    const el = document.getElementById(id);
    if(el && !el.value) el.value = val;
}

// --- Navegação e Visibilidade ---
function setupEventListeners() {
    // Navegação
    document.getElementById('prevBtn').addEventListener('click', () => navigatePages(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigatePages(1));
    
    // Uploads de imagem
    setupImageUploadListeners();
    
    // Tabela Dinâmica
    const addRowBtn = document.querySelector('.add-row-btn');
    if(addRowBtn) addRowBtn.addEventListener('click', addMeasurementRow);
    
    // Atualização de TAG
    document.getElementById('tag').addEventListener('input', updateTagHeaders);
    document.getElementById('tagEquipamento').addEventListener('input', function() {
        document.getElementById('tag').value = this.value;
        updateTagHeaders();
    });

    // Cálculos Automáticos
    const calcInputs = ['D', 'tc', 'ttl', 'tts', 'sc', 'st', 'el', 'ec', 'pmtaAdotada'];
    calcInputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', calculatePMTA);
    });
}

function navigatePages(direction) {
    // Esconde página atual
    document.getElementById(`page-${currentPage}`).style.display = 'none';
    
    // Calcula nova página
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    // Mostra nova página
    showPage(currentPage);
}

function showPage(pageNum) {
    // Mostrar div da página
    document.getElementById(`page-${pageNum}`).style.display = 'block';
    
    // Atualizar indicador
    document.getElementById('pageIndicator').textContent = `${pageNum} / ${totalPages}`;
    
    // Atualizar estado dos botões de navegação
    document.getElementById('prevBtn').disabled = (pageNum === 1);
    document.getElementById('nextBtn').disabled = (pageNum === totalPages);
    
    // --- LÓGICA DE BOTÕES (Aparecer só no final) ---
    const isLastPage = (pageNum === totalPages);
    const displayStyle = isLastPage ? 'flex' : 'none';
    
    // Botões de Ação
    ['saveBtn', 'cancelBtn', 'pdfButton'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.style.display = displayStyle;
    });

    updateTagHeaders();
    window.scrollTo(0, 0);
}

function updateTagHeaders() {
    const tag = document.getElementById('tag').value || 'TAG';
    for (let i = 2; i <= 16; i++) {
        const header = document.getElementById(`tagHeader${i}`);
        if (header) header.textContent = tag;
    }
}

// --- Criação dos Botões de Ação ---
function setupActionButtons() {
    const navBar = document.querySelector('.nav-buttons');
    
    // 1. Botão Cancelar (X Vermelho)
    if (!document.getElementById('cancelBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelBtn';
        cancelBtn.innerHTML = '&#10006;'; // X
        cancelBtn.style.backgroundColor = '#dc3545';
        cancelBtn.style.display = 'none';
        cancelBtn.onclick = cancelarEdicao;
        // Inserir antes do botão Next
        navBar.insertBefore(cancelBtn, document.getElementById('prevBtn'));
    }
    
    // 2. Botão Salvar (Disquete Verde)
    if (!document.getElementById('saveBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveBtn';
        saveBtn.innerHTML = '&#128190;'; // Disquete
        saveBtn.style.backgroundColor = '#28a745';
        saveBtn.style.display = 'none';
        saveBtn.onclick = salvarLaudo;
        navBar.appendChild(saveBtn);
    }
    
    // 3. Configurar Botão PDF existente
    const pdfBtn = document.getElementById('pdfButton');
    if(pdfBtn) {
        pdfBtn.innerHTML = '&#128462; PDF'; // Documento
        pdfBtn.onclick = generatePDF;
        pdfBtn.style.display = 'none';
        // Move para dentro da barra se estiver fora
        if(pdfBtn.parentElement !== navBar) {
            navBar.appendChild(pdfBtn);
        }
    }
}

// --- Imagens e Uploads ---
function setupImageUploadListeners() {
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function(e) {
            let imgId = this.id.replace('file_gallery_', '').replace('file_camera_', '');
            handleImageUpload(e, imgId);
        });
    });
}

function handleImageUpload(event, imgId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.getElementById(imgId);
            if(imgElement) {
                imgElement.src = e.target.result;
                imgElement.style.display = 'block';
                const uploader = imgElement.closest('.image-uploader');
                if(uploader) {
                    const ph = uploader.querySelector('.placeholder-text');
                    if(ph) ph.style.display = 'none';
                }
            }
        }
        reader.readAsDataURL(file);
    }
}

// --- Tabela Dinâmica (Pág 10) ---
function addMeasurementRow() {
    measurementPhotoCounter++;
    const tbody = document.getElementById('measurementTableBody');
    const row = tbody.insertRow();
    const newImgId = `medPhoto${measurementPhotoCounter}`;
    
    row.innerHTML = `
        <td><input type="text" placeholder="Ponto"></td>
        <td><input type="number" step="0.1" placeholder="0.0"></td>
        <td>
            <div class="image-uploader" style="min-height: 50px; padding: 5px; margin:0;">
                <img id="${newImgId}" class="image-preview" style="max-height: 50px; display:none;">
                <span class="placeholder-text">
                    <label for="fg_${newImgId}" class="upload-btn-small">📂</label>
                    <label for="fc_${newImgId}" class="upload-btn-small camera-btn">📷</label>
                </span>
                <input type="file" accept="image/*" id="fg_${newImgId}" class="hidden-input" onchange="handleImageUpload(event, '${newImgId}')">
                <input type="file" accept="image/*;capture=camera" id="fc_${newImgId}" class="hidden-input" onchange="handleImageUpload(event, '${newImgId}')">
            </div>
        </td>
        <td class="center"><button type="button" class="remove-row-btn" onclick="this.closest('tr').remove()">X</button></td>
    `;
}

// --- Checkboxes ---
function setupCheckboxGroups() {
    ['tipoInspecao', 'resultado', 'superficie'].forEach(name => {
        const group = document.querySelectorAll(`input[name="${name}"]`);
        group.forEach(cb => {
            cb.addEventListener('change', function() {
                if(this.checked) group.forEach(other => { if(other!==this) other.checked = false; });
            });
        });
    });
}

// --- Cálculo PMTA ---
function calculatePMTA() {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    const D = v('D'), Tc = v('tc'), Ttl = v('ttl'), Tts = v('tts');
    const Sc = v('sc'), St = v('st'), El = v('el'), Ec = v('ec');
    const pmtaAdotada = v('pmtaAdotada');

    if (!D || !Tc) return; 

    const L = 0.9045 * D;
    const r = 0.1727 * D;
    const M = 0.25 * (3 + Math.sqrt(L / r));

    // Fórmulas
    const P1 = ((D/2)-0.4*Tc)!==0 ? (2*Sc*Tc*El)/((D/2)-0.4*Tc) : 0;
    const P2 = ((D/2)+0.6*Tc)!==0 ? (Sc*Tc*Ec)/((D/2)+0.6*Tc) : 0;
    const P3 = (M*L+0.2*Tc)!==0 ? (2*St*Ttl*Ec)/(M*L+0.2*Tc) : 0;
    const P4 = (M*L+0.2*Tc)!==0 ? (2*St*Tts*Ec)/(M*L+0.2*Tc) : 0;

    const pmtaCalc = Math.min(P2, P3, P4);

    // Atualizar Tela
    const setTxt = (id, val) => document.getElementById(id).innerText = val > 0 ? val.toFixed(2) : '-';
    
    setTxt('outP1', P1); setTxt('outP2', P2); setTxt('outP3', P3); setTxt('outP4', P4);
    setTxt('outPth', pmtaAdotada * 1.5);
    
    setTxt('outL', L); setTxt('outR', r);
    document.getElementById('outM').innerText = M > 0 ? M.toFixed(4) : '-';
    
    setTxt('outPmtaCalc', pmtaCalc);
    setTxt('outPmtaCalcMPa', pmtaCalc * 0.0980665);
    setTxt('outPmtaCalcPSI', pmtaCalc * 14.2233);

    if (pmtaAdotada > 0) {
        document.getElementById('pmtaFinalResultado').value = pmtaAdotada.toFixed(2) + " Kgf/cm²";
    }
    
    if(window.MathJax) MathJax.typeset();
}

// --- Geração de PDF ---
function generatePDF() {
    // Esconder a barra de navegação
    const nav = document.querySelector('.nav-buttons');
    const indicator = document.querySelector('.page-indicator');
    if(nav) nav.style.display = 'none';
    if(indicator) indicator.style.display = 'none';

    // Mostrar todas as páginas
    for (let i = 1; i <= totalPages; i++) {
        document.getElementById(`page-${i}`).style.display = 'block';
    }

    setTimeout(() => {
        window.print();
        
        // Restaurar
        setTimeout(() => {
            if(nav) nav.style.display = 'flex';
            if(indicator) indicator.style.display = 'block';
            
            // Voltar para mostrar só a página atual
            for (let i = 1; i <= totalPages; i++) {
                document.getElementById(`page-${i}`).style.display = (i === currentPage) ? 'block' : 'none';
            }
        }, 500);
    }, 300);
}

// --- Salvar e Carregar (COMPLETO) ---
function coletarDadosLaudo() {
    const getVal = (s) => document.querySelector(s)?.value || '';
    const getImg = (id) => {
        const img = document.getElementById(id);
        return (img && img.src.startsWith('data:')) ? img.src : '';
    };

    return {
        tag: document.getElementById('tag').value,
        numeroLaudo: document.getElementById('numeroLaudo').value,
        numeroART: document.getElementById('numeroART').value,
        dataInicio: document.getElementById('dataInicio').value,
        dataFim: document.getElementById('dataFim').value,
        dataLaudo: document.getElementById('dataLaudo').value,
        
        // Checkboxes
        tipoInspecao: Array.from(document.querySelectorAll('input[name="tipoInspecao"]:checked')).map(cb => cb.value),
        
        // Grupos
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
        
        // Imagens principais (adicione mais IDs conforme criar novos campos)
        imagens: {
            imgPage1: getImg('imgPage1'),
            imgPlaca: getImg('imgPlaca'),
            imgValvula: getImg('imgValvula'),
            imgManometro: getImg('imgManometro'),
            imgReg1: getImg('imgReg1'),
            imgReg2: getImg('imgReg2'),
            imgReg3: getImg('imgReg3'),
            imgReg4: getImg('imgReg4'),
            imgReg5: getImg('imgReg5'),
            imgReg6: getImg('imgReg6'),
            imgCalcFoto: getImg('imgCalcFoto'),
            imgDiagramaCorpo: getImg('imgDiagramaCorpo'),
            imgDiagramaEsq: getImg('imgDiagramaEsq'),
            imgDiagramaDir: getImg('imgDiagramaDir')
        },
        dataSalvamento: new Date().toISOString()
    };
}

function preencherLaudoComDados(dados) {
    if (!dados) return;
    const setVal = (id, v) => { const el = document.getElementById(id); if(el && v) el.value = v; };
    const setPh = (ph, v) => { const el = document.querySelector(`input[placeholder="${ph}"]`); if(el && v) el.value = v; };

    // Campos Básicos
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
    if(dados.tipoInspecao) {
        document.querySelectorAll('input[name="tipoInspecao"]').forEach(cb => {
            cb.checked = dados.tipoInspecao.includes(cb.value);
        });
    }

    // Objetos
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
            if(el && dados.imagens[id]) {
                el.src = dados.imagens[id];
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
    if (!dados.tag) return alert('Por favor, preencha a TAG (Página 1) antes de salvar.');
    
    const laudos = JSON.parse(localStorage.getItem(LAUDOS_KEY) || '[]');
    const edicao = JSON.parse(localStorage.getItem('laudo_em_edicao') || 'null');
    
    if (edicao && edicao.index !== undefined) {
        laudos[edicao.index] = dados;
    } else {
        laudos.push(dados);
    }
    
    localStorage.setItem(LAUDOS_KEY, JSON.stringify(laudos));
    localStorage.removeItem('laudo_em_edicao');
    alert('Laudo salvo com sucesso!');
    window.location.href = 'index.html';
}

function cancelarEdicao() {
    if (confirm('Deseja cancelar? Alterações não salvas serão perdidas.')) {
        localStorage.removeItem('laudo_em_edicao');
        window.location.href = 'index.html';
    }
}

function bloquearEdicao() {
    document.querySelectorAll('.nav-buttons, .upload-btn, .add-row-btn, .remove-row-btn').forEach(e => e.style.display='none');
    document.querySelectorAll('input, textarea, select').forEach(e => e.readOnly=true);
    document.querySelectorAll('input[type="checkbox"]').forEach(e => e.disabled=true);
}

function formatDate(str) {
    if(!str) return '';
    return new Date(str).toLocaleDateString('pt-BR');
}