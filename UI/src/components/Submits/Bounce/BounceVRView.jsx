import React from 'react';
import {BounceMovie} from './BounceMovie';
import * as THREE from "three";
import CameraControls from "camera-controls";
import {VRButton} from 'three/examples/jsm/webxr/VRButton.js';
import {BounceSceneGroup} from './BounceSceneGroup';
import {VRMovieController} from '../VRMovieController';
import VRControl from '../../Util/VRControl';
import ThreeMeshUI from 'three-mesh-ui';
import FontJSON from '../../../assets/fonts/Roboto-msdf.json';
import FontImage from '../../../assets/fonts/Roboto-msdf.png';
import { Vector3 } from 'three';

// Display a room with a "rig" on one wall.  The rig has the launcher, targets,
// obstacles, and ball.  All 3JS units are meters.
export class BounceVRView extends React.Component {
   // Is the controller selecting?
   static selected = false;

   // Props are: {
   //    movie: movie to display
   // }
   constructor(props) {
      super(props);

      this.state = BounceVRView.getInitState(props.movie);
   }

   // Return state displaying background grid and other fixtures
   // appropriate for |movie|.  
   static getInitState(movie) { 
      const {roomWidth, roomDepthVR, balconyHeight}
       = BounceSceneGroup;

      const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 50);
      camera.position.set(0, 1.6, 0); // Approximate position of viewers head
      const listener = new THREE.AudioListener();
      camera.add(listener);

      let scene = new THREE.Scene();
      let sceneGroup = new BounceSceneGroup(movie, true, listener);
      scene.add(sceneGroup.getSceneGroup());

      BounceVRView.makeLights(scene, 0xFFECE1, sceneGroup.roomDepth);

      let renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.shadowMap.enabled = true;
      renderer.physicallyCorrectLights = true;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      renderer.xr.enabled = true;

      // Scaling down render size increase performance without noticable loss
      renderer.xr.setFramebufferScaleFactor(0.8);

      // Create button to initiate a VR session
      const enterVRButton = VRButton.createButton(renderer);

      const cameraGroup = new THREE.Group();
      cameraGroup.add(camera);
      cameraGroup.position.set(
       roomWidth / 2, balconyHeight, roomDepthVR - 1);
      scene.add(cameraGroup);

      const movieController = new VRMovieController(movie, (offset) => {
         sceneGroup.setOffset(offset);
      });

      const {controlBlock, controlButtons} = BounceVRView.makeControls(
       0.4, movieController, cameraGroup);

      // Create VR controller to handle controllers and relevant functions
      const vrControl = VRControl(renderer, camera, scene);
      cameraGroup.add(vrControl.controllerGrips[0], vrControl.controllers[0]);
      cameraGroup.add(vrControl.controllerGrips[1], vrControl.controllers[1]);

      // Object to hold controllers when they connect
      let controllers = {
         leftController: null,
         rightController: null
      };

      // Assigns GUI to left controller, pointer and select listeners to right
      function setControllerHandedness(event, index) {
         if (event.data.handedness === 'right') {
            controllers.rightController = event.target;
            controllers.rightController.index = index;

            vrControl.addPointer(index);

            controllers.rightController.addEventListener('selectstart', () => {
               BounceVRView.selected = true;
               console.log('selectstart');
            });
            controllers.rightController.addEventListener('selectend', () => {
               BounceVRView.selected = false;
               console.log('selectend');
            });
         }
         else {
            controllers.leftController = event.target;
            controllers.leftController.index = index;
            vrControl.controllerGrips[index].add(controlBlock);
         }
      }

      // When controllers connect, determine handedness
      for (let i = 0; i < 2; i++) {
         vrControl.controllers[i].addEventListener('connected', (event) => {
            setControllerHandedness(event, i);
            console.log(controllers);
         });
      }

      // Rerender when all pending textures are loaded to show new textures.
      Promise.all(sceneGroup.getPendingPromises()).then(() => {
         renderer.render(scene, camera);
      });

      return {
         scene,
         sceneGroup,
         camera,
         renderer,
         vrControl,
         controllers,
         controlButtons,
         enterVRButton,
         movieController,
         movie,
      };
   }

   // JSB - shorten so under 100 lines
   // CAS FIX: Yes, please do.
   static makeControls(guiScale, movieController, cameraGroup) {
      const {balconyNum, balconyHeight, balconyDepth, roomDepthVR, roomWidth}
       = BounceSceneGroup;

      // Create gui block to hold buttons
      const controlBlock = new ThreeMeshUI.Block({
         justifyContent: 'center',
         contentDirection: 'column',
         fontFamily: FontJSON,
         fontTexture: FontImage,
         padding: 0.02 * guiScale,
         borderRadius: 0.11 * guiScale,
         backgroundOpacity: 1
      });
      controlBlock.rotateX(-Math.PI / 2);
      controlBlock.position.set(0, 0, -0.18);

      // Objects to store button options and state attributes
      const buttonOptions = {
         width: 0.4 * guiScale,
         height: 0.15 * guiScale,
         justifyContent: 'center',
         fontSize: 0.07 * guiScale,
         offset: 0.02 * guiScale,
         margin: 0.02 * guiScale,
         borderRadius: 0.075 * guiScale,
         backgroundOpacity: 1
      };

      // State attributes to change appearance when interacted with
      const hoveredStateAttributes = {
         state: 'hovered',
         attributes: {
            offset: buttonOptions.offset,
            backgroundColor: new THREE.Color(0x999999),
            fontColor: new THREE.Color(0xffffff)
         },
      };

      const idleStateAttributes = {
         state: 'idle',
         attributes: {
            offset: buttonOptions.offset,
            backgroundColor: new THREE.Color(0x666666),
            fontColor: new THREE.Color(0xffffff)
         },
      };

      const selectedStateAttributes = {
         offset: buttonOptions.offset / 4,
         backgroundColor: new THREE.Color(0x777777),
         fontColor: new THREE.Color(0x222222)
      };

      const buttonPlay = new ThreeMeshUI.Block(buttonOptions);
      buttonPlay.add(new ThreeMeshUI.Text({content: 'Play'}));

      const buttonPlaySlow = new ThreeMeshUI.Block(buttonOptions);
      buttonPlaySlow.add(new ThreeMeshUI.Text({content: 'Play Slow'}));

      const buttonPause = new ThreeMeshUI.Block(buttonOptions);
      buttonPause.add(new ThreeMeshUI.Text({content: 'Pause'}));

      // Set up button states
      buttonPlay.setupState({
         state: 'selected',
         attributes: selectedStateAttributes,
         onSet: () => {
            movieController.play(1);
         }
      });
      buttonPlay.setupState(hoveredStateAttributes);
      buttonPlay.setupState(idleStateAttributes);

      buttonPlaySlow.setupState({
         state: 'selected',
         attributes: selectedStateAttributes,
         onSet: () => {
            movieController.play(0.1);
         }
      });
      buttonPlaySlow.setupState(hoveredStateAttributes);
      buttonPlaySlow.setupState(idleStateAttributes);

      buttonPause.setupState({
         state: 'selected',
         attributes: selectedStateAttributes,
         onSet: () => {
            movieController.pause();
         }
      });
      buttonPause.setupState(hoveredStateAttributes);
      buttonPause.setupState(idleStateAttributes);

      // Sub-block to hold smaller buttons
      const subBlock = new ThreeMeshUI.Block(controlBlock);
      subBlock.contentDirection = 'row';
      subBlock.padding = 0;
      subBlock.offset = 0;

      // Add buttons and sub-block to gui block
      controlBlock.add(buttonPlay, buttonPlaySlow, buttonPause, subBlock);

      // Options and states for small buttons
      const smallButtonOptions = {...buttonOptions}
      smallButtonOptions.width = buttonOptions.width / 2 - buttonOptions.margin;
      smallButtonOptions.fontSize /= 1.3;

      const smallButtonUp = new ThreeMeshUI.Block(smallButtonOptions);
      smallButtonUp.add(new ThreeMeshUI.Text({content: 'Up'}));

      const smallButtonDown = new ThreeMeshUI.Block(smallButtonOptions);
      smallButtonDown.add(new ThreeMeshUI.Text({content: 'Down'}));

      smallButtonUp.setupState({
         state: 'selected',
         attributes: selectedStateAttributes,
         onSet: () => {
            console.log('Up');
            cameraGroup.position.x = roomWidth / 2;
            if (cameraGroup.position.y < balconyHeight * balconyNum)
               cameraGroup.position.y += balconyHeight;
            cameraGroup.position.z = roomDepthVR - balconyDepth + 0.5;
         }
      });
      smallButtonUp.setupState(hoveredStateAttributes);
      smallButtonUp.setupState(idleStateAttributes);

      smallButtonDown.setupState({
         state: 'selected',
         attributes: selectedStateAttributes,
         onSet: () => {
            console.log('Down');
            cameraGroup.position.x = roomWidth / 2;
            if (cameraGroup.position.y > 0)
               cameraGroup.position.y -= balconyHeight;
            if (cameraGroup.position.y === 0)
               cameraGroup.position.z = roomDepthVR - 2;
            else
               cameraGroup.position.z = roomDepthVR - balconyDepth + 0.5;
         }
      });
      smallButtonDown.setupState(hoveredStateAttributes);
      smallButtonDown.setupState(idleStateAttributes);

      subBlock.add(smallButtonUp, smallButtonDown);

      // Array of objects that can be interacted with, to test for selection
      return {
         controlBlock,
         controlButtons: [
            buttonPlay,
            buttonPlaySlow,
            buttonPause,
            smallButtonUp,
            smallButtonDown
         ]
      };
   }

   static makeLights(scene, lightColor, roomDepth) {
      const {roomHeight, roomWidth} = BounceSceneGroup;

      const numOfLights = 2;
      const totalPower = 85;

      // Create equally spaced point lights
      for (let i = 0; i < numOfLights; i++) {
         let light = new THREE.PointLight(lightColor);
         light.decay = 0.2;
         light.castShadow = true;
         light.position.set(
          (i + 0.5) * (roomWidth / numOfLights),
          roomHeight - 3, roomDepth - 1);
         light.power = totalPower / numOfLights;
         light.shadow.mapSize.width = 1024;
         light.shadow.mapSize.height = 1024;
         light.shadow.radius = 1;
         scene.add(light);
      }

      // Plus general ambient
      scene.add(new THREE.AmbientLight(lightColor));
   }

   // Do state setup dependent on this.mount, including:
   //
   // 1. Set size of renderer.
   // 2. Adjust camera aspect ratio from default initial value of 1.
   // 3. Attach the renderer dom element to the mount.
   // 4. Do a render
   componentDidMount() {
      const width = this.mount.clientWidth;
      const height = this.mount.clientHeight;

      this.state.renderer.setSize(width, height);

      this.state.camera.aspect = width / height;
      this.state.camera.updateProjectionMatrix();
      this.mount.appendChild(this.state.renderer.domElement);

      this.state.renderer.setAnimationLoop(time => {
         this.renderFrame(time);
      });

      this.mount.appendChild(this.state.enterVRButton);

      // Do a render
      this.state.renderer.render(this.state.scene, this.state.camera);
   }

   componentWillUnmount() {
      this.state.enterVRButton.remove();
   }

   static getDerivedStateFromProps(newProps, oldState) {
      let rtn = oldState;

      if (newProps.movie !== oldState.movie) // Complete reset
         rtn = BounceVRView.getInitState(newProps.movie);
      return BounceVRView.setOffset(rtn, newProps.offset);
   }

   renderFrame(time) {
      ThreeMeshUI.update();
      this.state.movieController.animate(time);
      this.state.renderer.render(this.state.scene, this.state.camera);
      if (this.state.controllers.leftController) // Controller that holds gui
         this.updatePointer();
   }

   // Advance/retract |state| so that state reflects all and only those events
   // in |movie| with time <= |timeStamp|.  Assume existing |state| was built
   // from |movie| so incremental change is appropriate.  Return adjusted state
   static setOffset(state, timeStamp) {
      let {scene, sceneGroup, camera, renderer, movie} = state;
      sceneGroup.setOffset(timeStamp);
      return {
         scene,
         sceneGroup,
         camera,
         renderer,
         movie
      }
   }

   updatePointer() {
      let intersect;

      const raycaster = new THREE.Raycaster();
      const guidingController = this.state.controllers.rightController;
      const vrControl = this.state.vrControl;

      if (guidingController) { // Pointer controller
         const index = guidingController.index;

         vrControl.setFromController(index, raycaster.ray);
         intersect = this.raycast(raycaster);

         // If ui, position pointer, else calculate for teleport
         if (intersect)
            vrControl.setPointerAt(index, intersect.point);
         else
            this.conditionallyTeleport();
      }

      // Update targeted button state (if any)
      if (intersect && intersect.object.isUI) {
         if (BounceVRView.selected)
            intersect.object.setState('selected');
         else
            intersect.object.setState('hovered');
      }

      // Update non-targeted buttons state
      this.state.controlButtons.forEach((obj) => {
         if ((!intersect || obj !== intersect.object) && obj.isUI)
            obj.setState('idle');
      });
   }

   raycast(raycaster) {
      return this.state.controlButtons.reduce((closestIntersection, obj) => {
         const intersection = raycaster.intersectObject(obj, true);

         if (!intersection[0])
            return closestIntersection;

         if (!closestIntersection
          || intersection[0].distance < closestIntersection.distance) {
            intersection[0].object = obj;

            return intersection[0];
         }

         return closestIntersection;
      }, null);
   }

   conditionallyTeleport() {
      const {roomWidth, roomDepthVR, rigDepth, gutterWidth, balconyDepth}
       = BounceSceneGroup;

      const vrControl = this.state.vrControl;
      const cameraGroup = this.state.camera.parent;
      const guidingController = this.state.controllers.rightController;
      const index = guidingController.index;

      // Camera group position
      const cam = cameraGroup.getWorldPosition(new Vector3);

      // Gravity
      const g = new THREE.Vector3(0, -9.81, 0);

      // Controller position
      const p = guidingController.getWorldPosition(new Vector3);

      // Controller direction
      const v = guidingController.getWorldDirection(new Vector3);
      // Change vector magnitude to 6, to use as velocity for calculation
      v.multiplyScalar(6);

      // Calculate time impact with floor
      const t = (Math.sqrt(2 * (-g.y) * (p.y - cam.y) + v.y ** 2) - v.y) / -g.y;
      const tpPos = vrControl.positionAtT(new Vector3, t, p, v, g);

      // If teleport position is out of bounds, adjust
      if (tpPos.x > roomWidth - 0.5)
         tpPos.x = roomWidth - 0.5;
      if (tpPos.x < 0.5)
         tpPos.x = 0.5;
      if (tpPos.z > roomDepthVR - 0.5)
         tpPos.z = roomDepthVR - 0.5;

      // Different if on balcony
      if (tpPos.y < 0.5 && tpPos.z < rigDepth + gutterWidth / 2 + 0.5)
         tpPos.z = rigDepth + gutterWidth / 2 + 0.5;
      else if (tpPos.y > 0.5 && tpPos.z < roomDepthVR - balconyDepth + 0.5)
         tpPos.z = roomDepthVR - balconyDepth + 0.5;

      // Set pointer to show adjusted teleport position
      vrControl.setPointerAt(index, tpPos.clone());

      // Position of player's feet in world space
      const feetPos = this.state.camera.getWorldPosition(new Vector3);
      feetPos.y = cameraGroup.position.y;

      // Calculate offset between cursor and player's feet
      const offset = new Vector3().subVectors(tpPos, feetPos);

      if (BounceVRView.selected) {
         BounceVRView.readyToTeleport = true;
         guidingController.point.scale.set(0.075, 0.075, 1);
      }
      else {
         // If select has been released and ready, teleport
         if (BounceVRView.readyToTeleport)
            cameraGroup.position.add(offset);

         BounceVRView.readyToTeleport = false;
         guidingController.point.scale.set(0.015, 0.015, 1);
      }
   }

   render() {
      this.state.renderer.render(this.state.scene, this.state.camera);
      return (
         <div
            style={{height: "600px", width: "100%", position: "relative"}}
            ref={(mount) => {
               this.mount = mount;
            }}
         ></div>
      )
   }
}