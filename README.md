# Calculator JS

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript">
</p>

Calculadora web com design em tons de café e marrom, desenvolvida com HTML, CSS e JavaScript puro — sem frameworks ou dependências externas.

---

## Funcionalidades

- Operações básicas: adição, subtração, multiplicação e divisão
- Cálculo de porcentagem
- Suporte a números decimais sem artefatos de ponto flutuante
- Previsão de resultado em tempo real antes de clicar em igual
- Histórico de cálculos estilo caderninho, com scroll e animação de abertura
- Apagar último caractere (DEL) e limpar tudo (AC)
- Feedback sonoro nos botões
- Atalho de teclado: Enter para calcular
- Tratamento de divisão por zero e expressões inválidas
- Notação científica para números muito grandes
- Respeita precedência de operadores
- Acessível: aria-labels em todos os controles

---

## Como rodar

Clone o repositório e abra o `index.html` diretamente no navegador — nenhum servidor necessário.

```bash
git clone https://github.com/guilhermejerei/Calculator-JS.git
```

---

## Estrutura

```
Calculator-JS/
├── index.html       — estrutura da calculadora
├── style.css        — estilos, layout e animações
├── script.js        — lógica de cálculo e interatividade
├── favicon.svg      — ícone da aba
└── sounds/
    ├── tap.mp3      — som dos botões
    └── equal.mp3    — som do resultado
```

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica e acessibilidade |
| CSS3 | Grid, custom properties, transições e animações |
| JavaScript ES6+ | Lógica de cálculo com precedência de operadores |
