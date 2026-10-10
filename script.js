// === Referências aos elementos do DOM ===
let campoEntrada = document.getElementById("entrada");
let elementoResultado = document.getElementById("resultado");
let elementoPrevisao = document.getElementById("previsao");
let botoes = document.querySelectorAll(".interface button");

// Referências ao painel de histórico
let listaHistorico = document.getElementById("historico-lista");
let botaoLimparHistorico = document.getElementById("historico-limpar");

// Array interno de entradas do histórico: cada item é { expressao, resultado }
let entradasHistorico = [];

// === Carregamento dos arquivos de áudio ===
const audio_botao = new Audio('sounds/tap.mp3');
const audio_botao2 = new Audio('sounds/equal.mp3');

// Toca um áudio com volume reduzido
function tocar_audio(audio) {
    audio.volume = 0.3;
    audio.play();
}

// Atalho de teclado: Enter executa o cálculo
document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        calcular();
    }
});

// Conjunto de caracteres considerados operadores válidos
const operadoresValidos = "+-*/%";

// === Registro de cliques em cada botão da interface ===
botoes.forEach(botao => {
    botao.addEventListener("click", function () {
        let valor = botao.dataset.valor;
        let acao = botao.dataset.acao;

        if (valor) {
            let ultimo_valor = campoEntrada.value.slice(-1);

            // Impede operador no início (exceto sinal negativo) e operadores consecutivos
            if (operadoresValidos.includes(valor)) {
                if (campoEntrada.value === "" && valor !== "-") {
                    return;
                }
                if (operadoresValidos.includes(ultimo_valor)) {
                    return;
                }
            }

            // Impede ponto decimal duplicado no mesmo segmento numérico
            if (valor === ".") {
                let segmentos = campoEntrada.value.split(/[+\-*\/%]/);
                let ultimoSegmento = segmentos[segmentos.length - 1];
                if (ultimoSegmento.includes(".")) {
                    return;
                }
            }

            campoEntrada.value += valor;
            tocar_audio(audio_botao);
            atualizarPrevisao();
        }

        // Apaga o último caractere
        if (acao === "backspace") {
            campoEntrada.value = campoEntrada.value.slice(0, -1);
            tocar_audio(audio_botao);
            atualizarPrevisao();
        }

        // Limpa todo o campo, o resultado e a previsão
        if (acao === "clear") {
            campoEntrada.value = "";
            mostrarResultado("");
            mostrarPrevisao("");
            tocar_audio(audio_botao);
        }

        // Executa o cálculo definitivo
        if (acao === "calcular") {
            calcular();
            tocar_audio(audio_botao2);
        }
    });
});

// ===================================================================
// Funções auxiliares de exibição
// Controlam qual dos dois elementos (previsão ou resultado) está visível.
// Nunca ambos ao mesmo tempo — o bloco .area_resultado tem altura fixa.
// ===================================================================

/**
 * Exibe o texto de previsão e garante que o resultado fique invisível.
 * Usa opacity para controlar a visibilidade — o texto permanece no elemento,
 * evitando mudanças de layout enquanto o bloco .area_resultado tem altura fixa.
 * Passando string vazia (ou null) oculta a previsão sem alterar o resultado.
 */
function mostrarPrevisao(texto) {
    if (texto !== "" && texto != null) {
        // Previsão ativa: mostra com opacidade reduzida (discreta), esconde resultado
        elementoPrevisao.textContent = texto;
        elementoPrevisao.style.opacity = '0.55';
        elementoResultado.style.opacity = '0';
    } else {
        // Previsão vazia: oculta via opacity (mantém o espaço no DOM)
        elementoPrevisao.style.opacity = '0';
        elementoResultado.style.opacity = '0';
    }
}

/**
 * Exibe o resultado definitivo e garante que a previsão fique invisível.
 * Usa opacity para controlar a visibilidade — o texto permanece no elemento,
 * evitando mudanças de layout enquanto o bloco .area_resultado tem altura fixa.
 * Passando string vazia (ou null) oculta ambos — usado após AC.
 */
function mostrarResultado(texto) {
    if (texto !== "" && texto != null) {
        // Resultado definitivo: opacidade total, previsão some
        elementoResultado.textContent = texto;
        elementoResultado.style.opacity = '1';
        elementoPrevisao.style.opacity = '0';
    } else {
        // Resultado vazio (após AC): oculta ambos via opacity
        elementoResultado.style.opacity = '0';
        elementoPrevisao.style.opacity = '0';
    }
}

// ===================================================================
// Mapeamento de operadores para suas funções aritméticas
// ===================================================================
const operacoes = {
    "+": (a, b) => a + b,
    "-": (a, b) => a - b,
    "*": (a, b) => a * b,
    "/": (a, b) => a / b,
    "%": (a, b) => a * b / 100,
};

/**
 * Núcleo do cálculo — recebe uma string de expressão já validada e
 * retorna o valor numérico ou null em caso de resultado inválido/infinito.
 * Usada tanto pelo botão = quanto pela previsão de resultado,
 * garantindo que os dois nunca divirjam.
 */
function avaliarExpressao(texto) {
    if (!texto || texto === "-") return null;

    // Coleta todos os operadores presentes na expressão
    let operadores = [];
    for (let i = 0; i < texto.length; i++) {
        let caractere = texto[i];
        if (operadoresValidos.includes(caractere)) {
            operadores.push(caractere);
        }
    }

    // Divide a expressão nos operadores para obter os operandos
    let numeros = texto.split(/[+\-*\/%]/).map(Number);

    // Verifica se algum operando não é um número válido
    if (numeros.some(isNaN)) return null;

    // Aplica multiplicação, divisão e porcentagem primeiro (precedência)
    for (let i = 0; i < operadores.length; i++) {
        if ("*/%".includes(operadores[i])) {
            let resultado = operacoes[operadores[i]](numeros[i], numeros[i + 1]);
            numeros.splice(i, 2, resultado);
            operadores.splice(i, 1);
            i--;
        }
    }

    // Aplica adição e subtração na ordem restante
    let resultadoFinal = numeros[0];
    for (let i = 0; i < operadores.length; i++) {
        resultadoFinal = operacoes[operadores[i]](resultadoFinal, numeros[i + 1]);
    }

    if (isNaN(resultadoFinal) || !isFinite(resultadoFinal)) return null;

    return resultadoFinal;
}

/**
 * Formata um número evitando artefatos de ponto flutuante (ex: 0.1+0.2 → 0.3)
 * e usando notação científica para valores muito grandes.
 */
function formatarNumero(valor) {
    if (String(Number(valor)).length >= 12) {
        return valor.toExponential(8);
    }
    return parseFloat(valor.toFixed(10)).toString();
}

// ===================================================================
// Cálculo definitivo (botão =)
// ===================================================================

/**
 * Executa o cálculo da expressão no campo de entrada.
 * Após o resultado, limpa a previsão e adiciona a entrada ao histórico.
 */
function calcular() {
    let textoOriginal = campoEntrada.value;

    // Ignora se o campo estiver vazio
    if (!textoOriginal) return;

    // Remove operador no final da expressão antes de calcular
    let texto = textoOriginal;
    if (operadoresValidos.includes(texto.slice(-1))) {
        texto = texto.slice(0, -1);
    }

    let resultadoFinal = avaliarExpressao(texto);

    // Tratamento de resultado inválido (null cobre NaN e divisão por zero)
    if (resultadoFinal === null) {
        // Detecta divisão por zero para mensagem específica
        let tempOps = [];
        for (let c of texto) {
            if (operadoresValidos.includes(c)) tempOps.push(c);
        }
        let tempNums = texto.split(/[+\-*\/%]/).map(Number);
        let divPorZero = false;
        for (let i = 0; i < tempOps.length; i++) {
            if ((tempOps[i] === "/" || tempOps[i] === "%") && tempNums[i + 1] === 0) {
                divPorZero = true;
                break;
            }
        }
        mostrarResultado(divPorZero ? "Erro: div/0" : "inválido");
        // Erros não são adicionados ao histórico
        return;
    }

    let resultadoFormatado = formatarNumero(resultadoFinal);

    // Exibe o resultado e oculta a previsão (mostrarResultado faz isso atomicamente)
    mostrarResultado(resultadoFormatado);

    // Adiciona ao histórico apenas resultados válidos
    adicionarHistorico(textoOriginal, resultadoFormatado);
}

// ===================================================================
// Previsão de resultado (atualizada a cada tecla)
// ===================================================================

/**
 * Atualiza a previsão de resultado a cada modificação do campo de entrada.
 * Reutiliza avaliarExpressao() para garantir consistência com o resultado final.
 * Regras:
 *   - expressão vazia → previsão vazia
 *   - expressão terminando com operador → avalia a parte completa (ex: 6+ → mostra 6)
 *   - expressão inválida ou divisão por zero → previsão vazia (nunca exibe erro)
 *   - resultado válido → exibe o valor formatado sem artefatos de ponto flutuante
 */
function atualizarPrevisao() {
    let texto = campoEntrada.value;

    // Expressão vazia: limpa previsão e resultado
    if (!texto) {
        mostrarPrevisao("");
        return;
    }

    // Se começa com operador que não seja sinal negativo, previsão vazia
    if (operadoresValidos.includes(texto[0]) && texto[0] !== "-") {
        mostrarPrevisao("");
        return;
    }

    // Remove operador pendente no final antes de avaliar
    let textoAvaliado = texto;
    if (operadoresValidos.includes(textoAvaliado.slice(-1))) {
        textoAvaliado = textoAvaliado.slice(0, -1);
    }

    // Após remoção, se ficou vazio ou só "-", previsão vazia
    if (!textoAvaliado || textoAvaliado === "-") {
        mostrarPrevisao("");
        return;
    }

    let valor = avaliarExpressao(textoAvaliado);

    // Resultado inválido (inclui divisão por zero): previsão vazia
    if (valor === null) {
        mostrarPrevisao("");
        return;
    }

    mostrarPrevisao(formatarNumero(valor));
}

// ===================================================================
// Histórico de cálculos
// ===================================================================

/**
 * Renderiza a lista de histórico no painel caderninho.
 * Se o array estiver vazio, mostra a mensagem de estado vazio.
 * Cada item é clicável e copia o resultado para o campo de entrada.
 */
function renderizarHistorico() {
    listaHistorico.innerHTML = "";

    if (entradasHistorico.length === 0) {
        let itemVazio = document.createElement("li");
        itemVazio.className = "historico-vazio";
        itemVazio.textContent = "Sem cálculos ainda";
        listaHistorico.appendChild(itemVazio);
        return;
    }

    entradasHistorico.forEach(function (entrada) {
        let item = document.createElement("li");
        item.className = "historico-item";

        let spanExpressao = document.createElement("span");
        spanExpressao.className = "hist-expressao";
        spanExpressao.textContent = entrada.expressao;

        let spanResultado = document.createElement("span");
        spanResultado.className = "hist-resultado";
        spanResultado.textContent = entrada.resultado;

        item.appendChild(spanExpressao);
        item.appendChild(spanResultado);

        // Clique copia o resultado (apenas o número) para o campo de entrada
        item.addEventListener("click", function () {
            campoEntrada.value = entrada.resultado.trim();
            atualizarPrevisao();
        });

        listaHistorico.appendChild(item);
    });
}

/**
 * Adiciona uma nova entrada ao histórico e re-renderiza.
 * Mantém no máximo 10 entradas (remove a mais antiga quando excede).
 */
function adicionarHistorico(expressao, resultado) {
    entradasHistorico.unshift({ expressao: expressao, resultado: resultado });

    if (entradasHistorico.length > 10) {
        entradasHistorico.pop();
    }

    renderizarHistorico();
}

// Botão Limpar: esvazia o array e re-renderiza
botaoLimparHistorico.addEventListener("click", function () {
    entradasHistorico = [];
    renderizarHistorico();
});

// As espirais decorativas do caderninho agora são geradas via CSS (radial-gradient),
// eliminando a necessidade de manipulação do DOM via JavaScript.

// Estado inicial: nenhum resultado nem previsão visível (equivalente ao estado após AC).
// Garante que o controle por opacity esteja correto desde o carregamento da página.
elementoPrevisao.style.opacity = '0';
elementoResultado.style.opacity = '0';
