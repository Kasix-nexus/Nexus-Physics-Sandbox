import {
  Engine,
  Render,
  Runner,
  Bodies,
  Common,
  Composite,
  Mouse,
  MouseConstraint,
  Vertices,
} from 'matter-js';
import decomp from 'poly-decomp';

// Устанавливаем 'poly-decomp' для Matter.js
Common.setDecomp(decomp);

// Создание engine и world
const engine = Engine.create();
const { world } = engine;

// Улучшение точности физики
engine.positionIterations = 6;
engine.velocityIterations = 4;
engine.constraintIterations = 2;
engine.timing.timeScale = 1;

// Получение элементов canvas
const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('overlay-canvas');

// Установка размеров canvas
const setCanvasSize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
};
setCanvasSize();

// Получаем доступ к overlayCanvas и его контексту
const overlayContext = overlayCanvas.getContext('2d');

// Создание renderer
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: canvas.width,
    height: canvas.height,
    wireframes: false,
    background: '#f0f0f0',
  },
});
Render.run(render);

// Создание runner
const runner = Runner.create();
Runner.run(runner, engine);

// Функция для создания границ
const createBoundaries = () => {
  const thickness = 50;
  const width = canvas.width;
  const height = canvas.height;

  const options = {
    isStatic: true,
    restitution: 0.1,
    friction: 1.0,
    render: { visible: false },
  };

  return [
    Bodies.rectangle(width / 2, -thickness / 2, width * 2, thickness, options), // Верхняя граница
    Bodies.rectangle(width / 2, height + thickness / 2, width * 2, thickness, options), // Нижняя граница
    Bodies.rectangle(-thickness / 2, height / 2, thickness, height * 2, options), // Левая граница
    Bodies.rectangle(width + thickness / 2, height / 2, thickness, height * 2, options), // Правая граница
  ];
};

let boundaries = createBoundaries();
Composite.add(world, boundaries);

// Обработка изменения размера окна
window.addEventListener('resize', () => {
  setCanvasSize();

  // Обновление размеров renderer
  render.options.width = canvas.width;
  render.options.height = canvas.height;
  render.canvas.width = canvas.width;
  render.canvas.height = canvas.height;

  // Обновление границ
  Composite.remove(world, boundaries);
  boundaries = createBoundaries();
  Composite.add(world, boundaries);
});

// Добавление контроля мыши
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false },
  },
});
Composite.add(world, mouseConstraint);

// Функция для получения случайного цвета
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#1A535C', '#FFE66D', '#FFB5A7', '#6BFFB0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Ограничение на максимальное количество тел в мире
const MAX_BODIES = 200;

// Функция для добавления фигур
function addShape(type, x = null, y = null, size = null) {
  // Проверка на максимальное количество тел
  if (Composite.allBodies(world).length >= MAX_BODIES) {
    const bodiesToRemove = Composite.allBodies(world)
      .filter((body) => !body.isStatic && body !== mouseConstraint.body)
      .slice(0, Composite.allBodies(world).length - MAX_BODIES + 1);
    Composite.remove(world, bodiesToRemove);
  }

  if (x === null) x = Math.random() * canvas.width;
  if (y === null) y = Math.random() * (canvas.height / 2);

  let shape;
  const options = {
    restitution: 0.2,
    friction: 0.7,
    render: {
      fillStyle: getRandomColor(),
    },
  };

  switch (type) {
    case 'square':
      const sizeSquare = size || 80;
      shape = Bodies.rectangle(x, y, sizeSquare, sizeSquare, options);
      break;
    case 'rectangle':
      const rectWidth = size || 80;
      const rectHeight = size || 60;
      shape = Bodies.rectangle(x, y, rectWidth, rectHeight, options);
      break;
    case 'circle':
      const radius = size || 40;
      shape = Bodies.circle(x, y, radius, options);
      break;
    case 'triangle':
      shape = Bodies.polygon(x, y, 3, size || 50, options);
      break;
    case 'polygon':
      const sides = 6;
      const radiusHex = size || 40;
      shape = Bodies.polygon(x, y, sides, radiusHex, options);
      break;
    default:
      return;
  }

  Composite.add(world, shape);
}

// Обработчики событий для кнопок
document.getElementById('add-square').addEventListener('click', () => addShape('square'));
document.getElementById('add-circle').addEventListener('click', () => addShape('circle'));
document.getElementById('add-triangle').addEventListener('click', () => addShape('triangle'));
document.getElementById('add-polygon').addEventListener('click', () => addShape('polygon'));

document.getElementById('draw-rectangle').addEventListener('click', () => {
  isDrawingRectangle = true;

  overlayCanvas.style.pointerEvents = 'auto';
  canvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = 'crosshair';

  overlayCanvas.addEventListener('mousedown', handleMouseDown);
  overlayCanvas.addEventListener('touchstart', handleTouchStart);
});

document.getElementById('draw-circle').addEventListener('click', () => {
  isDrawingCircle = true;

  overlayCanvas.style.pointerEvents = 'auto';
  canvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = 'crosshair';

  overlayCanvas.addEventListener('mousedown', handleCircleMouseDown);
  overlayCanvas.addEventListener('touchstart', handleCircleTouchStart);
});

// Переменные для рисования прямоугольников и кругов
let isDrawingRectangle = false;
let isDrawingCircle = false;
let startX = 0;
let startY = 0;

// Переменные для хранения последних координат касания
let lastTouchX = 0;
let lastTouchY = 0;

// Функции для рисования прямоугольников
function handleMouseDown(event) {
  if (!isDrawingRectangle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;

  overlayCanvas.addEventListener('mousemove', handleMouseMove);
  overlayCanvas.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(event) {
  if (!isDrawingRectangle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;

  const width = currentX - startX;
  const height = currentY - startY;

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Рисование прямоугольника
  overlayContext.beginPath();
  overlayContext.rect(startX, startY, width, height);
  overlayContext.strokeStyle = 'rgba(0,0,0,0.5)';
  overlayContext.lineWidth = 2;
  overlayContext.stroke();
}

function handleMouseUp(event) {
  if (!isDrawingRectangle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const endX = event.clientX - rect.left;
  const endY = event.clientY - rect.top;

  const width = endX - startX;
  const height = endY - startY;

  const centerX = startX + width / 2;
  const centerY = startY + height / 2;

  // Минимальный размер прямоугольника
  if (Math.abs(width) >= 20 && Math.abs(height) >= 20) {
    // Добавление прямоугольника в мир
    addShape('rectangle', centerX, centerY, Math.abs(width), Math.abs(height));
  }

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Удаление обработчиков событий
  overlayCanvas.removeEventListener('mousemove', handleMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleMouseUp);

  isDrawingRectangle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Функции для рисования кругов
function handleCircleMouseDown(event) {
  if (!isDrawingCircle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;

  overlayCanvas.addEventListener('mousemove', handleCircleMouseMove);
  overlayCanvas.addEventListener('mouseup', handleCircleMouseUp);
}

function handleCircleMouseMove(event) {
  if (!isDrawingCircle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;

  const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Рисование круга
  overlayContext.beginPath();
  overlayContext.arc(startX, startY, radius, 0, Math.PI * 2);
  overlayContext.strokeStyle = 'rgba(0,0,0,0.5)';
  overlayContext.lineWidth = 2;
  overlayContext.stroke();
}

function handleCircleMouseUp(event) {
  if (!isDrawingCircle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const endX = event.clientX - rect.left;
  const endY = event.clientY - rect.top;

  const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

  // Минимальный размер круга
  if (radius >= 10) {
    // Добавление круга в мир
    addShape('circle', startX, startY, radius);
  }

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Удаление обработчиков событий
  overlayCanvas.removeEventListener('mousemove', handleCircleMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleCircleMouseUp);

  isDrawingCircle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Функции для обработки касания при рисовании прямоугольников
function handleTouchStart(event) {
  if (!isDrawingRectangle) return;
  if (event.touches.length > 1) return; // Игнорировать множественные касания

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  startX = touch.clientX - rect.left;
  startY = touch.clientY - rect.top;

  overlayCanvas.addEventListener('touchmove', handleTouchMove);
  overlayCanvas.addEventListener('touchend', handleTouchEnd);
}

function handleTouchMove(event) {
  if (!isDrawingRectangle) return;
  if (event.touches.length > 1) return; // Игнорировать множественные касания
  event.preventDefault(); // Предотвратить прокрутку страницы

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = touch.clientX - rect.left;
  const currentY = touch.clientY - rect.top;

  // Сохраняем последние координаты касания
  lastTouchX = currentX;
  lastTouchY = currentY;

  const width = currentX - startX;
  const height = currentY - startY;

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Рисование прямоугольника
  overlayContext.beginPath();
  overlayContext.rect(startX, startY, width, height);
  overlayContext.strokeStyle = 'rgba(0,0,0,0.5)';
  overlayContext.lineWidth = 2;
  overlayContext.stroke();
}

function handleTouchEnd(event) {
  if (!isDrawingRectangle) return;

  // Используем сохраненные последние координаты касания
  const endX = lastTouchX;
  const endY = lastTouchY;

  const width = endX - startX;
  const height = endY - startY;

  const centerX = startX + width / 2;
  const centerY = startY + height / 2;

  // Минимальный размер прямоугольника
  if (Math.abs(width) >= 20 && Math.abs(height) >= 20) {
    // Добавление прямоугольника в мир
    addShape('rectangle', centerX, centerY, Math.abs(width), Math.abs(height));
  }

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Удаление обработчиков событий
  overlayCanvas.removeEventListener('touchmove', handleTouchMove);
  overlayCanvas.removeEventListener('touchend', handleTouchEnd);

  isDrawingRectangle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Функции для обработки касания при рисовании кругов
function handleCircleTouchStart(event) {
  if (!isDrawingCircle) return;
  if (event.touches.length > 1) return; // Игнорировать множественные касания

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  startX = touch.clientX - rect.left;
  startY = touch.clientY - rect.top;

  overlayCanvas.addEventListener('touchmove', handleCircleTouchMove);
  overlayCanvas.addEventListener('touchend', handleCircleTouchEnd);
}

function handleCircleTouchMove(event) {
  if (!isDrawingCircle) return;
  if (event.touches.length > 1) return; // Игнорировать множественные касания
  event.preventDefault(); // Предотвратить прокрутку страницы

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = touch.clientX - rect.left;
  const currentY = touch.clientY - rect.top;

  // Сохраняем последние координаты касания
  lastTouchX = currentX;
  lastTouchY = currentY;

  const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Рисование круга
  overlayContext.beginPath();
  overlayContext.arc(startX, startY, radius, 0, Math.PI * 2);
  overlayContext.strokeStyle = 'rgba(0,0,0,0.5)';
  overlayContext.lineWidth = 2;
  overlayContext.stroke();
}

function handleCircleTouchEnd(event) {
  if (!isDrawingCircle) return;

  // Используем сохраненные последние координаты касания
  const endX = lastTouchX;
  const endY = lastTouchY;

  const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

  // Минимальный размер круга
  if (radius >= 10) {
    // Добавление круга в мир
    addShape('circle', startX, startY, radius);
  }

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Удаление обработчиков событий
  overlayCanvas.removeEventListener('touchmove', handleCircleTouchMove);
  overlayCanvas.removeEventListener('touchend', handleCircleTouchEnd);

  isDrawingCircle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Переменные для рисования произвольной формы
let isDrawingShape = false;
let isDrawing = false;
let currentPath = [];

// Обработчик для кнопки "Draw Shape"
document.getElementById('draw-pencil').addEventListener('click', () => {
  isDrawingShape = true;
  overlayCanvas.style.pointerEvents = 'auto';
  canvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = 'crosshair';

  // Добавляем обработчики событий для рисования формы
  overlayCanvas.addEventListener('mousedown', handleShapeMouseDown);
  overlayCanvas.addEventListener('mousemove', handleShapeMouseMove);
  overlayCanvas.addEventListener('mouseup', handleShapeMouseUp);

  overlayCanvas.addEventListener('touchstart', handleShapeTouchStart);
  overlayCanvas.addEventListener('touchmove', handleShapeTouchMove);
  overlayCanvas.addEventListener('touchend', handleShapeTouchEnd);
});

// Функции для обработки событий мыши при рисовании произвольной формы
function handleShapeMouseDown(e) {
  if (isDrawingShape) {
    isDrawing = true;
    currentPath = [];
    overlayContext.beginPath();
    overlayContext.moveTo(e.offsetX, e.offsetY);
    currentPath.push({ x: e.offsetX, y: e.offsetY });
  }
}

function handleShapeMouseMove(e) {
  if (isDrawing && isDrawingShape) {
    overlayContext.lineTo(e.offsetX, e.offsetY);
    overlayContext.stroke();
    currentPath.push({ x: e.offsetX, y: e.offsetY });
  }
}

function handleShapeMouseUp(e) {
  if (isDrawingShape) {
    isDrawing = false;
    overlayContext.closePath();
    if (currentPath.length > 2) {
      // Добавляем произвольную форму в физический мир
      const vertices = currentPath.map((point) => ({ x: point.x, y: point.y }));
      const center = Vertices.centre(vertices);
      const translatedVertices = Vertices.translate(vertices, { x: -center.x, y: -center.y }, false);

      const shape = Bodies.fromVertices(center.x, center.y, [translatedVertices], {
        restitution: 0.2,
        friction: 0.7,
        render: { fillStyle: getRandomColor() },
      }, true);

      if (shape) {
        Composite.add(world, shape);
      }
    }
    currentPath = [];
    resetDrawingMode();
  }
}

// Функции для обработки сенсорных событий при рисовании произвольной формы
function handleShapeTouchStart(e) {
  if (isDrawingShape) {
    isDrawing = true;
    currentPath = [];
    const rect = overlayCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    overlayContext.beginPath();
    overlayContext.moveTo(x, y);
    currentPath.push({ x: x, y: y });
  }
}

function handleShapeTouchMove(e) {
  if (isDrawing && isDrawingShape) {
    e.preventDefault();
    const rect = overlayCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    overlayContext.lineTo(x, y);
    overlayContext.stroke();
    currentPath.push({ x: x, y: y });
  }
}

function handleShapeTouchEnd(e) {
  if (isDrawingShape) {
    isDrawing = false;
    overlayContext.closePath();
    if (currentPath.length > 2) {
      // Добавляем произвольную форму в физический мир
      const vertices = currentPath.map((point) => ({ x: point.x, y: point.y }));
      const center = Vertices.centre(vertices);
      const translatedVertices = Vertices.translate(vertices, { x: -center.x, y: -center.y }, false);

      const shape = Bodies.fromVertices(center.x, center.y, [translatedVertices], {
        restitution: 0.2,
        friction: 0.7,
        render: { fillStyle: getRandomColor() },
      }, true);

      if (shape) {
        Composite.add(world, shape);
      }
    }
    currentPath = [];
    resetDrawingMode();
  }
}

// Функция для сброса режима рисования
function resetDrawingMode() {
  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  isDrawingShape = false;
  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';

  // Удаляем обработчики событий
  overlayCanvas.removeEventListener('mousedown', handleShapeMouseDown);
  overlayCanvas.removeEventListener('mousemove', handleShapeMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleShapeMouseUp);

  overlayCanvas.removeEventListener('touchstart', handleShapeTouchStart);
  overlayCanvas.removeEventListener('touchmove', handleShapeTouchMove);
  overlayCanvas.removeEventListener('touchend', handleShapeTouchEnd);
}

// Переключение паузы симуляции
let isPaused = false;
const toggleSimulationButton = document.getElementById('toggle-simulation');
const toggleIcon = document.getElementById('toggle-icon');

toggleSimulationButton.addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    Runner.stop(runner);
    toggleIcon.textContent = 'play_arrow'; // Иконка для Resume
    toggleSimulationButton.title = 'Resume';
  } else {
    Runner.run(runner, engine);
    toggleIcon.textContent = 'pause'; // Иконка для Pause
    toggleSimulationButton.title = 'Pause';
  }
});

// Функция для переключения панели управления
const togglePanelButton = document.getElementById('toggle-panel');
const controlPanel = document.getElementById('control-panel');

togglePanelButton.addEventListener('click', () => {
  controlPanel.classList.toggle('hidden-panel');
});
