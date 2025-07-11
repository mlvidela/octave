const btnJugar = document.getElementById('btnJugar');
const btnCalcular = document.getElementById('btnCalcular');
const juegoUI = document.getElementById('juegoUI');
const calculadora = document.getElementById('calculadora');
const btnVolverJuego = document.getElementById('btnVolverJuego');
const btnVolverCalc = document.getElementById('btnVolverCalc');
const mensaje = document.getElementById('mensaje');
const inputExpr = document.getElementById('inputExpr');
const btnEval = document.getElementById('btnEval');
const resultado = document.getElementById('resultado');

const TILE_SIZE = 40;
const MAP_ROWS = 6;
const MAP_COLS = 10;

const mapa = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,2,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,1],
  [1,2,1,0,1,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1],
];

let puertas = {
  "3,1": { puzzleId: "complejo1", abierta: false, intentos: 0 },
  "1,4": { puzzleId: "aritmetica1", abierta: false, intentos: 0 },
};

const puzzles = {
  "complejo1": {
    tipo: "complejo",
    pregunta: "Resuelve: 2+3i + 2-2i",
    respuesta: "4+1i",
  },
  "aritmetica1": {
    tipo: "aritmetica",
    pregunta: "¿Cuánto es 2+2?",
    respuesta: "4",
  }
};

let playerX = 1;
let playerY = 1;
let xp = 0;
let juegoPausado = false;
let puzzleActual = null;
let intentosMaximos = 3;

// Fondo dinámico solo para el menú
function actualizarFondo() {
  const menu = document.getElementById('menu');
  if (!menu.classList.contains('hidden')) {
    document.body.style.backgroundImage = "url('Fondo.png')";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundSize = "contain";
  } else {
    document.body.style.backgroundImage = "none";
  }
}

// Mostrar/ocultar secciones
function mostrarMenu() {
  juegoUI.classList.add('hidden');
  calculadora.classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  mensaje.textContent = "";
  resultado.textContent = "";
  puzzleActual = null;
  juegoPausado = false;
  actualizarFondo();
}

function mostrarJuego() {
  juegoUI.classList.remove('hidden');
  calculadora.classList.add('hidden');
  document.getElementById('menu').classList.add('hidden');
  mensaje.textContent = "Usa las flechas para moverte. Resuelve puzzles para abrir puertas.";
  resultado.textContent = "";
  iniciarJuego();
  actualizarFondo();
}

function mostrarCalculadora() {
  juegoUI.classList.add('hidden');
  calculadora.classList.remove('hidden');
  document.getElementById('menu').classList.add('hidden');
  resultado.textContent = "";
  inputExpr.value = "";

  if (puzzleActual) {
    inputExpr.placeholder = puzzles[puzzleActual].pregunta;
  } else {
    inputExpr.placeholder = "Ingresa expresión (ej: 4+1i)";
  }
  inputExpr.focus();
  actualizarFondo();
}

// Eventos botones
btnJugar.onclick = mostrarJuego;
btnCalcular.onclick = mostrarCalculadora;
btnVolverJuego.onclick = mostrarMenu;
btnVolverCalc.onclick = mostrarMenu;

// --- JUEGO con p5.js ---
let canvas;

function iniciarJuego() {
  if (canvas) canvas.remove();
  canvas = new p5(sketch, 'juegoUI');
}

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE + 60);
    p.frameRate(30);
  };

  p.draw = () => {
    p.background(20,30,50);
    drawMap(p);
    drawPlayer(p);
    drawHUD(p);
  };

  p.keyPressed = () => {
    if (juegoPausado) return;

    let newX = playerX;
    let newY = playerY;

    if (p.keyCode === p.LEFT_ARROW) newX--;
    else if (p.keyCode === p.RIGHT_ARROW) newX++;
    else if (p.keyCode === p.UP_ARROW) newY--;
    else if (p.keyCode === p.DOWN_ARROW) newY++;

    if (newX >= 0 && newX < MAP_COLS && newY >= 0 && newY < MAP_ROWS) {
      let tile = mapa[newY][newX];
      if (tile === 0) {
        playerX = newX;
        playerY = newY;
      } else if (tile === 2) {
        let key = `${newX},${newY}`;
        if (puertas[key].abierta) {
          playerX = newX;
          playerY = newY;
        } else {
          juegoPausado = true;
          puzzleActual = puertas[key].puzzleId;
          mensaje.textContent = puzzles[puzzleActual].pregunta + ` (Intentos restantes: ${intentosMaximos - puertas[key].intentos})`;
          inputExpr.value = "";
          mostrarCalculadora();
        }
      }
    }
  };
};

function drawMap(p) {
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (mapa[y][x] === 1) p.fill(40,90,30);
      else if (mapa[y][x] === 2) p.fill(200,80,0);
      else p.fill(150,200,150);

      p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawPlayer(p) {
  p.fill(255,200,0);
  p.rect(playerX * TILE_SIZE, playerY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawHUD(p) {
  p.fill(0,0,0,180);
  p.rect(0, MAP_ROWS * TILE_SIZE, MAP_COLS * TILE_SIZE, 60);
  p.fill(255);
  p.textSize(18);
  p.textFont('monospace');
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`XP: ${xp}`, 20, MAP_ROWS * TILE_SIZE + 30);
}

// --- CALCULADORA ---
btnEval.onclick = () => {
  const userResp = inputExpr.value.trim();

  if (!puzzleActual) {
    try {
      const resultadoEvaluado = math.evaluate(userResp);
      resultado.textContent = formatoResultado(resultadoEvaluado);
    } catch {
      resultado.textContent = "Expresión inválida.";
    }
    return;
  }

  const puzzle = puzzles[puzzleActual];
  const puerta = Object.entries(puertas).find(([pos, data]) => data.puzzleId === puzzleActual)[1];
  puerta.intentos++;

  try {
    const resultadoUsuario = math.evaluate(userResp);
    const resultadoCorrecto = math.evaluate(puzzle.respuesta);
    const esCorrecto = math.equal(resultadoUsuario, resultadoCorrecto);

    if (esCorrecto) {
      xp += 10;
      resultado.textContent = `✔️ ${formatoResultado(resultadoUsuario)}\n¡Correcto! Has ganado 10 XP.`;

      for (const [pos, data] of Object.entries(puertas)) {
        if (data.puzzleId === puzzleActual) {
          data.abierta = true;
          const [x, y] = pos.split(',').map(Number);
          mapa[y][x] = 0;
        }
      }

      puzzleActual = null;
      juegoPausado = false;

      setTimeout(mostrarJuego, 1500);
    } else {
      manejarIntentoFallido(puerta);
    }
  } catch {
    resultado.textContent = "Expresión inválida. Intentá de nuevo.";
    inputExpr.focus();
  }
};

function manejarIntentoFallido(puerta) {
  const intentosRestantes = intentosMaximos - puerta.intentos;
  if (intentosRestantes <= 0) {
    mensaje.textContent = "Has agotado tus intentos. Puzzle bloqueado.";
    puzzleActual = null;
    juegoPausado = false;
    setTimeout(mostrarJuego, 1500);
  } else {
    mensaje.textContent = `Incorrecto. Intentá de nuevo. Intentos restantes: ${intentosRestantes}`;
    inputExpr.value = "";
    inputExpr.focus();
  }
}

// Utilidad para mostrar número complejo o real como string
function formatoResultado(valor) {
  if (math.typeOf(valor) === "Complex") {
    const re = valor.re;
    const im = valor.im;
    let texto = "";

    if (re !== 0) texto += re;
    if (im !== 0) {
      if (im > 0 && re !== 0) texto += " + ";
      else if (im < 0 && re !== 0) texto += " - ";
      else if (im < 0 && re === 0) texto += "-";
      texto += `${Math.abs(im)}i`;
    }
    return texto || "0";
  } else {
    return `Resultado: ${valor}`;
  }
}

// Al cargar
mostrarMenu();
