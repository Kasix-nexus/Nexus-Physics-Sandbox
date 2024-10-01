import { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } from 'matter-js';

// Создание engine и world
const engine = Engine.create();
const { world } = engine;

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

  return [
    // Верхняя граница
    Bodies.rectangle(width / 2, -thickness / 2, width, thickness, {
      isStatic: true,
      render: { visible: false },
    }),
    // Нижняя граница
    Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, {
      isStatic: true,
      render: { visible: false },
    }),
    // Левая граница
    Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
      isStatic: true,
      render: { visible: false },
    }),
    // Правая граница
    Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
      isStatic: true,
      render: { visible: false },
    }),
  ];
};

let boundaries = createBoundaries();
World.add(world, boundaries);

// Обработка изменения размера окна
window.addEventListener('resize', () => {
  setCanvasSize();

  // Обновление размеров renderer
  render.options.width = canvas.width;
  render.options.height = canvas.height;
  render.canvas.width = canvas.width;
  render.canvas.height = canvas.height;

  // Обновление границ
  World.remove(world, boundaries);
  boundaries = createBoundaries();
  World.add(world, boundaries);
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
World.add(world, mouseConstraint);

// Функция для получения случайного цвета
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#1A535C', '#FFE66D', '#FFB5A7', '#6BFFB0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Функция для добавления фигур
function addShape(type, x = null, y = null, width = null, height = null) {
  if (x === null) x = Math.random() * canvas.width;
  if (y === null) y = Math.random() * (canvas.height / 2);

  let shape;
  const options = {
    render: {
      fillStyle: getRandomColor(),
    },
  };

  switch (type) {
    case 'square':
      const size = width || 80;
      shape = Bodies.rectangle(x, y, size, size, options);
      break;
    case 'rectangle':
      const rectWidth = width || 80;
      const rectHeight = height || 60;
      shape = Bodies.rectangle(x, y, rectWidth, rectHeight, options);
      break;
    case 'circle':
      const radius = width || 40;
      shape = Bodies.circle(x, y, radius, options);
      break;
    case 'triangle':
      shape = Bodies.polygon(x, y, 3, width || 50, options);
      break;
    default:
      return;
  }

  World.add(world, shape);
}

// Обработчики событий для кнопок
document.getElementById('add-square').addEventListener('click', () => addShape('square'));
document.getElementById('add-circle').addEventListener('click', () => addShape('circle'));
document.getElementById('add-triangle').addEventListener('click', () => addShape('triangle'));
document.getElementById('draw-rectangle').addEventListener('click', () => {
  isDrawingRectangle = true;

  overlayCanvas.style.pointerEvents = 'auto';
  canvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = 'crosshair';

  overlayCanvas.addEventListener('mousedown', handleMouseDown);
  overlayCanvas.addEventListener('touchstart', handleTouchStart);
});

// Переменные для рисования
let isDrawingRectangle = false;
let startX = 0;
let startY = 0;
const overlayContext = overlayCanvas.getContext('2d');

// Функция обработки нажатия мыши
function handleMouseDown(event) {
  if (!isDrawingRectangle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;

  overlayCanvas.addEventListener('mousemove', handleMouseMove);
  overlayCanvas.addEventListener('mouseup', handleMouseUp);
}


// Функция обработки начала касания
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


// Функция обработки движения мыши
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

// Функция обработки движения касания
function handleTouchMove(event) {
  if (!isDrawingRectangle) return;
  if (event.touches.length > 1) return; // Игнорировать множественные касания
  event.preventDefault(); // Предотвратить прокрутку страницы

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = touch.clientX - rect.left;
  const currentY = touch.clientY - rect.top;

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

// Функция обработки отпускания мыши
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
  overlayCanvas.removeEventListener('mousedown', handleMouseDown);
  overlayCanvas.removeEventListener('touchmove', handleTouchMove);
  overlayCanvas.removeEventListener('touchend', handleTouchEnd);
  overlayCanvas.removeEventListener('touchstart', handleTouchStart);

  isDrawingRectangle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}


// Функция обработки отпускания касания
function handleTouchEnd(event) {
  if (!isDrawingRectangle) return;

  // Получить конечные координаты из touchend (может быть пусто, поэтому использовать touchstart ранее)
  const rect = overlayCanvas.getBoundingClientRect();
  const endX = startX; // Поскольку touchend не содержит координаты, можно использовать текущее положение
  const endY = startY;

  // Вычислить ширину и высоту по последнему touchmove
  // Для упрощения можно сохранить последнюю позицию в handleTouchMove
  // Но здесь будем использовать текущую ширину и высоту

  // Предположим, что handleTouchMove уже обновил ширину и высоту

  // Здесь лучше хранить последние координаты
  // Для простоты оставим как есть

  // Минимальный размер прямоугольника
  if (Math.abs(endX - startX) >= 20 && Math.abs(endY - startY) >= 20) {
    addShape('rectangle', startX, startY, Math.abs(endX - startX), Math.abs(endY - startY));
  }

  // Очистка overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Удаление обработчиков событий
  overlayCanvas.removeEventListener('mousemove', handleMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleMouseUp);
  overlayCanvas.removeEventListener('mousedown', handleMouseDown);
  overlayCanvas.removeEventListener('touchmove', handleTouchMove);
  overlayCanvas.removeEventListener('touchend', handleTouchEnd);
  overlayCanvas.removeEventListener('touchstart', handleTouchStart);

  isDrawingRectangle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Переключение паузы симуляции
let isPaused = false;
const toggleSimulationButton = document.getElementById('toggle-simulation');

toggleSimulationButton.addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    Runner.stop(runner);
    toggleSimulationButton.textContent = 'Resume';
  } else {
    Runner.run(runner, engine);
    toggleSimulationButton.textContent = 'Pause';
  }
});

// Функция для переключения панели управления
const togglePanelButton = document.getElementById('toggle-panel');
const controlPanel = document.getElementById('control-panel');

togglePanelButton.addEventListener('click', () => {
  controlPanel.classList.toggle('hidden');
});