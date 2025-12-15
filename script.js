<script>
  // Controle de Abas
  function showTab(tabId) {
    document.querySelectorAll('.container').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    // Adiciona classe active ao botão que foi clicado
    event.currentTarget.classList.add('active');
    
    // Se for a aba de lançar preços, carrega os dados atualizados
    if(tabId === 'tab-lancar') carregarDropdowns();
  }

  // --- Funções de Comunicação com o Google Apps Script ---
  
  function salvarProduto() {
    const nome = document.getElementById('prodNome').value;
    const uni = document.getElementById('prodUnidade').value;
    if(!nome) return alert("Preencha o nome!");
    
    google.script.run.withSuccessHandler(alert).salvarProduto(nome, uni);
    document.getElementById('prodNome').value = '';
  }

  function salvarFornecedor() {
    const nome = document.getElementById('fornNome').value;
    const contato = document.getElementById('fornContato').value;
    if(!nome) return alert("Preencha o nome!");
    
    google.script.run.withSuccessHandler(alert).salvarFornecedor(nome, contato);
    document.getElementById('fornNome').value = '';
  }

  function carregarDropdowns() {
    google.script.run.withSuccessHandler(data => {
      const selProd = document.getElementById('selectProduto');
      const selForn = document.getElementById('selectFornecedor');
      
      // Limpa e popula selects
      if(data.produtos.length > 0) {
        selProd.innerHTML = data.produtos.map(p => `<option>${p}</option>`).join('');
      } else {
        selProd.innerHTML = '<option>Cadastre produtos primeiro</option>';
      }

      if(data.fornecedores.length > 0) {
        selForn.innerHTML = data.fornecedores.map(f => `<option>${f}</option>`).join('');
      } else {
        selForn.innerHTML = '<option>Cadastre fornecedores primeiro</option>';
      }
      
    }).getDadosCadastrados();
  }

  function salvarCotacao() {
    const prod = document.getElementById('selectProduto').value;
    const forn = document.getElementById('selectFornecedor').value;
    const preco = document.getElementById('precoInput').value;
    
    if(!preco) return alert("Digite o preço!");
    
    google.script.run.withSuccessHandler(() => {
      alert("Preço salvo!");
      document.getElementById('precoInput').value = '';
      document.getElementById('precoInput').focus();
    }).salvarCotacao(prod, forn, preco);
  }

  function carregarRelatorio() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('listaResultados').innerHTML = '';
    
    google.script.run.withSuccessHandler(data => {
      document.getElementById('loader').style.display = 'none';
      let html = '';
      
      if(data.length === 0) {
        html = '<p style="text-align:center; color:#666;">Nenhuma cotação encontrada ou banco de dados vazio.</p>';
      } else {
        data.forEach(item => {
          html += `
            <div class="card">
              <h3>${item.produto}</h3>
              <div class="supplier-tag">Fornecedor Vencedor: <strong>${item.melhorFornecedor}</strong></div>
              <div class="best-price">R$ ${item.melhorPreco.toFixed(2)}</div>
            </div>
          `;
        });
      }
      document.getElementById('listaResultados').innerHTML = html;
    }).gerarRelatorioComparativo();
  }
</script>
