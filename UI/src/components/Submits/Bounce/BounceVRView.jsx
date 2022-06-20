import React from 'react';
import { BounceMovie } from './BounceMovie';
import * as THREE from 'three';
import * as ImageUtil from '../../Util/ImageUtil';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from
 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import {BounceSceneGroup} from './BounceSceneGroup';
import {VRMovieController} from '../VRMovieController';

class ControllerPickHelper extends THREE.EventDispatcher { 
   constructor(scene, renderer) {
      super();
      this.raycaster = new THREE.Raycaster();
      this.controllerToObjectMap = new Map();
      this.tempMatrix = new THREE.Matrix4();

      // Create line geometry
      const pointerGeometry = new THREE.BufferGeometry().setFromPoints([
         new THREE.Vector3(0, 0, 0),
         new THREE.Vector3(0, 0, -1),
      ]);
 
      // Array to store controllers
      this.controllers = [];

      // Dispatch controller select event, with controller and object
      const selectListener = (event) => {
         const controller = event.target;
         const selectedObject = this.controllerToObjectMap.get(controller);
         if (selectedObject) {
            this.dispatchEvent({type: event.type, controller, selectedObject});
         }
      };

      // Dispatch controller select end event, with controller
      const endListener = (event) => {
         const controller = event.target;
         this.dispatchEvent({type: event.type, controller});
      };

      // Get controllers, and add models and a selection line
      for (let i = 0; i < 2; ++i) {
         const controller = renderer.xr.getController(i);
         if (i) {
            controller.name = 'rightController';
         } else {
            controller.name = 'leftController';
         }
         controller.addEventListener('select', selectListener);
         controller.addEventListener('selectstart', selectListener);
         controller.addEventListener('selectend', endListener);
         scene.add(controller);

         // Get and add models to controllers
         const controllerModelFactory = new XRControllerModelFactory();
         const controllerGrip = renderer.xr.getControllerGrip(i);
         const model = controllerModelFactory.
          createControllerModel(controllerGrip);
         controllerGrip.add(model);
         scene.add(controllerGrip);
 
         // Create a line for each controller
         const line = new THREE.Line(pointerGeometry);
         line.scale.z = 5;
         controller.add(line);
         this.controllers.push({controller, line});
      }
   }

   _reset() {
      for (const {line} of this.controllers) {
         line.material.color.setHex(0xDDDDDD);
      }
      this.controllerToObjectMap.clear();
   }

   update(pickablesParent) {
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
            line.material.color.setHex(0x00DDDD);
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

   static makeButton(name, color, x) {
      const button = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5));
      button.name = name;
      button.material.color.setHex(color);

      button.position.x = x;
      button.position.y = 0;
      button.position.z = -3;

      return button;
   }

   static makeControlsGroup() {
      const controlsGroup = new THREE.Group();
      controlsGroup.name = 'controlsGroup';

      // Create buttons
      controlsGroup.add(BounceVRView.makeButton('pauseButton', 0xff0000, -1));
      controlsGroup.add(BounceVRView.makeButton('slowButton', 0xffff00, 0));
      controlsGroup.add(BounceVRView.makeButton('playButton', 0x00ff00, 1));

      return controlsGroup;
   }

   // Return state displaying background grid and other fixtures
   // appropriate for |movie|.
   static getInitState(movie) {
      const rigSize = BounceSceneGroup.rigSize;
      const ballRadius = BounceSceneGroup.ballRadius;

      let scene = new THREE.Scene();
      let sceneGroup = new BounceSceneGroup(movie);
      sceneGroup.getSceneGroup().position.set(0, 16, -5);
      scene.add(sceneGroup.getSceneGroup());

      // Full range, square-decay, white light high on near wall in center
      let light = new THREE.PointLight(0xffffff, 1);
      light.position.set(rigSize / 2, rigSize / 2, rigSize / 2);
      light.castShadow = true;
      // Plus general ambient
      scene.add(light).add(new THREE.AmbientLight(0x404040));

      const renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.xr.enabled = true;

      // Create button to initiate a VR session
      const button = VRButton.createButton(renderer);


      const fov = 75;
      const aspect = 2;  // the canvas default
      const near = 0.1;
      const far = 50;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.set(0, 1.6, 0);

      // Create VR movie controller
      const movieController = new VRMovieController(movie, (offset) => {
         sceneGroup.setOffset(offset);
      });

      // Group to contain control objects
      const controlsGroup = BounceVRView.makeControlsGroup();
      scene.add(controlsGroup);

      // Map of buttons to VRMovieController methods
      const functionMap = {
         'pauseButton': () => {
            movieController.pause();
         },
         'slowButton': () => {
            movieController.play(0.5);
         },
         'playButton': () => {
            movieController.play(1);
         }
      };

      // Create controller helper
      const controllerHelper = new ControllerPickHelper(scene, renderer);
      const controllerToSelection = new Map();

      // Event listener to trigger function based on object selected
      controllerHelper.addEventListener('selectstart', (event) => {
         const {controller, selectedObject} = event;
         const existingSelection = controllerToSelection.get(controller);
         if (!existingSelection) {
            controllerToSelection.set(controller, selectedObject);
            functionMap[selectedObject.name]();
         }
      });

      controllerHelper.addEventListener('selectend', (event) => {
         const {controller} = event;
         const selection = controllerToSelection.get(controller);
         if (selection) {
            controllerToSelection.delete(controller);
         }
      });

      return {
         scene,
         sceneGroup,
         camera,
         renderer,
         controllerHelper,
         controlsGroup,
         button,
         movieController,
         movie
      };
   }

   componentDidMount() {
      const width = this.mount.clientWidth;
      const height = this.mount.clientHeight;

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
      state.movieController.animate(time);
      state.controllerHelper.update(state.controlsGroup);

      state.renderer.render(state.scene, state.camera);
   }

   render() {
      this.state.renderer.render(this.state.scene, this.state.camera);
      return (
         <div
            style={{height: "600px", width: "100%", position: 'relative'}}
            ref={(mount) => {
               this.mount = mount;
            }}
         ></div>
      )
   }
}