// Referências aos elementos do DOM
let campoEntrada = document.getElementById("entrada");
let elementoResultado = document.getElementById("resultado");
let elementoPrevisao = document.getElementById("previsao");
let botoes = document.querySelectorAll(".interface button");

// Carregamento dos arquivos de áudio
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

// Registro de cliques em cada botão da interface
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
                // Extrai o último segmento numérico após o último operador
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
            elementoResultado.textContent = "";
            elementoPrevisao.textContent = "";
            tocar_audio(audio_botao);
        }

        // Executa o cálculo definitivo
        if (acao === "calcular") {
            calcular();
            tocar_audio(audio_botao2);
        }
    });
});

// Mapeamento de operadores para suas funções aritméticas correspondentes
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
 * Usada tanto pelo botão = quanto pela previsão de resultado.
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

// Executa o cálculo da expressão no campo de entrada (botão =)
function calcular() {
    let texto = campoEntrada.value;

    // Ignora se o campo estiver vazio
    if (!texto) return;

    // Remove operador no final da expressão antes de calcular
    if (operadoresValidos.includes(texto.slice(-1))) {
        texto = texto.slice(0, -1);
    }

    let resultadoFinal = avaliarExpressao(texto);

    // Tratamento de resultado inválido (null cobre NaN e divisão por zero)
    if (resultadoFinal === null) {
        // Distingue divisão por zero de expressão inválida para manter comportamento anterior
        if (texto && !isNaN(Number(texto.split(/[+\-*\/%]/).pop())) ) {
            // Tenta detectar divisão por zero recalculando com verificação pontual
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
            elementoResultado.textContent = divPorZero ? "Erro: div/0" : "inválido";
        } else {
            elementoResultado.textContent = "inválido";
        }
        // Limpa a previsão ao mostrar erro
        elementoPrevisao.textContent = "";
        return;
    }

    // Formata o resultado: notação científica para números muito grandes
    let resultadoFormatado;
    if (String(Number(resultadoFinal)).length >= 12) {
        resultadoFormatado = resultadoFinal.toExponential(8);
    } else {
        // Arredonda para evitar artefatos de ponto flutuante (ex: 0.1+0.2 → 0.3)
        resultadoFormatado = parseFloat(resultadoFinal.toFixed(10)).toString();
    }

    elementoResultado.textContent = resultadoFormatado;
    // Limpa a previsão quando o resultado definitivo é exibido
    elementoPrevisao.textContent = "";
}

/**
 * Atualiza a previsão de resultado a cada modificação do campo de entrada.
 * Reutiliza avaliarExpressao() para garantir consistência com o resultado final.
 * Regras:
 *   - expressão vazia → previsão vazia
 *   - expressão terminando com operador → remove o operador e calcula o restante
 *   - expressão inválida ou divisão por zero → previsão vazia (nunca exibe erro)
 *   - resultado válido → exibe o valor formatado (sem artefatos de ponto flutuante)
 */
function atualizarPrevisao() {
    let texto = campoEntrada.value;

    // Expressão vazia: limpa a previsão
    if (!texto) {
        elementoPrevisao.textContent = "";
        return;
    }

    // Se começa com um operador (que não seja sinal negativo inicial), previsão vazia
    if (operadoresValidos.includes(texto[0]) && texto[0] !== "-") {
        elementoPrevisao.textContent = "";
        return;
    }

    // Remove operador pendente no final antes de avaliar
    let textoAvaliado = texto;
    if (operadoresValidos.includes(textoAvaliado.slice(-1))) {
        textoAvaliado = textoAvaliado.slice(0, -1);
    }

    // Se após a remoção o texto ficou vazio ou é apenas "-", previsão vazia
    if (!textoAvaliado || textoAvaliado === "-") {
        elementoPrevisao.textContent = "";
        return;
    }

    let valor = avaliarExpressao(textoAvaliado);

    // Resultado inválido (inclui divisão por zero): previsão vazia
    if (valor === null) {
        elementoPrevisao.textContent = "";
        return;
    }

    // Arredonda para evitar artefatos de ponto flutuante (ex: 0.1+0.2 → 0.3)
    let formatado = parseFloat(valor.toFixed(10)).toString();

    // Para números muito grandes, usa notação científica (consistente com calcular())
    if (String(Number(valor)).length >= 12) {
        formatado = valor.toExponential(8);
    }

    elementoPrevisao.textContent = formatado;
}
