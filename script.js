// ARQUIVO: script.js
// --- CONFIGURAÇÃO ---
const API_URL = "https://script.google.com/macros/s/AKfycbzfHTTirqSnT7iZvJzKOw2n8Jwd6Z0q0QEp9s_HM0xcfI23SGIBU-aO_BCQxeYVc5KJiA/exec";

// Inicialização: Verifica se veio de um link de e-mail
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const fornecedor = params.get('fornecedor');

    carregarDropdowns();

    if (tab === 'historico') {
        showTab('tab-historico');
        if (fornecedor) {
            setTimeout(() => {
                const select = document.getElementById('filtroFornecedor');
                select.value = fornecedor;
                carregarHistorico(); 
            }, 1000);
        }
    }
};

// Controle de Abas
function showTab(tabId) {
    document.querySelectorAll('.container').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const btn = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
    if(btn) btn.classList.add('active');
}

// Funções API
async function sendData(action, data) {
    try {
        const response = await fetch(`${API_URL}?action=${action}`, { method: 'POST', mode: 'cors', body: JSON.stringify(data) });
        return await response.json();
    } catch (error) { alert("Erro de conexão."); }
}

async function getData(action) {
    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        return await response.json();
    } catch (error) { alert("Erro ao buscar dados."); }
}

// Funções do Sistema
async function carregarDropdowns() {
    const data = await getData('getDadosCadastrados');
    
    // Elementos de Dropdown (Selects)
    const selProd = document.getElementById('selectProduto');
    const selProdLink = document.getElementById('selProdLink');
    const selForn = document.getElementById('selectFornecedor');
    const selFornLink = document.getElementById('selFornLink');
    const selFiltro = document.getElementById('filtroFornecedor'); 
    
    // Elementos de Lista Visual (Novos)
    const listProdView = document.getElementById('viewListaProdutos');
    const listFornView = document.getElementById('viewListaFornecedores');
    
    // --- PREENCHER PRODUTOS ---
    if(data.produtos?.length > 0) {
      // Preenche Selects
      if(selProd) selProd.innerHTML = data.produtos.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
      if(selProdLink) selProdLink.innerHTML = data.produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
      
      // Preenche Lista Visual
      if(listProdView) {
          listProdView.innerHTML = data.produtos.map(p => 
              `<li>
                  <strong>${p.nome}</strong> 
                  <span class="detalhe">${p.unidade || '-'}</span>
               </li>`
          ).join('');
      }
    } else {
        if(listProdView) listProdView.innerHTML = '<li>Nenhum produto cadastrado.</li>';
    }

    // --- PREENCHER FORNECEDORES ---
    if(data.fornecedores?.length > 0) {
      // Preenche Selects
      const opts = data.fornecedores.map(f => `<option value="${f}">${f}</option>`).join('');
      
      if(selForn) selForn.innerHTML = opts;
      if(selFornLink) selFornLink.innerHTML = opts;
      if(selFiltro) selFiltro.innerHTML = '<option value="">Todos os Fornecedores</option>' + opts;

      // Preenche Lista Visual
      if(listFornView) {
          listFornView.innerHTML = data.fornecedores.map(f => 
              `<li>${f}</li>`
          ).join('');
      }
    } else {
        if(listFornView) listFornView.innerHTML = '<li>Nenhum fornecedor cadastrado.</li>';
    }
}

// --- FUNÇÕES DE SALVAR CORRIGIDAS ---

async function salvarProduto() {
  const nome = document.getElementById('prodNome').value;
  const unidade = document.getElementById('prodUnidade').value;
  
  if(!nome) return alert("Preencha o nome do produto!");

  const res = await sendData('salvarProduto', { nome, unidade });
  
  // 1. Mostra a mensagem sempre (seja Sucesso ou Erro)
  alert(res.message); 

  // 2. Só limpa se for sucesso
  if(res.status === 'success') { 
      document.getElementById('prodNome').value = ''; 
      document.getElementById('prodUnidade').value = '';
      carregarDropdowns(); // Atualiza a lista visual na hora
  }
}

async function salvarFornecedor() {
  const nome = document.getElementById('fornNome').value;
  const contato = document.getElementById('fornContato').value;
  
  if(!nome) return alert("Preencha o nome do fornecedor!");

  const res = await sendData('salvarFornecedor', { nome, contato });
  
  alert(res.message);

  if(res.status === 'success') { 
      document.getElementById('fornNome').value = ''; 
      document.getElementById('fornContato').value = '';
      carregarDropdowns(); // Atualiza a lista visual na hora
  }
}

async function salvarCotacao() {
  const produto = document.getElementById('selectProduto').value;
  const fornecedor = document.getElementById('selectFornecedor').value;
  const preco = document.getElementById('precoInput').value;
  
  const res = await sendData('salvarCotacao', { produto, fornecedor, preco });
  
  alert(res.message);
  
  if(res.status === 'success') { 
      document.getElementById('precoInput').value = ''; 
  }
}

// --- FIM DAS CORREÇÕES ---

async function carregarRelatorio() {
    document.getElementById('loader').style.display = 'block';
    const data = await getData('gerarRelatorio');
    document.getElementById('loader').style.display = 'none';
    let html = '';
    if(!data || data.length === 0) html = '<p style="text-align:center;">Nenhuma cotação encontrada.</p>';
    else data.forEach(item => {
            html += `<div class="card"><h3>${item.produto}</h3><div class="supplier-tag">Vencedor: <strong>${item.melhorFornecedor}</strong></div><div class="best-price">R$ ${item.melhorPreco.toFixed(2)}</div></div>`;
    });
    document.getElementById('listaResultados').innerHTML = html;
}

async function carregarHistorico() {
    const fornecedor = document.getElementById('filtroFornecedor').value;
    const divLista = document.getElementById('listaHistorico');
    divLista.innerHTML = '<p style="text-align:center">Carregando...</p>';
    
    const url = fornecedor ? `getHistorico&fornecedor=${encodeURIComponent(fornecedor)}` : `getHistorico`;
    const data = await getData(url);
    
    let html = '';
    if(!data || data.length === 0) {
        html = '<p style="text-align:center;">Nenhum registro encontrado.</p>';
    } else {
        data.forEach(item => {
            html += `
            <div class="card" style="border-left: 5px solid #111;">
                <div style="display:flex; justify-content:space-between;">
                    <h3>${item.produto}</h3>
                    <small>${item.data}</small>
                </div>
                <div class="supplier-tag">Fornecedor: <strong>${item.fornecedor}</strong></div>
                <div class="best-price" style="color:#111">R$ ${item.preco.toFixed(2)}</div>
            </div>`;
        });
    }
    divLista.innerHTML = html;
}

function gerarLinkZap() {
    const forn = document.getElementById('selFornLink').value;
    const select = document.getElementById('selProdLink');
    const selecionados = Array.from(select.selectedOptions).map(option => option.value);
    
    if(selecionados.length === 0) return alert("Selecione pelo menos um produto!");
    if(!forn) return alert("Selecione um fornecedor!");

    let baseUrl = window.location.href;
    if (baseUrl.endsWith('index.html')) baseUrl = baseUrl.replace('index.html', 'fornecedor.html');
    else if (baseUrl.endsWith('/')) baseUrl = baseUrl + 'fornecedor.html';
    else baseUrl = baseUrl + '/fornecedor.html';
    
    const urlFinal = `${baseUrl}?forn=${encodeURIComponent(forn)}&ids=${selecionados.join(',')}`;
    
    document.getElementById('areaResultadoLink').style.display = 'block';
    document.getElementById('textoLink').innerText = urlFinal;
    navigator.clipboard.writeText(urlFinal);
    
    const textoMensagem = `Olá ${forn}, segue o pedido de cotação da G-Farma. Por favor, preencha no link abaixo: \n\n ${urlFinal} \n\n Aguardamos retorno.`;
    const linkZap = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
    
    const btnZap = document.getElementById('btnZap');
    btnZap.onclick = function() { window.open(linkZap, '_blank'); };

    alert("Link gerado e copiado!");
}
