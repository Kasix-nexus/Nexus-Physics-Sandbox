import { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint, Events } from 'matter-js';

// Создаем движок
const engine = Engine.create();
const { world } = engine;

// Получаем canvas
const canvas = document.getElementById('canvas');

// Рендеринг
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

Render.run(render);

// Запускаем движок
const runner = Runner.create();
Runner.run(runner, engine);

// Функция для обновления размеров canvas
const resizeCanvas = () => {
  render.bounds.max.x = window.innerWidth;
  render.bounds.max.y = window.innerHeight;
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  // Обновляем границы
  World.remove(world, boundaries);
  boundaries.length = 0;
  
  boundaries.push(
    Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 20, window.innerWidth, 40, { isStatic: true }),
    Bodies.rectangle(window.innerWidth / 2, -20, window.innerWidth, 40, { isStatic: true }),
    Bodies.rectangle(-20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
    Bodies.rectangle(window.innerWidth + 20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true })
  );
  
  World.add(world, boundaries);
};

// Обработчик изменения размера окна
window.addEventListener('resize', resizeCanvas);

// Добавляем границы
let boundaries = [
  Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 20, window.innerWidth, 40, { isStatic: true }),
  Bodies.rectangle(window.innerWidth / 2, -20, window.innerWidth, 40, { isStatic: true }),
  Bodies.rectangle(-20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
  Bodies.rectangle(window.innerWidth + 20, window.innerHeight / 2, 40, window.innerHeight, { isStatic: true }),
];
World.add(world, boundaries);

// Добавляем обработку мыши
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

// Удаляем неправильный обработчик afterRender
// Events.on(render, 'afterRender', () => {
//   mouse.position.x = render.mouse.position.x;
//   mouse.position.y = render.mouse.position.y;
// });

// Функции для добавления объектов с случайной позицией и цветом
const addShape = (type) => {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight / 2;
  
  let shape;
  
  switch(type) {
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

// Функция для генерации случайного цвета
const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#1A535C', '#FFE66D', '#FFB5A7', '#6BFFB0'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Добавление событий для кнопок
document.getElementById('add-square').addEventListener('click', () => addShape('square'));
document.getElementById('add-circle').addEventListener('click', () => addShape('circle'));
document.getElementById('add-triangle').addEventListener('click', () => addShape('triangle'));
