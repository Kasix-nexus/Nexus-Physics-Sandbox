// main.js

import { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } from 'matter-js';

// Создание engine и world
const engine = Engine.create();
const { world } = engine;

// Улучшение точности физики
engine.positionIterations = 6; // Уменьшение для более стабильной симуляции
engine.velocityIterations = 4; // Уменьшение для более стабильной симуляции

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
  const thickness = 10;
  const width = canvas.width;
  const height = canvas.height;

  const options = {
    isStatic: true,
    restitution: 0.2, // Уменьшенная упругость для границ
    friction: 0.5,    // Увеличенное трение для реалистичных столкновений
    render: { visible: false },
  };

  return [
    Bodies.rectangle(width / 2, thickness / 2, width, thickness, options),
    Bodies.rectangle(width / 2, height - thickness / 2, width, thickness, options),
    Bodies.rectangle(thickness / 2, height / 2, thickness, height, options),
    Bodies.rectangle(width - thickness / 2, height / 2, thickness, height, options),
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

// Ограничение на максимальное количество тел в мире
const MAX_BODIES = 200;

// Функция для добавления фигур
function addShape(type, x = null, y = null, width = null, height = null) {
  // Проверка на максимальное количество тел
  if (world.bodies.length >= MAX_BODIES) {
    // Удаляем самые старые тела, кроме границ и мышиного контрола
    const bodiesToRemove = world.bodies.filter(body => !body.isStatic).slice(0, world.bodies.length - MAX_BODIES + 1);
    World.remove(world, bodiesToRemove);
  }

  if (x === null) x = Math.random() * canvas.width;
  if (y === null) y = Math.random() * (canvas.height / 2);

  let shape;
  const options = {
    restitution: 0.2, // Уменьшенная упругость для фигур
    friction: 0.5,    // Увеличенное трение
    frictionAir: 0.01, // Увеличенное воздушное трение для более плавного движения
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

// Переменные для хранения последних координат касания
let lastTouchX = 0;
let lastTouchY = 0;

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
  controlPanel.classList.toggle('hidden');
});

// Add event listener for the "Draw Circle" button
document.getElementById('draw-circle').addEventListener('click', () => {
  isDrawingCircle = true;

  overlayCanvas.style.pointerEvents = 'auto';
  canvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = 'crosshair';

  overlayCanvas.addEventListener('mousedown', handleCircleMouseDown);
  overlayCanvas.addEventListener('touchstart', handleCircleTouchStart);
});

// Variables for drawing circles
let isDrawingCircle = false;

// Function to handle mouse down for drawing circles
function handleCircleMouseDown(event) {
  if (!isDrawingCircle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;

  overlayCanvas.addEventListener('mousemove', handleCircleMouseMove);
  overlayCanvas.addEventListener('mouseup', handleCircleMouseUp);
}

// Function to handle touch start for drawing circles
function handleCircleTouchStart(event) {
  if (!isDrawingCircle) return;
  if (event.touches.length > 1) return; // Ignore multiple touches

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  startX = touch.clientX - rect.left;
  startY = touch.clientY - rect.top;

  overlayCanvas.addEventListener('touchmove', handleCircleTouchMove);
  overlayCanvas.addEventListener('touchend', handleCircleTouchEnd);
}

// Function to handle mouse move for drawing circles
function handleCircleMouseMove(event) {
  if (!isDrawingCircle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = event.clientX - rect.left;
  const currentY = event.clientY - rect.top;

  const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

  // Clear overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Draw circle
  overlayContext.beginPath();
  overlayContext.arc(startX, startY, radius, 0, Math.PI * 2);
  overlayContext.strokeStyle = 'rgba(0,0,0,0.5)';
  overlayContext.lineWidth = 2;
  overlayContext.stroke();
}

// Function to handle touch move for drawing circles
function handleCircleTouchMove(event) {
  if (!isDrawingCircle) return;
  if (event.touches.length > 1) return; // Ignore multiple touches
  event.preventDefault(); // Prevent page scrolling

  const touch = event.touches[0];
  const rect = overlayCanvas.getBoundingClientRect();
  const currentX = touch.clientX - rect.left;
  const currentY = touch.clientY - rect.top;

  // Save last touch coordinates
  lastTouchX = currentX;
  lastTouchY = currentY;

  const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

  // Clear overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Draw circle
  overlayContext.beginPath();
  overlayContext.arc(startX, startY, radius, 0, Math.PI * 2);
  overlayContext.strokeStyle = 'rgba(0,0,0,0.5)';
  overlayContext.lineWidth = 2;
  overlayContext.stroke();
}

// Function to handle mouse up for drawing circles
function handleCircleMouseUp(event) {
  if (!isDrawingCircle) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const endX = event.clientX - rect.left;
  const endY = event.clientY - rect.top;

  const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

  // Minimum size for circle
  if (radius >= 10) {
    // Add circle to the world
    addShape('circle', startX, startY, radius);
  }

  // Clear overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Remove event listeners
  overlayCanvas.removeEventListener('mousemove', handleCircleMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleCircleMouseUp);
  overlayCanvas.removeEventListener('mousedown', handleCircleMouseDown);
  overlayCanvas.removeEventListener('touchmove', handleCircleTouchMove);
  overlayCanvas.removeEventListener('touchend', handleCircleTouchEnd);
  overlayCanvas.removeEventListener('touchstart', handleCircleTouchStart);

  isDrawingCircle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Function to handle touch end for drawing circles
function handleCircleTouchEnd(event) {
  if (!isDrawingCircle) return;

  // Use saved last touch coordinates
  const endX = lastTouchX;
  const endY = lastTouchY;

  const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

  // Minimum size for circle
  if (radius >= 10) {
    // Add circle to the world
    addShape('circle', startX, startY, radius);
  }

  // Clear overlayCanvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Remove event listeners
  overlayCanvas.removeEventListener('mousemove', handleCircleMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleCircleMouseUp);
  overlayCanvas.removeEventListener('mousedown', handleCircleMouseDown);
  overlayCanvas.removeEventListener('touchmove', handleCircleTouchMove);
  overlayCanvas.removeEventListener('touchend', handleCircleTouchEnd);
  overlayCanvas.removeEventListener('touchstart', handleCircleTouchStart);

  isDrawingCircle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}