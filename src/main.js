import { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } from 'matter-js';

// Create the engine
const engine = Engine.create();
const { world } = engine;

// Get the canvas
const canvas = document.getElementById('canvas');

// Create the renderer
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: '#f0f0f0',
  },
});

// Run the renderer
Render.run(render);

// Create the runner
const runner = Runner.create();
Runner.run(runner, engine);

// Function to update canvas size
const resizeCanvas = () => {
  render.bounds.max.x = window.innerWidth;
  render.bounds.max.y = window.innerHeight;
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  // Update boundaries
  World.remove(world, boundaries);
  boundaries = [
    Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 20, window.innerWidth, 40, { isStatic: true }),
    Bodies.rectangle(window.innerWidth / 2, -20, window.innerWidth, 40, { isStatic: true }),
    Bodies.rectangle(-20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
    Bodies.rectangle(window.innerWidth + 20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
  ];
  World.add(world, boundaries);
};

// Handle window resize with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 200);
});

// Add boundaries
let boundaries = [
  Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 20, window.innerWidth, 40, { isStatic: true }),
  Bodies.rectangle(window.innerWidth / 2, -20, window.innerWidth, 40, { isStatic: true }),
  Bodies.rectangle(-20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
  Bodies.rectangle(window.innerWidth + 20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
];
World.add(world, boundaries);

// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false,
    },
  },
});
World.add(world, mouseConstraint);

// Ensure the mouse is updated on every tick
render.mouse = mouse;

// Function to add shapes with random position and color
const addShape = (type) => {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * (window.innerHeight / 2);

  let shape;

  switch (type) {
    case 'square':
      shape = Bodies.rectangle(x, y, 80, 80, {
        render: {
          fillStyle: getRandomColor(),
        },
      });
      break;
    case 'circle':
      shape = Bodies.circle(x, y, 40, {
        render: {
          fillStyle: getRandomColor(),
        },
      });
      break;
    case 'triangle':
      shape = Bodies.polygon(x, y, 3, 50, {
        render: {
          fillStyle: getRandomColor(),
        },
      });
      break;
    default:
      return;
  }

  World.add(world, shape);
};

// Function to generate a random color
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#1A535C', '#FFE66D', '#FFB5A7', '#6BFFB0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Add event listeners to buttons
document.getElementById('add-square').addEventListener('click', () => addShape('square'));
document.getElementById('add-circle').addEventListener('click', () => addShape('circle'));
document.getElementById('add-triangle').addEventListener('click', () => addShape('triangle'));

// Toggle control panel visibility
const togglePanelButton = document.getElementById('toggle-panel');
const controlPanel = document.getElementById('control-panel');

togglePanelButton.addEventListener('click', () => {
  controlPanel.classList.toggle('hidden');
});

// Variable to track pause state
let isPaused = false;

// Toggle simulation pause/resume
const toggleSimulationButton = document.getElementById('toggle-simulation');

toggleSimulationButton.addEventListener('click', () => {
  isPaused = !isPaused;
  engine.timing.timeScale = isPaused ? 0 : 1;
  toggleSimulationButton.textContent = isPaused ? 'Resume' : 'Pause';
});
