# PhysicsCompetition Contributions

This repo contains my contributions to a project I worked on through the Summer
of 2022. Throughout this project, over a total of 400 hours programming, I
learned/improved these skills:

- Programming using Javascript - this was my first experience with Javascript,
  and I got to know it quite well by the end!
  - Classes
  - Modules
  - Lambda functions
  - Working with complex `json` files
  - Promises
- Three.js
  - Types of Three.js geometry, of note:
    - `LatheGeometry`
    - `ExtrudeGeometry`
  - PRB materials
    - Three.js's `MeshLambertMaterial`
  - UV mapping/remapping
  - Asynchronous textuure material loading/application
  - Basic (kind of) virtual space design
- Developing for VR
  - WebXR/Three.js's `WebXRManager`
  - Graphics optimisation
  - [`three-mesh-ui`](https://github.com/felixmariotto/three-mesh-ui) (a library for creating VR user interfaces) and basic UI design
  - Raycasting (for VR controller pointer)
- React
  - Component mounting
  - Frame rendering
- Git/GitHub workflows
  - Merge conflicts and resolution
  - GitHub issues, assigning and resolving
- General programming techniques
  - Working with other programmers
    - Working within a large codebase written by other people
    - Learning and following existing code formatting styles
  - Bugs
    - Use of debugging tools
      - Breakpoints
      - Watching variables/objects
    - Identifying and improving legibility of code and documentation
  - Use of AI as an assistant, not for writing code for me, but for:
    - Examples of relevant Three.js code
    - Narrowing down bug possibilities
    - Code restructuring
    - Assisting in code documenting

While I can't share the whole project, I can share all of the files I wrote
myself, and I will give a description of the project structure to give an idea
of how my code fitted in.

## Project description

`PhysicsCompetition` is a tool designed to assist in learning and demonstrating
knowledge visually and satisfyingly in a high-school level class. The teacher
could assign physics problems as homework, or create teams of students as a
competition.

There were three types of physics problem, and I mostly worked on:

_Bounce_: A ball is fired from a cannon, and the students must calculate the
required exit velocity of the cannonball to bounce off of certain platforms
in the shortest time and number of cannon shots. Once a platform was hit,
it would retract so that it couldn't be hit again in that attempt. The values
that the students had to submit were:

- The velocity of the ball when leaving the barrel
- The X and Y coordinates where the ball would leave the frame (which would
  either be on the far right side, or falling out of the bottom of frame)
- The time that the ball exits the frame

When I joined the project, there were two ways to view the results of your
submission in real time: an SVG animation that showed the path the ball took
along with the coordinates of each obstacle hit, or a 3D view using Three.js
and PBR materials. I added a third view to that, enabling a 3D view to be
opened in a headset like the Oculus/Meta Quest 2 by just visiting the
web page and pressing a button.

### Project structure

The project had three main components:

- the REST server, which would handle queries to the SQL database for previous
  submissions and results,
- the Evaluation Client, a physics engine written in Java with the task of
  handling all relevant calculations of ball physics and providing a "movie" of
  frames for the ball's movement, and
- the web ui frontend, which would provide the website the students would
  access, and handle displaying the SVG or Three.js views of the competition.

## My roles in the project

I had two main roles to play in the developoment of this project:

- to redesign the currently existing Three.js environment being used for the
  Bounce competition 3D view to be more visually pleasing, while refactoring
  and cleaning up relevant code, and
- to add a third view, VR, based on the existing 3D view, and deal with any
  design or code changes related to this.

### Environment redesign

My first job, after reading through relevant parts of the codebase to become
accustomed to how the product functioned, was to redesign the 3D room that the
Bounce 3D View displayed in. At the time, it was a square room with simple
concrete PBR textures on the walls, and a floating vertical 10m $`\times`$ 10m
steel slab in the centre of the room as the backdrop of the simulation. The
ball and obstacles all used the same steel texture, and the lighting was from a
single point source at the top of the room.

My brief for the redesign was to go with a more steampunk feel, with some
material suggestions and design ideas being:

- Brick
- Dark wood
- Brass
- Warehouse-feel

Up until this point, all of this scene creation code had been inside of
`UI/src/components/Submits/Bounce/Bounce3DView.jsx`, and was taking up the
majority of the file, so I moved it out to `BounceSceneGroup.js`, and organised
the whole file into smaller functions to reduce repetition, and I tried to keep
each function under 100 lines.

### VR support

## File and directory descriptions

Here is a description of the purpose of each file and directory in this repo
(ignoring irrelevant files in `Sandbox/`):

### `Docs/Oculus/`

Documentation files for all of my work and research into implementing VR
support for PhysicsCompetiton, specifically geared towards use with an
Oculus Quest 2 (now called Meta Quest 2) or similar headset, but also
investigating support for other headsets.

#### ``
