// ===================== MENU MOBILE (PAINEL) =====================
const btnMenu = document.getElementById("btnMenu");
const menuLateral = document.getElementById("menuLateral");

if (btnMenu && menuLateral) {
    btnMenu.addEventListener("click", () => {
        menuLateral.classList.toggle("aberto");
    });
}

// ===================== LOGIN (index.html) =====================
const formLogin = document.getElementById("formLogin");

if (formLogin) {
    const inputEmail = document.getElementById("loginEmail");
    const inputSenha = document.getElementById("loginSenha");
    const erroLogin = document.getElementById("erroLogin");

    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = inputEmail.value.trim();
        const senha = inputSenha.value.trim();

        // Qualquer e-mail e senha servem (apenas demonstração)
        if (!email || !senha) {
            erroLogin.textContent = "Preencha e-mail e senha para entrar.";
            return;
        }

        window.location.href = "painel/index.html";
    });
}

// ===================== FUNÇÕES GERAIS =====================
function formatarBRL(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Guarda e lê o resumo financeiro no localStorage
const META_MENSAL = 20000;

function salvarResumoFinanceiro(dados) {
    try {
        localStorage.setItem("resumoFinanceiro", JSON.stringify(dados));
    } catch (e) {
        // se o navegador bloquear o localStorage, apenas ignora
    }
}

function obterResumoFinanceiro() {
    try {
        const raw = localStorage.getItem("resumoFinanceiro");
        if (!raw) {
            return {
                totalReceitas: 0,
                totalDespesas: 0,
                saldo: 0,
                metaMensal: META_MENSAL,
                percentualMeta: 0,
                qtdLancamentos: 0
            };
        }
        return JSON.parse(raw);
    } catch (e) {
        return {
            totalReceitas: 0,
            totalDespesas: 0,
            saldo: 0,
            metaMensal: META_MENSAL,
            percentualMeta: 0,
            qtdLancamentos: 0
        };
    }
}

// ===================== PAINEL PRINCIPAL (index.html dentro de /painel) =====================
const totalReceitasEl = document.getElementById("totalReceitas");
const totalDespesasEl = document.getElementById("totalDespesas");
const saldoEl = document.getElementById("saldo");
const metaMesEl = document.getElementById("metaMes");
const progressoMetaEl = document.getElementById("progressoMeta");
const maiorReceitaEl = document.getElementById("maiorReceita");
const maiorDespesaEl = document.getElementById("maiorDespesa");
const qtdLancamentosEl = document.getElementById("qtdLancamentos");
const topDespesasEl = document.getElementById("topDespesas");
const listaLancamentos = document.getElementById("listaLancamentos");

const lancamentos = [];
let proximoId = 1;

if (metaMesEl) {
    metaMesEl.textContent = formatarBRL(META_MENSAL);
}

function atualizarDashboard() {
    if (!totalReceitasEl) return; // só funciona no painel principal

    if (lancamentos.length === 0) {
        totalReceitasEl.textContent = formatarBRL(0);
        totalDespesasEl.textContent = formatarBRL(0);
        saldoEl.textContent = formatarBRL(0);
        progressoMetaEl.textContent = "0%";
        maiorReceitaEl.textContent = "-";
        maiorDespesaEl.textContent = "-";
        qtdLancamentosEl.textContent = "0";
        if (topDespesasEl) {
            topDespesasEl.innerHTML = "<li>Ainda não há despesas cadastradas.</li>";
        }

        salvarResumoFinanceiro({
            totalReceitas: 0,
            totalDespesas: 0,
            saldo: 0,
            metaMensal: META_MENSAL,
            percentualMeta: 0,
            qtdLancamentos: 0
        });
        atualizarPaginasAuxiliares();
        return;
    }

    let somaReceitas = 0;
    let somaDespesas = 0;
    let maiorReceita = 0;
    let maiorDespesa = 0;
    const despesasSomente = [];

    lancamentos.forEach(l => {
        if (l.tipo === "Receita") {
            somaReceitas += l.valor;
            if (l.valor > maiorReceita) maiorReceita = l.valor;
        } else {
            somaDespesas += l.valor;
            if (l.valor > maiorDespesa) maiorDespesa = l.valor;
            despesasSomente.push(l);
        }
    });

    const saldo = somaReceitas - somaDespesas;
    const progresso = META_MENSAL
        ? Math.min(100, (somaReceitas / META_MENSAL) * 100)
        : 0;

    totalReceitasEl.textContent = formatarBRL(somaReceitas);
    totalDespesasEl.textContent = formatarBRL(somaDespesas);
    saldoEl.textContent = formatarBRL(saldo);
    progressoMetaEl.textContent = progresso.toFixed(1) + "%";
    maiorReceitaEl.textContent = maiorReceita > 0 ? formatarBRL(maiorReceita) : "-";
    maiorDespesaEl.textContent = maiorDespesa > 0 ? formatarBRL(maiorDespesa) : "-";
    qtdLancamentosEl.textContent = lancamentos.length.toString();

    if (topDespesasEl) {
        topDespesasEl.innerHTML = "";
        despesasSomente.sort((a, b) => b.valor - a.valor);
        const top3 = despesasSomente.slice(0, 3);

        if (top3.length === 0) {
            topDespesasEl.innerHTML = "<li>Ainda não há despesas cadastradas.</li>";
        } else {
            top3.forEach(d => {
                const li = document.createElement("li");
                li.textContent = `${d.descricao} - ${formatarBRL(d.valor)}`;
                topDespesasEl.appendChild(li);
            });
        }
    }

    // Salva resumo no localStorage para outras páginas
    salvarResumoFinanceiro({
        totalReceitas: somaReceitas,
        totalDespesas: somaDespesas,
        saldo: saldo,
        metaMensal: META_MENSAL,
        percentualMeta: progresso,
        qtdLancamentos: lancamentos.length
    });

    atualizarPaginasAuxiliares();
}

function adicionarLinhaTabela(lanc) {
    if (!listaLancamentos) return;

    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = lanc.id;

    const tdDesc = document.createElement("td");
    tdDesc.textContent = lanc.descricao;

    const tdTipo = document.createElement("td");
    tdTipo.textContent = lanc.tipo;

    const tdValor = document.createElement("td");
    tdValor.textContent = formatarBRL(lanc.valor);
    tdValor.classList.add(lanc.tipo === "Receita" ? "positivo" : "negativo");

    const tdData = document.createElement("td");
    tdData.textContent = lanc.dataBR;

    tr.append(tdId, tdDesc, tdTipo, tdValor, tdData);
    listaLancamentos.appendChild(tr);
}

// Formulário de novo lançamento (somente no painel principal)
const formLancamento = document.getElementById("formLancamento");

if (formLancamento) {
    formLancamento.addEventListener("submit", (e) => {
        e.preventDefault();

        const tipo = document.getElementById("tipo");
        const descricao = document.getElementById("descricao");
        const valor = document.getElementById("valor");
        const data = document.getElementById("data");

        document.getElementById("erroTipo").textContent = "";
        document.getElementById("erroDescricao").textContent = "";
        document.getElementById("erroValor").textContent = "";
        document.getElementById("erroData").textContent = "";

        let valido = true;

        if (!tipo.value) {
            document.getElementById("erroTipo").textContent = "Selecione o tipo.";
            valido = false;
        }
        if (descricao.value.trim().length < 3) {
            document.getElementById("erroDescricao").textContent = "Descrição muito curta.";
            valido = false;
        }
        if (!valor.value || Number(valor.value) <= 0) {
            document.getElementById("erroValor").textContent = "Informe um valor maior que zero.";
            valido = false;
        }
        if (!data.value) {
            document.getElementById("erroData").textContent = "Informe a data.";
            valido = false;
        }

        if (!valido) return;

        const numeroValor = Number(valor.value);
        const dataBR = new Date(data.value + "T00:00:00").toLocaleDateString("pt-BR");

        const novoLanc = {
            id: proximoId++,
            tipo: tipo.value,
            descricao: descricao.value,
            valor: numeroValor,
            dataBR: dataBR
        };

        lancamentos.push(novoLanc);
        adicionarLinhaTabela(novoLanc);
        atualizarDashboard();

        formLancamento.reset();
    });
}

// Dados de exemplo iniciais (somente na página do painel)
function criarDadosExemplo() {
    if (!listaLancamentos) return;

    const exemplos = [
        { tipo: "Receita", descricao: "Venda de serviço", valor: 5000, data: "2025-10-10" },
        { tipo: "Receita", descricao: "Consultoria", valor: 3000, data: "2025-10-15" },
        { tipo: "Despesa", descricao: "Aluguel", valor: 2800, data: "2025-10-01" },
        { tipo: "Despesa", descricao: "Internet", valor: 200,  data: "2025-10-05" }
    ];

    exemplos.forEach(ex => {
        const dataBR = new Date(ex.data + "T00:00:00").toLocaleDateString("pt-BR");
        const lanc = {
            id: proximoId++,
            tipo: ex.tipo,
            descricao: ex.descricao,
            valor: ex.valor,
            dataBR: dataBR
        };
        lancamentos.push(lanc);
        adicionarLinhaTabela(lanc);
    });

    atualizarDashboard();
}

criarDadosExemplo();

// ===================== PREENCHER PÁGINAS AUXILIARES =====================
function atualizarPaginasAuxiliares() {
    const resumo = obterResumoFinanceiro();
    const { totalReceitas, totalDespesas, saldo, percentualMeta } = resumo;

    // --- Página CATEGORIAS ---
    const catTotalReceitas = document.getElementById("catTotalReceitas");
    const catTotalDespesas = document.getElementById("catTotalDespesas");
    const catSaldo = document.getElementById("catSaldo");

    if (catTotalReceitas && catTotalDespesas && catSaldo) {
        catTotalReceitas.textContent = formatarBRL(totalReceitas);
        catTotalDespesas.textContent = formatarBRL(totalDespesas);
        catSaldo.textContent = formatarBRL(saldo);
    }

    // --- Página O QUE PRECISO TER ---
    const oqSaldoAtual = document.getElementById("oqSaldoAtual");
    const oqTotalReceitas = document.getElementById("oqTotalReceitas");
    const oqTotalDespesas = document.getElementById("oqTotalDespesas");

    if (oqSaldoAtual && oqTotalReceitas && oqTotalDespesas) {
        oqSaldoAtual.textContent = formatarBRL(saldo);
        oqTotalReceitas.textContent = formatarBRL(totalReceitas);
        oqTotalDespesas.textContent = formatarBRL(totalDespesas);
    }

    // --- Página SAÚDE FINANCEIRA ---
    const saudeSaldo = document.getElementById("saudeSaldo");
    const saudeIndiceDespesas = document.getElementById("saudeIndiceDespesas");
    const saudeSituacao = document.getElementById("saudeSituacao");
    const saudeMensagem = document.getElementById("saudeMensagem");

    if (saudeSaldo && saudeIndiceDespesas && saudeSituacao && saudeMensagem) {
        saudeSaldo.textContent = formatarBRL(saldo);

        let indice = 0;
        if (totalReceitas > 0) {
            indice = totalDespesas / totalReceitas;
        }

        const indicePercent = (indice * 100).toFixed(1) + "%";
        saudeIndiceDespesas.textContent = indicePercent;

        let situacao;
        let mensagem;

        if (totalReceitas === 0 && totalDespesas === 0) {
            situacao = "Sem dados";
            mensagem = "Ainda não há lançamentos suficientes para avaliar a saúde financeira.";
        } else if (saldo > 0 && indice < 0.6) {
            situacao = "Boa";
            mensagem = "A empresa tem saldo positivo e as despesas estão abaixo de 60% das receitas.";
        } else if (saldo >= 0 && indice < 0.8) {
            situacao = "Regular";
            mensagem = "A empresa está se mantendo, mas as despesas já consomem boa parte das receitas.";
        } else {
            situacao = "Crítica";
            mensagem = "As despesas estão muito altas em relação às receitas ou o saldo está negativo. É preciso rever custos.";
        }

        saudeSituacao.textContent = situacao;
        saudeMensagem.textContent = mensagem;
    }
}

// Chama ao carregar em qualquer página (se não houver dados, usa zeros)
atualizarPaginasAuxiliares();
