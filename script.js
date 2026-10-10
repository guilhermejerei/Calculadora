// Referências aos elementos do DOM
let campoEntrada = document.getElementById("entrada");
let elementoResultado = document.getElementById("resultado");
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
        }

        // Apaga o último caractere
        if (acao === "backspace") {
            campoEntrada.value = campoEntrada.value.slice(0, -1);
            tocar_audio(audio_botao);
        }

        // Limpa todo o campo e o resultado
        if (acao === "clear") {
            campoEntrada.value = "";
            elementoResultado.textContent = "";
            tocar_audio(audio_botao);
        }

        // Executa o cálculo
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

// Executa o cálculo da expressão no campo de entrada
function calcular() {
    let texto = campoEntrada.value;

    // Ignora se o campo estiver vazio
    if (!texto) return;

    // Remove operador no final da expressão antes de calcular
    if (operadoresValidos.includes(texto.slice(-1))) {
        texto = texto.slice(0, -1);
    }

    // Ignora se restar apenas o sinal de menos (sem número)
    if (!texto || texto === "-") return;

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

    // Tratamento de resultado inválido (NaN)
    if (isNaN(resultadoFinal)) {
        elementoResultado.textContent = "inválido";
        return;
    }

    // Tratamento de divisão por zero
    if (!isFinite(resultadoFinal)) {
        elementoResultado.textContent = "Erro: div/0";
        return;
    }

    // Formata o resultado: notação científica para números muito grandes
    let resultadoFormatado;
    if (String(Number(resultadoFinal)).length >= 12) {
        resultadoFormatado = resultadoFinal.toExponential(8);
    } else {
        resultadoFormatado = resultadoFinal.toString();
    }

    elementoResultado.textContent = resultadoFormatado;
}
