import React from 'react';
import { BounceMovie } from './BounceMovie';
import * as THREE from 'three';
import * as ImageUtil from '../../Util/ImageUtil';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from
 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {BounceSceneGroup} from './BounceSceneGroup';

class ControllerPickHelper extends THREE.EventDispatcher {
   constructor(scene, renderer) {
      super();
      this.raycaster = new THREE.Raycaster();
      this.objectToColorMap = new Map();
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
         const model = controllerModelFactory.
          createControllerModel(controllerGrip);
         controllerGrip.add(model);
         scene.add(controllerGrip);
 
         const line = new THREE.Line(pointerGeometry);
         line.scale.z = 5;
         controller.add(line);
         this.controllers.push({controller, line});
      }
   }

   _reset() {
      // restore the colors
      this.objectToColorMap.forEach((color, object) => {
         object.material.emissive.setHex(color);
      });
      this.objectToColorMap.clear();
      this.controllerToObjectMap.clear();
   }

   update(pickablesParent, time) {
      this._reset();
      for (const {controller, line} of this.controllers) {
         // cast a ray through the from the controller
         this.tempMatrix.identity().extractRotation(controller.matrixWorld);
         this.raycaster.ray.origin.setFromMatrixPosition(controller
          .matrixWorld);
         this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(this
          .tempMatrix);
         // get the list of objects the ray intersected
         const intersections = this.raycaster.intersectObjects(pickablesParent
          .children);
         if (intersections.length) {
            const intersection = intersections[0];
            // make the line touch the object
            line.scale.z = intersection.distance;
            // pick the first object. It's the closest one
            const pickedObject = intersection.object;
            // save which object this controller picked
            this.controllerToObjectMap.set(controller, pickedObject);
            // highlight the object if we haven't already
            if (this.objectToColorMap.get(pickedObject) === undefined) {
               // save its color
               this.objectToColorMap.set(pickedObject,
                pickedObject.material.emissive.getHex());
               // set its emissive color to flashing red/yellow
               pickedObject.material.emissive.setHex((time * 8)
                % 2 > 1 ? 0xFF2000 : 0xFF0000);
            }
         } else {
            line.scale.z = 5;
         }
      }
   }
}

export class BounceVRView extends React.Component {
   // Props are: {
   //    movie: movie to display
   // }
   constructor(props) {
      super(props);

      this.state = BounceVRView.getInitState(props.movie);
   }

   // Return state displaying things
   static getInitState(movie) {
      const rigSize = BounceSceneGroup.rigSize;
      let scene = new THREE.Scene();
      let sceneGroup = new BounceSceneGroup(movie);
      sceneGroup.getSceneGroup().position.set(0, 0, -15);
      scene.add(sceneGroup.getSceneGroup());

      // Full range, square-decay, white light high on near wall in center
      let light = new THREE.PointLight(0xffffff, 1);
      light.position.set(rigSize / 2, rigSize / 2, rigSize / 2);
      light.castShadow = true;
      // Plus general ambient
      scene.add(light).add(new THREE.AmbientLight(0x404040));

      const renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.xr.enabled = true;
      const button = VRButton.createButton(renderer);


      const fov = 75;
      const aspect = 2;  // the canvas default
      const near = 0.1;
      const far = 50;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.set(0, 1.6, 0);

      // // object to put pickable objects on so we can easily
      // // separate them from non-pickable objects
      // const pickRoot = new THREE.Object3D();
      // scene.add(pickRoot);

      // const controllerHelper = new ControllerPickHelper(scene, renderer);
      // const controllerToSelection = new Map();

      // controllerHelper.addEventListener('selectstart', (event) => {
      //    const {controller, selectedObject} = event;
      //    const existingSelection = controllerToSelection.get(controller);
      //    if (!existingSelection) {
      //       controllerToSelection.set(controller, {
      //          object: selectedObject,
      //          parent: selectedObject.parent,
      //       });
      //       controller.attach(selectedObject);
      //    }
      // });

      // controllerHelper.addEventListener('selectend', (event) => {
      //    const {controller} = event;
      //    const selection = controllerToSelection.get(controller);
      //    if (selection) {
      //       controllerToSelection.delete(controller);
      //       selection.parent.attach(selection.object);
      //    }
      // });

      // {
      //    const color = 0xFFFFFF;
      //    const intensity = 1;
      //    const light = new THREE.DirectionalLight(color, intensity);
      //    light.position.set(-1, 2, 4);
      //    scene.add(light);
      // }


      // const boxWidth = 1;
      // const boxHeight = 1;
      // const boxDepth = 1;
      // const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

      // function makeInstance(geometry, color, x) {
      //    const material = new THREE.MeshPhongMaterial({color});
   
      //    const cube = new THREE.Mesh(geometry, material);
      //    pickRoot.add(cube);
   
      //    cube.position.x = x;
      //    cube.position.y = 1.6;
      //    cube.position.z = -2;
   
      //    return cube;
      // }

      // const cubes = [
      //    makeInstance(geometry, 0x44aa88,  0),
      //    makeInstance(geometry, 0x8844aa, -2),
      //    makeInstance(geometry, 0xaa8844,  2),
      // ];











      return {
         scene,
         sceneGroup,
         // rig,
         camera,
         renderer,
         // cubes,
         // controllerHelper,
         // pickRoot,
         button,
         // ball,
         // targets: [],  // Array of target scene elements indexed by trg id
         // evtIdx: -1,
         movie
      };
   }

   componentDidMount() {
      const width = this.mount.clientWidth;
      const height = this.mount.clientHeight;
      let rigSize = BounceSceneGroup.rigSize;

      this.state.renderer.setSize(width, height);

      this.state.camera.aspect = width / height;
      this.state.camera.updateProjectionMatrix();
      this.mount.appendChild(this.state.renderer.domElement);

      this.state.renderer.setAnimationLoop(time => {
         BounceVRView.renderFrame(time, this.state);
      });

      this.mount.appendChild(this.state.button);
   }

   componentWillUnmount() {
      this.state.button.remove();
   }

   static resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
         renderer.setSize(width, height, false);
      }
      return needResize;
   }

   static renderFrame(time, state) {
      // time = 0.001 * time;

      // if (BounceVRView.resizeRendererToDisplaySize(state.renderer)) {
      //    const canvas = state.renderer.domElement;
      //    state.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      //    state.camera.updateProjectionMatrix();
      // }

      // state.cubes.forEach((cube, ndx) => {
      //    const speed = 1 + ndx * .1;
      //    const rot = time * speed;
      //    cube.rotation.x = rot;
      //    cube.rotation.y = rot;
      // });

      // state.controllerHelper.update(state.pickRoot, time);

      state.renderer.render(state.scene, state.camera);
   }

   render() {
      this.state.renderer.render(this.state.scene, this.state.camera);
      return (
         <div
            style={{height: "600px", width: "100%"}}
            ref={(mount) => {
               this.mount = mount;
            }}
         ></div>
      )
   }
}