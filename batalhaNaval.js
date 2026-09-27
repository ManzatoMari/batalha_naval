
/* Criação da frota, definição dos navios */
const frota = [
    { id: "cargueiro", nome: "Cargueiro", tamanho: 4, imagem: "img/cargueiro.png" },
    { id: "navio",     nome: "Navio",     tamanho: 3, imagem: "img/navio.png" },
    { id: "veleiro",   nome: "Veleiro",   tamanho: 2, imagem: "img/veleiro.png" }
];

const TAMANHO = 10;                                   
const LETRAS = "ABCDEFGHIJ";                          
const IMG_MIRA = "img/mira.png";
const IMG_AGUA = "img/agua.png";
const CHAVE_RECORDE = "batalhaNaval:recorde";


/* estado do jogo */
let tabuleiro;
let navios;         
// navios sorteados nesta partida
let tiros;          
// quantidade de tiros dados
let jogoAcabou; 
let recorde = lerRecorde();

const elTabuleiro = document.getElementById("tabuleiro");
const elTiros = document.getElementById("tiros");
const elRecorde = document.getElementById("recorde");
const elMensagem = document.getElementById("mensagem");
const elFrota = document.getElementById("frota");
const elBotoes = [];  // elBotoes[linha][coluna] 


/*  Cria as casas uma única vez*/
function criarTabuleiro() {
    elTabuleiro.innerHTML = "";

    // Primeira linha: canto vazio + letras das colunas
    elTabuleiro.appendChild(criarRotulo(""));
    for (let coluna = 0; coluna < TAMANHO; coluna++) {
        elTabuleiro.appendChild(criarRotulo(LETRAS[coluna]));
    }

    for (let linha = 0; linha < TAMANHO; linha++) {
        elBotoes[linha] = [];
        elTabuleiro.appendChild(criarRotulo(linha + 1));  // número da linha

        for (let coluna = 0; coluna < TAMANHO; coluna++) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "celula";
            botao.dataset.linha = linha;
            botao.dataset.coluna = coluna;

            const img = document.createElement("img");
            img.alt = ""; 
            botao.appendChild(img);

            elBotoes[linha][coluna] = botao;
            elTabuleiro.appendChild(botao);
        }
    }
}

function criarRotulo(texto) {
    const span = document.createElement("span");
    span.className = "rotulo-eixo";
    span.textContent = texto;
    span.setAttribute("aria-hidden", "true");
    return span;
}

function nomeDaCasa(linha, coluna) {
    return LETRAS[coluna] + (linha + 1); 
}

// Deixa a casa como "ainda não atirada"
function limparCasa(linha, coluna) {
    const botao = elBotoes[linha][coluna];
    botao.className = "celula";
    botao.disabled = false;
    botao.setAttribute("aria-label", "Atirar em " + nomeDaCasa(linha, coluna));
    botao.firstChild.src = IMG_MIRA;
}

// Mostra o resultado do tiro numa casa. estado: "agua", "acerto", "afundado"
function revelarCasa(linha, coluna, estado, imagem, descricao) {
    const botao = elBotoes[linha][coluna];
    botao.className = "celula " + estado;
    botao.disabled = true;
    botao.setAttribute("aria-label", nomeDaCasa(linha, coluna) + ": " + descricao);
    botao.firstChild.src = imagem;
}


/*INICIAR/REINICIAR*/
function iniciarJogo() {
    
    tabuleiro = Array.from({ length: TAMANHO }, () =>
        Array.from({ length: TAMANHO }, () => ({ navio: null, atirada: false }))
    );

    navios = [];
    tiros = 0;
    jogoAcabou = false;

    posicionarNavios();

    for (let linha = 0; linha < TAMANHO; linha++) {
        for (let coluna = 0; coluna < TAMANHO; coluna++) {
            limparCasa(linha, coluna);
        }
    }

    elMensagem.classList.remove("vitoria");
    elMensagem.textContent = "Escolha uma casa do mapa para disparar.";
    atualizarPlacar();
    desenharFrota();
}


/*POSICIONAR NAVIOS
   sorteia orientação e ponto inicial, monta a lista de casas
   que ocuparia e só aceita se todas estiverem livres. Senão, sorteia de novo. */
function posicionarNavios() {
    for (const modelo of frota) {
        let posicoes = null;

        while (posicoes === null) {
            const candidatas = sortearPosicoes(modelo.tamanho);
            if (candidatas.every(p => tabuleiro[p.linha][p.coluna].navio === null)) {
                posicoes = candidatas;
            }
        }

        const navio = { ...modelo, posicoes, acertos: 0, afundado: false };
        posicoes.forEach(p => { tabuleiro[p.linha][p.coluna].navio = navio; });
        navios.push(navio);
    }
}

function sortearPosicoes(tamanho) {
    const horizontal = Math.random() < 0.5;

    
    const maxLinha = horizontal ? TAMANHO : TAMANHO - tamanho + 1;
    const maxColuna = horizontal ? TAMANHO - tamanho + 1 : TAMANHO;
    const linhaInicial = Math.floor(Math.random() * maxLinha);
    const colunaInicial = Math.floor(Math.random() * maxColuna);

    const posicoes = [];
    for (let i = 0; i < tamanho; i++) {
        posicoes.push({
            linha: linhaInicial + (horizontal ? 0 : i),
            coluna: colunaInicial + (horizontal ? i : 0)
        });
    }
    return posicoes;
}


/*TIRO*/
function atirar(linha, coluna) {
    if (jogoAcabou) return;

    const casa = tabuleiro[linha][coluna];
    if (casa.atirada) return;   

    casa.atirada = true;
    tiros++;

    if (casa.navio === null) {
        revelarCasa(linha, coluna, "agua", IMG_AGUA, "água");
        elMensagem.textContent = "Água em " + nomeDaCasa(linha, coluna) + ".";
    } else {
        registrarAcerto(casa.navio, linha, coluna);
    }

    atualizarPlacar();
    desenharFrota();

    if (navios.every(n => n.afundado)) {
        terminarJogo();
    }
}


/*VITÓRIA*/
function registrarAcerto(navio, linha, coluna) {
    navio.acertos++;

    if (navio.acertos < navio.tamanho) {
        revelarCasa(linha, coluna, "acerto", navio.imagem, "acerto no " + navio.nome);
        elMensagem.textContent = "Acertou em " + nomeDaCasa(linha, coluna) + "!";
        return;
    }

    // Todas as casas do navio foram atingidas: ele afundou
    navio.afundado = true;
    navio.posicoes.forEach(p => {
        revelarCasa(p.linha, p.coluna, "afundado", navio.imagem, navio.nome + " afundado");
    });
    elMensagem.textContent = navio.nome + " afundado!";
}

function terminarJogo() {
    jogoAcabou = true;

    let texto = "Vitória! Frota inteira afundada em " + tiros + " tiros.";
    if (recorde === null || tiros < recorde) {
        recorde = tiros;
        salvarRecorde(recorde);
        texto += " Novo recorde!";
    }

    elMensagem.textContent = texto;
    elMensagem.classList.add("vitoria");
    atualizarPlacar();
}



function atualizarPlacar() {
    elTiros.textContent = tiros;
    elRecorde.textContent = recorde === null ? "–" : recorde;
}

function desenharFrota() {
    elFrota.innerHTML = "";

    for (const navio of navios) {
        const item = document.createElement("li");
        item.className = "navio-item" + (navio.afundado ? " afundado" : "");

        const icone = document.createElement("span");
        icone.className = "navio-icone";
        const img = document.createElement("img");
        img.src = navio.imagem;
        img.alt = "";
        icone.appendChild(img);

        const info = document.createElement("span");
        info.className = "navio-info";

        const nome = document.createElement("span");
        nome.className = "navio-nome";
        nome.textContent = navio.nome;

        const estado = document.createElement("span");
        estado.className = "navio-estado";
        estado.textContent = navio.afundado
            ? "Afundado"
            : navio.acertos + " de " + navio.tamanho + " casas atingidas";

        
        const segmentos = document.createElement("span");
        segmentos.className = "segmentos";
        segmentos.setAttribute("aria-hidden", "true");
        for (let i = 0; i < navio.tamanho; i++) {
            const seg = document.createElement("span");
            seg.className = "segmento" + (i < navio.acertos ? " atingido" : "");
            segmentos.appendChild(seg);
        }

        info.append(nome, estado, segmentos);
        item.append(icone, info);
        elFrota.appendChild(item);
    }
}


/* ---------- RECORDE (localStorage) ----------
   try/catch porque alguns navegadores bloqueiam o localStorage. */
function lerRecorde() {
    try {
        const valor = localStorage.getItem(CHAVE_RECORDE);
        return valor === null ? null : Number(valor);
    } catch (erro) {
        return null;
    }
}

function salvarRecorde(valor) {
    try {
        localStorage.setItem(CHAVE_RECORDE, String(valor));
    } catch (erro) {
        // sem localStorage: o recorde vale só até fechar a página
    }
}



elTabuleiro.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".celula");
    if (!botao) return;
    atirar(Number(botao.dataset.linha), Number(botao.dataset.coluna));
});

document.getElementById("btn-reiniciar").addEventListener("click", iniciarJogo);

criarTabuleiro();
iniciarJogo();
