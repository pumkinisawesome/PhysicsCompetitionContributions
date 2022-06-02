import * as THREE from 'three';
import { XRControllerModelFactory } from 'XRControllerModelFactory';

class ControllerPickHelper extends THREE.EventDispatcher {
   constructor(scene, renderer) {
      super();
      this.raycaster = new THREE.Raycaster();
      // this.objectToColorMap = new Map();
      this.controllerToObjectMap = new Map();
      this.tempMatrix = new THREE.Matrix4();

      const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(0, 0, 0),
         new THREE.Vector3(0, 0, -1),
      ]);
 
      this.controllers = [];

      const selectListener = (event) => {
         const controller = event.target;
         const selectedObject = this.controllerToObjectMap.get(controller);
         if (selectedObject) {
            this.dispatchEvent({type: event.type, controller, selectedObject});
         }
      };

      const endListener = (event) => {
         const controller = event.target;
         this.dispatchEvent({type: event.type, controller});
      };

      for (let i = 0; i < 2; ++i) {
         const controller = renderer.xr.getController(i);
         controller.addEventListener('select', selectListener);
         controller.addEventListener('selectstart', selectListener);
         controller.addEventListener('selectend', endListener);
         scene.add(controller);

         const controllerModelFactory = new XRControllerModelFactory();
         const controllerGrip = renderer.xr.getControllerGrip(i);
         const model = controllerModelFactory
          .createControllerModel( controllerGrip );
         controllerGrip.add( model );
         scene.add( controllerGrip );
 
         const line = new THREE.Line(pointerGeometry);
         line.scale.z = 5;
         controller.add(line);
         this.controllers.push({controller, line});
      }
   }

   _reset() {
      for (const {line} of this.controllers) {
         line.material.color.setHex(0xFFFFFF);
      }
   }

   update(pickablesParent, time) {
      this._reset();
      for (const {controller, line} of this.controllers) {
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
            line.material.color.setHex(
             (time * 8) % 2 > 1 ? 0xFFAA00 : 0xFF0000);
         } else {
            line.scale.z = 5;
         }
      }
   }
}

export { ControllerPickHelper };