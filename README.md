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
- React (component mounting, frame rendering)
  - Component mounting
  - Frame rendering
- Git/GitHub workflows
  - Merge conflicts and resolution
  - GitHub issues, assigning and resolving
- General programming techniques
  - Working with a large codebase written by other people
  - Use of AI as an assistant, not for writing code for me, but for:
    - Examples of relevant Three.js code
    - Narrowing down bug possibilities
    - Code restructuring
    - Assisting in code documenting

While I can't share the whole project, I can share all of the files I wrote
myself, and I will give a description of the project structure to give an idea
of how my code fitted in.

## Description

`PhysicsCompetition` is a tool designed to assist in learning and demonstrating
knowledge visually and satisfyingly in a high-school level class. The teacher
could assign physics problems as homework, or create teams of students as a
competition.

There were three types of physics problem, of which I mostly worked on:

_Bounce_: A ball is fired from a cannon, and the students must calculate the
required exit velocity of the cannonball to bounce off of certain platforms
in the shortest time and number of cannon shots. Once a platform was hit,
it would retract so that it couldn't be hit again in that attempt.
