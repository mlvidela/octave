// script.js

const btnJugar = document.getElementById('btnJugar');
const btnCalcular = document.getElementById('btnCalcular');
const juego = document.getElementById('juego');
const calculadora = document.getElementById('calculadora');
const btnVolverJuego = document.getElementById('btnVolverJuego');
const btnVolverCalc = document.getElementById('btnVolverCalc');
const mensaje = document.getElementById('mensaje');
const inputExpr = document.getElementById('inputExpr');
const btnEval = document.getElementById('btnEval');
const resultado = document.getElementById('resultado');
const mapaDiv = document.getElementById('mapa');
const controles = document.getElementById('controles');
const xpBar = document.getElementById('xpBar');

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
  "3,1": { puzzleId: "sala1", abierta: false, intentos: 0 },
  "1,4": { puzzleId: "sala2", abierta: false, intentos: 0 },
  "8,4": { puzzleId: "jefe", abierta: false, intentos: 0 },
};

const puzzles = {
  "sala1": {
    tipo: "algebra",
    pregunta: "Resolver: 3x + 2 = 11. ¿Cuál es el valor de x?",
    opciones: ["a) x = 2", "b) x = 3", "c) x = 4"],
    correcta: "b",
    respuesta: "3",
  },
  "sala2": {
    tipo: "algebra",
    pregunta: "Factorizá: x² + 5x + 6",
    opciones: ["(x + 1)(x + 6)", "(x + 2)(x + 3)", "(x + 3)(x + 4)"],
    correcta: "b",
    respuesta: "(x + 2)(x + 3)",
  },
  "sala3": {
    tipo: "npc",
    mensaje: "\"x huyó del templo porque no sabía quién era… pero con cada paso, te acercás a encontrarlo.\"",
  },
  "jefe": {
    tipo: "algebra",
    pregunta: "Resolver: x² = 16. ¿Cuál es la solución correcta?",
    opciones: ["a) x = 4", "b) x = ±4", "c) x = -4"],
    correcta: "b",
    respuesta: "±4",
  }
};

let playerX = 1;
let playerY = 1;
let targetX = 1;
let targetY = 1;
let xp = 0;
let juegoPausado = false;
let puzzleActual = null;
let intentosMaximos = 3;
let canvas;

function actualizarFondo() {
  const menu = document.getElementById('menu');
  if (!menu.classList.contains('hidden')) {
    document.body.style.backgroundImage = "url('Fondo.png')";
  } else {
    document.body.style.backgroundImage = "none";
  }
}

function mostrarMenu() {
  juego.classList.add('hidden');
  calculadora.classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  controles.classList.add('hidden');
  mapaDiv.style.display = 'none';
  mensaje.textContent = "";
  resultado.textContent = "";
  puzzleActual = null;
  juegoPausado = false;
  actualizarFondo();
}

function mostrarJuego() {
  juego.classList.remove('hidden');
  calculadora.classList.add('hidden');
  document.getElementById('menu').classList.add('hidden');
  controles.classList.remove('hidden');
  mapaDiv.style.display = 'block';
  mensaje.textContent = "Usa las flechas para moverte o hacé click en los desafíos para jugar.";
  resultado.textContent = "";
  iniciarJuego();
  actualizarFondo();
}

function mostrarCalculadora() {
  juego.classList.add('hidden');
  calculadora.classList.remove('hidden');
  document.getElementById('menu').classList.add('hidden');
  controles.classList.add('hidden');
  mapaDiv.style.display = 'none';
  resultado.textContent = "";
  inputExpr.value = "";
  inputExpr.placeholder = puzzleActual && puzzles[puzzleActual].tipo !== "npc"
    ? puzzles[puzzleActual].pregunta
    : "Ingresa expresión (ej: 4+1i)";
  inputExpr.focus();
  actualizarFondo();
}

btnJugar.onclick = mostrarJuego;
btnCalcular.onclick = mostrarCalculadora;
btnVolverJuego.onclick = mostrarMenu;
btnVolverCalc.onclick = mostrarMenu;

function iniciarJuego() {
  if (canvas) canvas.remove();
  canvas = new p5(sketch, 'juego');
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
    if (targetX !== playerX || targetY !== playerY) return;

    let dx = 0, dy = 0;
    if (p.keyCode === p.LEFT_ARROW) dx = -1;
    else if (p.keyCode === p.RIGHT_ARROW) dx = 1;
    else if (p.keyCode === p.UP_ARROW) dy = -1;
    else if (p.keyCode === p.DOWN_ARROW) dy = 1;
    mover(dx, dy);
  };
};

function mover(dx, dy) {
  const newX = playerX + dx;
  const newY = playerY + dy;
  if (newX >= 0 && newX < MAP_COLS && newY >= 0 && newY < MAP_ROWS) {
    let tile = mapa[newY][newX];
    if (tile === 0) {
      targetX = newX;
      targetY = newY;
    } else if (tile === 2) {
      const key = `${newX},${newY}`;
      if (puertas[key]?.abierta) {
        targetX = newX;
        targetY = newY;
      } else {
        abrirPuzzle(puertas[key].puzzleId);
      }
    }
  }
}

function drawMap(p) {
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      p.fill(mapa[y][x] === 1 ? 40 : mapa[y][x] === 2 ? 200 : 150);
      p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawPlayer(p) {
  const easing = 0.2;
  playerX += (targetX - playerX) * easing;
  playerY += (targetY - playerY) * easing;
  p.fill(255, 200, 0);
  p.rect(playerX * TILE_SIZE, playerY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawHUD(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, MAP_ROWS * TILE_SIZE, MAP_COLS * TILE_SIZE, 60);
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`XP: ${xp}`, 20, MAP_ROWS * TILE_SIZE + 30);
}

document.getElementById('flechaArriba').onclick = () => mover(0, -1);
document.getElementById('flechaAbajo').onclick = () => mover(0, 1);
document.getElementById('flechaIzquierda').onclick = () => mover(-1, 0);
document.getElementById('flechaDerecha').onclick = () => mover(1, 0);

function abrirPuzzle(id) {
  if (!(id in puzzles)) return;
  puzzleActual = id;
  juegoPausado = true;

  if (puzzles[id].tipo === "npc") {
    mensaje.textContent = puzzles[id].mensaje;
    resultado.textContent = "";
    setTimeout(() => {
      juegoPausado = false;
      puzzleActual = null;
      mensaje.textContent = "Usa las flechas para moverte o hacé click en los desafíos para jugar.";
    }, 3000);
  } else {
    mensaje.textContent = puzzles[id].pregunta + "\n" + puzzles[id].opciones.join("\n");
    resultado.textContent = "";
    mostrarCalculadora();
  }
}

btnEval.onclick = () => {
  if (!puzzleActual || puzzles[puzzleActual].tipo === "npc") return;
  const puzzle = puzzles[puzzleActual];
  const puerta = Object.entries(puertas).find(([_, d]) => d.puzzleId === puzzleActual)?.[1];
  const userRespRaw = inputExpr.value.trim();

  if (puzzle.opciones && /^[abc]$/i.test(userRespRaw)) {
    if (userRespRaw.toLowerCase() === puzzle.correcta) {
      completarPuzzle(puerta);
    } else {
      manejarIntentoFallido(puerta);
    }
    return;
  }

  try {
    const resultadoUsuario = math.evaluate(userRespRaw);
    const resultadoCorrecto = math.evaluate(puzzle.respuesta);
    const esCorrecto = math.equal(resultadoUsuario, resultadoCorrecto);

    if (esCorrecto) completarPuzzle(puerta);
    else manejarIntentoFallido(puerta);
  } catch {
    resultado.textContent = "Expresión inválida. Intentá de nuevo.";
    inputExpr.focus();
  }
};

function completarPuzzle(puerta) {
  xp += 10;
  actualizarXPBar();
  resultado.textContent = `✔️ ¡Correcto! Has ganado 10 XP.`;
  if (puerta) {
    puerta.abierta = true;
    const [x, y] = Object.entries(puertas).find(([_, data]) => data === puerta)[0].split(',').map(Number);
    mapa[y][x] = 0;
  }
  puzzleActual = null;
  juegoPausado = false;
  setTimeout(mostrarJuego, 1500);
}

function manejarIntentoFallido(puerta) {
  if (!puerta) return;
  puerta.intentos++;
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

function actualizarXPBar() {
  const porcentaje = Math.min(100, (xp / 100) * 100);
  xpBar.style.width = `${porcentaje}%`;
}

mostrarMenu();
