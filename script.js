// --- CONFIGURAÇÃO DA API ---
const API_URL = "https://script.google.com/macros/s/AKfycbzfHTTirqSnT7iZvJzKOw2n8Jwd6Z0q0QEp9s_HM0xcfI23SGIBU-aO_BCQxeYVc5KJiA/exec";

// --- FUNÇÃO CENTRAL DE CONEXÃO (FETCH) ---
async function apiCall(action, payload = {}) {
    payload.action = action;
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        console.error("Erro na API:", error);
        alert("Erro de conexão. Verifique se o Script foi implantado como 'Qualquer Pessoa'.");
        return null;
    }
}

// --- INTERFACE ---
function showTab(tabId) {
    document.querySelectorAll('.container').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if(tabId === 'tab-lancar') carregarDropdowns();
    window.scrollTo(0,0);
}

async function enviarDados(tipo) {
    let dados = {};
    
    if (tipo === 'salvarProduto') {
        dados.nome = document.getElementById('prodNome').value;
        dados.uni = document.getElementById('prodUnidade').value;
        if(!dados.nome) return alert("Preencha o nome!");
        document.getElementById('prodNome').value = '';
    
    } else if (tipo === 'salvarFornecedor') {
        dados.nome = document.getElementById('fornNome').value;
        dados.contato = document.getElementById('fornContato').value;
        if(!dados.nome) return alert("Preencha o nome!");
        document.getElementById('fornNome').value = '';

    } else if (tipo === 'salvarCotacao') {
        dados.produto = document.getElementById('selectProduto').value;
        dados.fornecedor = document.getElementById('selectFornecedor').value;
        dados.preco = document.getElementById('precoInput').value;
        if(!dados.preco) return alert("Digite o preço!");
        document.getElementById('precoInput').value = '';
    }

    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = "Salvando...";
    btn.disabled = true;

    const res = await apiCall(tipo, dados);
    if(res && res.status === 'sucesso') {
        alert(res.msg);
    }

    btn.innerText = textoOriginal;
    btn.disabled = false;
}

async function carregarDropdowns() {
    const selProd = document.getElementById('selectProduto');
    const selForn = document.getElementById('selectFornecedor');
    
    const res = await apiCall('getDados');
    if(res) {
        selProd.innerHTML = res.produtos.length ? res.produtos.map(p => `<option>${p}</option>`).join('') : '<option>Sem produtos</option>';
        selForn.innerHTML = res.fornecedores.length ? res.fornecedores.map(f => `<option>${f}</option>`).join('') : '<option>Sem fornecedores</option>';
    }
}

async function carregarRelatorio() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('listaResultados').innerHTML = '';
    
    const data = await apiCall('getRelatorio');
    document.getElementById('loader').style.display = 'none';

    let html = '';
    if(!data || data.length === 0) {
        html = '<p style="text-align:center; color:#666;">Nenhum dado encontrado.</p>';
    } else {
        data.forEach(item => {
            let economiaTag = item.economia > 0 ? `<span class="savings-badge">Economia: R$ ${item.economia.toFixed(2)}</span>` : '';
            
            let zapButton = '';
            if(item.contato) {
                let cleanPhone = item.contato.toString().replace(/\D/g, '');
                let msg = `Olá, gostaria de pedir *${item.produto}* pelo valor de R$ ${item.melhorPreco.toFixed(2)}.`;
                let link = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
                zapButton = `<a href="${link}" target="_blank" class="btn-whatsapp">📱 Pedir no WhatsApp</a>`;
            } else {
                zapButton = `<div style="text-align:center; font-size:0.8rem; color:#999; margin-top:5px;">(Sem telefone cadastrado)</div>`;
            }

            html += `
                <div class="card">
                    <h3>${item.produto}</h3>
                    <div style="font-size:0.9rem; color:#555;">Vencedor: <strong>${item.melhorFornecedor}</strong></div>
                    <div class="price-row">
                        <div class="best-price">R$ ${item.melhorPreco.toFixed(2)}</div>
                        ${economiaTag}
                    </div>
                    ${zapButton}
                </div>
            `;
        });
    }
    document.getElementById('listaResultados').innerHTML = html;
}

async function limparTudo() {
    if(confirm("Tem certeza? Isso apagará todos os preços lançados esta semana.")) {
        const res = await apiCall('limparTudo');
        if(res) {
            alert(res.msg);
            document.getElementById('listaResultados').innerHTML = '';
        }
    }
}
// --- NOVA FUNÇÃO: GERAR LISTA PARA WHATSAPP ---
async function gerarTextoCotacao() {
    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = "Gerando lista...";
    btn.disabled = true;

    // 1. Busca os produtos no banco
    const res = await apiCall('getDados');
    
    if(res && res.produtos && res.produtos.length > 0) {
        // 2. Monta o texto
        let msg = "*Olá! Segue a lista para cotação desta semana:*\n\n";
        
        // Adiciona cada produto na lista
        res.produtos.forEach(prod => {
            msg += `[ ] ${prod}\n`;
        });

        msg += "\n*Fico no aguardo dos valores.*";

        // 3. Abre o WhatsApp (sem número específico, para o usuário escolher o contato)
        // Usa encodeURIComponent para transformar quebras de linha em código de URL
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
        alert("Nenhum produto cadastrado para gerar a lista.");
    }

    btn.innerText = textoOriginal;
    btn.disabled = false;
}

