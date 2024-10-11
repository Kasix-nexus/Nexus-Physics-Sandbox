import { Composite, Body, Common } from 'matter-js';
import { world, mouseConstraint } from './main.js';

const commandHistory = [];

const consoleCommands = {
  'command.example.hello': () => {
    commandHistory.push('command.example.hello');
    return 'Hello World';
  },
  'print.log': (args = []) => {
    const message = args.join(' ');
    console.log(message);
    return message || '';
  },
  
  'help': () => {
    return "This Faestro is the console in the Nexus Physics Sandbox. With Faestro you can manipulate NPS FULLY! From beta functions to things that don't have an interface at the moment.";
  },

  'scene.save': () => {
    const bodies = Composite.allBodies(world);
    const sceneData = bodies.map(body => ({
      position: body.position,
      velocity: body.velocity,
      angle: body.angle,
      angularVelocity: body.angularVelocity,
      vertices: body.vertices.map(v => ({ x: v.x, y: v.y })),
      isStatic: body.isStatic,
      restitution: body.restitution,
      friction: body.friction,
      density: body.density,
      render: body.render
    }));

    const blob = new Blob([JSON.stringify(sceneData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return 'Scene saved as scene.json';
  },

  'scene.load': () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const sceneData = JSON.parse(event.target.result);
            Composite.clear(world, false, true);

            sceneData.forEach(bodyData => {
              const body = Body.create({
                position: bodyData.position,
                velocity: bodyData.velocity,
                angle: bodyData.angle,
                angularVelocity: bodyData.angularVelocity,
                vertices: bodyData.vertices,
                isStatic: bodyData.isStatic,
                restitution: bodyData.restitution,
                friction: bodyData.friction,
                density: bodyData.density,
                render: bodyData.render
              });
              Composite.add(world, body);
            });

            Composite.add(world, mouseConstraint);

            console.log('Scene loaded successfully!');
          } catch (error) {
            console.error('Error loading scene:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    return 'Select a scene file to load';
  },

  'print.history': () => {
    console.log('Command History:', commandHistory.join(', '));
    return commandHistory.join(', ');
  }
};

export function executeCommand(command) {
  commandHistory.push(command);
  const [cmd, ...args] = command.split(' ');
  
  if (cmd in consoleCommands) {
    try {
      const result = consoleCommands[cmd](args);
      return result;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  } else {
    return 'Unknown command';
  }
}
