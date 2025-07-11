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

// Mapa:
// 0 = camino libre
// 1 = muro
// 2 = puerta bloqueada
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
    pregunta: "Resuelve el número complejo: 4+1i",
    respuesta: "4+1i",
  },
  "aritmetica1": {
    tipo: "aritmetica",
    pregunta: "¿Cuánto es 5 + 3?",
    respuesta: "8",
  }
};

// Estado jugador
let playerX = 1;
let playerY = 1;
let xp = 0;
let juegoPausado = false;
let puzzleActual = null;
let intentosMaximos = 3;

// Mostrar/ocultar secciones
function mostrarMenu() {
  juegoUI.classList.add('hidden');
  calculadora.classList.add('hidden');
  document.getElementById('menu').style.display = 'flex';
  mensaje.textContent = "";
  puzzleActual = null;
  juegoPausado = false;
}

function mostrarJuego() {
  juegoUI.classList.remove('hidden');
  calculadora.classList.add('hidden');
  document.getElementById('menu').style.display = 'none';
  mensaje.textContent = "Usa las flechas para moverte. Resuelve puzzles para abrir puertas.";
  iniciarJuego();
}

function mostrarCalculadora() {
  juegoUI.classList.add('hidden');
  calculadora.classList.remove('hidden');
  document.getElementById('menu').style.display = 'none';
  resultado.textContent = "";
  inputExpr.value = "";
}

// Evento botones menú
btnJugar.onclick = mostrarJuego;
btnCalcular.onclick = mostrarCalculadora;
btnVolverJuego.onclick = mostrarMenu;
btnVolverCalc.onclick = mostrarMenu;

// --- JUEGO con p5.js ---
let canvas;

function iniciarJuego() {
  if(canvas) {
    canvas.remove();
  }
  canvas = new p5(sketch, 'juegoUI');
}

// Función p5 principal
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
    if(juegoPausado) return;

    let newX = playerX;
    let newY = playerY;

    if(p.keyCode === p.LEFT_ARROW) newX--;
    else if(p.keyCode === p.RIGHT_ARROW) newX++;
    else if(p.keyCode === p.UP_ARROW) newY--;
    else if(p.keyCode === p.DOWN_ARROW) newY++;

    if(newX >= 0 && newX < MAP_COLS && newY >= 0 && newY < MAP_ROWS) {
      let tile = mapa[newY][newX];
      if(tile === 0) {
        playerX = newX;
        playerY = newY;
      } else if(tile === 2) {
        // puerta bloqueada
        let key = `${newX},${newY}`;
        if(puertas[key].abierta) {
          playerX = newX;
          playerY = newY;
        } else {
          // mostrar puzzle
          juegoPausado = true;
          puzzleActual = puertas[key].puzzleId;
          mensaje.textContent = puzzles[puzzleActual].pregunta + ` (Intentos restantes: ${intentosMaximos - puertas[key].intentos})`;
          inputExpr.value = "";
          inputExpr.focus();
          mostrarCalculadora();
        }
      }
    }
  };
};

function drawMap(p) {
  for(let y=0; y<MAP_ROWS; y++) {
    for(let x=0; x<MAP_COLS; x++) {
      if(mapa[y][x] === 1) p.fill(40,90,30);
      else if(mapa[y][x] === 2) p.fill(200,80,0); // puertas anaranjadas
      else p.fill(150,200,150);

      p.rect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawPlayer(p) {
  p.fill(255,200,0);
  p.rect(playerX*TILE_SIZE, playerY*TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawHUD(p) {
  p.fill(0,0,0,180);
  p.rect(0, MAP_ROWS*TILE_SIZE, MAP_COLS*TILE_SIZE, 60);
  p.fill(255);
  p.textSize(18);
  p.textFont('monospace');
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`XP: ${xp}`, 20, MAP_ROWS*TILE_SIZE + 30);
}

// --- CALCULADORA ---
btnEval.onclick = () => {
  if(!puzzleActual) return;

  let userResp = inputExpr.value.trim();

  // validar respuesta simple
  const correctResp = puzzles[puzzleActual].respuesta;

  const puerta = Object.entries(puertas).find(([pos, data]) => data.puzzleId === puzzleActual)[1];
  puerta.intentos++;

  if(userResp.toLowerCase() === correctResp.toLowerCase()) {
    xp += 10;
    mensaje.textContent = "¡Correcto! Has ganado 10 XP.";
    // abrir puerta
    for(const [pos, data] of Object.entries(puertas)) {
      if(data.puzzleId === puzzleActual) {
        data.abierta = true;
        // cambiar mapa tile puerta a camino
        const [x, y] = pos.split(',').map(Number);
        mapa[y][x] = 0;
      }
    }
    puzzleActual = null;
    juegoPausado = false;
    mostrarJuego();
  } else {
    const intentosRestantes = intentosMaximos - puerta.intentos;
    if(intentosRestantes <= 0) {
      mensaje.textContent = "Has agotado tus intentos. Puzzle bloqueado.";
      puzzleActual = null;
      juegoPausado = false;
      mostrarJuego();
    } else {
      mensaje.textContent = `Incorrecto. Intenta de nuevo. Intentos restantes: ${intentosRestantes}`;
      inputExpr.value = "";
      inputExpr.focus();
    }
  }
};
