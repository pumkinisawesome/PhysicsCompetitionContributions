import * as THREE from 'three';
import {VRButton} from 'VRButton';
import {ControllerPickHelper} from './ControllerPickHelper.js';



function main() {
   const canvas = document.querySelector('#c');
   const renderer = new THREE.WebGLRenderer({canvas});
   renderer.xr.enabled = true;
   document.body.appendChild(VRButton.createButton(renderer));

   const fov = 75;
   const aspect = 2;  // the canvas default
   const near = 0.1;
   const far = 50;
   const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
   camera.position.set(0, 1.6, 0);

   const scene = new THREE.Scene();
   // object to put pickable objects on so we can easily
   // separate them from non-pickable objects
   const pickRoot = new THREE.Object3D();
   scene.add(pickRoot);

   const controllerHelper = new ControllerPickHelper(scene, renderer);
   const controllerToSelection = new Map();

   controllerHelper.addEventListener('selectstart', (event) => {
      const {controller, selectedObject} = event;
      const existingSelection = controllerToSelection.get(controller);
      if (!existingSelection) {
         controllerToSelection.set(controller, {
            object: selectedObject,
            parent: selectedObject.parent,
         });
         controller.attach(selectedObject);
      }
   });

   controllerHelper.addEventListener('selectend', (event) => {
      const {controller} = event;
      const selection = controllerToSelection.get(controller);
      if (selection) {
         controllerToSelection.delete(controller);
         selection.parent.attach(selection.object);
      }
   });

   {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
   }


   const boxWidth = 1;
   const boxHeight = 1;
   const boxDepth = 1;
   const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

   function makeInstance(geometry, color, x) {
      const material = new THREE.MeshPhongMaterial({color});

      const cube = new THREE.Mesh(geometry, material);
      pickRoot.add(cube);

      cube.position.x = x;
      cube.position.y = 1.6;
      cube.position.z = -2;

      return cube;
   }

   const cubes = [
      makeInstance(geometry, 0x44aa88,  0),
      makeInstance(geometry, 0x8844aa, -2),
      makeInstance(geometry, 0xaa8844,  2),
   ];

   function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
         renderer.setSize(width, height, false);
      }
      return needResize;
   }

   function render(time) {
      time = 0.001 * time;
      

      if (resizeRendererToDisplaySize(renderer)) {
         const canvas = renderer.domElement;
         camera.aspect = canvas.clientWidth / canvas.clientHeight;
         camera.updateProjectionMatrix();
      }

      cubes.forEach((cube, ndx) => {
         const speed = 1 + ndx * .1;
         const rot = time * speed;
         cube.rotation.x = rot;
         cube.rotation.y = rot;
      });

      controllerHelper.update(pickRoot, time);

      renderer.render(scene, camera);
   }

   renderer.setAnimationLoop(render);
}

main();