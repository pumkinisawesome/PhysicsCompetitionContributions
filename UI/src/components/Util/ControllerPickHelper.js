import * as THREE from 'three';
import { XRControllerModelFactory } from
 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export class ControllerPickHelper extends THREE.EventDispatcher { 
   constructor(parent, renderer) {
      super();
      this.parent = parent;
      this.renderer = renderer;

      this.raycaster = new THREE.Raycaster();
      this.controllerToObjectMap = new Map();
      this.tempMatrix = new THREE.Matrix4();

      // Create line geometry
      const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(0, 0, 0),
         new THREE.Vector3(0, 0, -1)
      ]);
 
      // // Array to store controllers
      // this.controllers = [];

      // // Dispatch controller select event, with controller and object
      // const selectListener = (event) => {
      //    const controller = event.target;
      //    const selectedObject = this.controllerToObjectMap.get(controller);
      //    if (selectedObject) {
      //       this.dispatchEvent({type: event.type, controller, selectedObject});
      //    }
      // };

      // // Dispatch controller select end event, with controller
      // const endListener = (event) => {
      //    const controller = event.target;
      //    this.dispatchEvent({type: event.type, controller});
      // };

      // Get controllers, and add models and a selection line

      // Get right controller
      // const controller = renderer.xr.getController(0); // Right is 0
      // controller.name = 'rightController';
      // parent.add(controller);
      
      // // Create a line for each controller
      // const line = new THREE.Line(pointerGeometry);
      // line.scale.z = 5;
      // controller.add(line);
      
      // // Get and add models to controllers
      // const controllerModelFactory = new XRControllerModelFactory();
      // const controllerGrip = renderer.xr.getControllerGrip(0);
      // const model = controllerModelFactory.
      //  createControllerModel(controllerGrip);
      // controllerGrip.add(model);
      // parent.add(controllerGrip);

      // this.controllers.push({controller, controllerGrip, line});





      // Create right controller

      for (let i = 0; i < 2; i++) {
         const controller = this.getControllerFromIndex(i);

         controller.controller.addEventListener('connected', (event) => {
            console.log(event.data.handedness);
            if (event.data.handedness === 'right') {
               this.rightController = controller;

               // Add line
               const line = new THREE.Line(pointerGeometry);
               line.material.color.setHex(0xDDDDDD);
               line.scale.z = 0.5;
               this.rightController.controller.add(line);
               this.rightController.line = line;
            }
            else {
               this.leftController = controller;
               this.dispatchEvent({
                  type: 'leftControllerConnected',
                  controllerGrip: controller.controllerGrip
               });
            }
         });
      }
      // this.rightController = this.getController(1); // right is 0
      // console.log(this.rightController);

      // // Add line
      // const line = new THREE.Line(pointerGeometry);
      // line.scale.z = 5;
      // this.rightController.controller.add(line);
      // this.rightController.line = line;

      // // Create left controller
      // this.leftController = this.getController(0);  // left is 1
      // console.log(this.leftController);

      // // Create html gui to control scene
      // const gui = new GUI({width: 200});
      // gui.add(guiPrms, 'pause');
      // gui.add(guiPrms, 'slow');
      // gui.add(guiPrms, 'play');
      // gui.domElement.style.visibility = 'hidden';
      
      // // Interactive group to hold GUI, attached to left controller
      // const guiGroup = new InteractiveGroup(renderer, camera);
      // parent.add(guiGroup);
      // // controllerHelper.controllers[1].controller.add(guiGroup);
      // // console.log(controllerHelper.controllers[1].controller);

      // // HTML mesh to hold gui
      // const guiMesh = new HTMLMesh(gui.domElement);
      // guiMesh.rotation.x = -Math.PI / 3
      // guiMesh.rotation.y = Math.PI / 8;
      // guiGroup.add(guiMesh);
      // // guiMesh.position.x = 0;
      // // guiMesh.position.y += 1;
      // // guiMesh.position.z = -1.5;
      // guiMesh.position.set(0, 0, -0.2);

      // console.log(guiMesh);

      // this.leftController.controllerGrip.add(guiGroup);
   }

   getControllerFromIndex(index) {
      const controller = this.renderer.xr.getController(index);
      this.parent.add(controller);

      const controllerGrip = this.renderer.xr.getControllerGrip(index);
      this.parent.add(controllerGrip);

      // const controllerModelFactory = new XRControllerModelFactory();
      // const model = controllerModelFactory.
      //  createControllerModel(controllerGrip);
      // controllerGrip.add(model);

      return {controller, controllerGrip};
   }

   _reset() {
      this.rightController.line.material.color.setHex(0xDDDDDD);
      this.controllerToObjectMap.clear();
   }

   update(pickablesParent) {
      this._reset();
      const {controller, line} = this.rightController;
      // cast a ray through the from the controller
      this.tempMatrix.identity().extractRotation(controller.matrixWorld);
      this.raycaster.ray.origin.setFromMatrixPosition(
       controller.matrixWorld);
      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(
       this.tempMatrix);
      // get the list of objects the ray intersected
      const intersections = this.raycaster.intersectObjects(
       pickablesParent.children);
      if (intersections.length) {
         const intersection = intersections[0];
         // make the line touch the object
         line.scale.z = intersection.distance;
         // pick the first object. It's the closest one
         const pickedObject = intersection.object;
         // save which object this controller picked
         this.controllerToObjectMap.set(controller, pickedObject);
         // Set line to flashing red/yellow
         line.material.color.setHex(0x00DDDD);
      } else {
         line.scale.z = 5;
      }
   }
}