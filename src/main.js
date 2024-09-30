import { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } from 'matter-js';

// Create the engine and world
const engine = Engine.create();
const { world } = engine;

// Get canvas elements
const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('overlay-canvas');

// Set canvas sizes
const setCanvasSize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
};
setCanvasSize();

// Create the renderer
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

// Create the runner
const runner = Runner.create();
Runner.run(runner, engine);

// Function to create boundaries that match the window edges
const createBoundaries = () => {
  const thickness = 50;
  const width = canvas.width;
  const height = canvas.height;

  return [
    // Top boundary
    Bodies.rectangle(width / 2, -thickness / 2, width, thickness, {
      isStatic: true,
      render: { visible: false },
    }),
    // Bottom boundary
    Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, {
      isStatic: true,
      render: { visible: false },
    }),
    // Left boundary
    Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
      isStatic: true,
      render: { visible: false },
    }),
    // Right boundary
    Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
      isStatic: true,
      render: { visible: false },
    }),
  ];
};

let boundaries = createBoundaries();
World.add(world, boundaries);

// Handle window resize
window.addEventListener('resize', () => {
  setCanvasSize();

  // Update renderer dimensions
  render.options.width = canvas.width;
  render.options.height = canvas.height;
  render.canvas.width = canvas.width;
  render.canvas.height = canvas.height;

  // Update render bounds
  render.bounds.max.x = canvas.width;
  render.bounds.max.y = canvas.height;

  // Update boundaries
  World.remove(world, boundaries);
  boundaries = createBoundaries();
  World.add(world, boundaries);
});

// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false },
  },
});
World.add(world, mouseConstraint);

// Function to get a random color
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#1A535C', '#FFE66D', '#FFB5A7', '#6BFFB0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Function to add shapes
const addShape = (type, x = null, y = null, width = null, height = null) => {
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
};

// Button event listeners
document.getElementById('add-square').addEventListener('click', () => addShape('square'));
// Убрана строка для Add Rectangle
document.getElementById('add-circle').addEventListener('click', () => addShape('circle'));
document.getElementById('add-triangle').addEventListener('click', () => addShape('triangle'));

// Toggle simulation pause/resume
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

// Drawing rectangle functionality
let isDrawingRectangle = false;
let startX = 0;
let startY = 0;
const overlayContext = overlayCanvas.getContext('2d');

document.getElementById('draw-rectangle').addEventListener('click', () => {
  isDrawingRectangle = true;

  overlayCanvas.style.pointerEvents = 'auto';
  canvas.style.pointerEvents = 'none';
  overlayCanvas.style.cursor = 'crosshair';

  overlayCanvas.addEventListener('mousedown', handleMouseDown);
});

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

  // Clear the overlay canvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Draw the square
  const size = Math.min(Math.abs(width), Math.abs(height));
  overlayContext.beginPath();
  overlayContext.rect(startX, startY, size, size);
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

  const size = Math.min(Math.abs(width), Math.abs(height));
  const centerX = startX + size / 2;
  const centerY = startY + size / 2;

  if (size >= 20) {
    // Add the square to the world
    addShape('square', centerX, centerY, size, size);
  }

  // Clear the overlay canvas
  overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Remove event listeners
  overlayCanvas.removeEventListener('mousemove', handleMouseMove);
  overlayCanvas.removeEventListener('mouseup', handleMouseUp);
  overlayCanvas.removeEventListener('mousedown', handleMouseDown);

  isDrawingRectangle = false;

  overlayCanvas.style.cursor = 'default';
  overlayCanvas.style.pointerEvents = 'none';
  canvas.style.pointerEvents = 'auto';
}

// Toggle control panel visibility
const togglePanelButton = document.getElementById('toggle-panel');
const controlPanel = document.getElementById('control-panel');

togglePanelButton.addEventListener('click', () => {
  controlPanel.classList.toggle('hidden');
});
