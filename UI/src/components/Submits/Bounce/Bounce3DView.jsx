import React from 'react';
import {BounceMovie} from './BounceMovie';
import * as THREE from "three";
import CameraControls from "camera-controls";
import {BounceSceneGroup} from './BounceSceneGroup';

CameraControls.install({THREE});

// Display a room with a "rig" on one wall.  The rig has the launcher, targets,
// obstacles, and ball.  All 3JS units are meters.
export class Bounce3DView extends React.Component {
   // Props are: {
   //    movie: movie to display
   //    offset: time offset from movie start in sec
   // }
   constructor(props) {
      super(props);

      this.state = Bounce3DView.setOffset(
       Bounce3DView.getInitState(props.movie), props.offset);
   }

   // Return state displaying background grid and other fixtures
   // appropriate for |movie|.  
   static getInitState(movie) {
      const {roomHeight, roomWidth, rigSize} = BounceSceneGroup;
      let scene = new THREE.Scene();

      let camera = new THREE.PerspectiveCamera(70);
      camera.position.set(roomWidth / 2, rigSize / 2, 15);  // Near wall center
      const listener = new THREE.AudioListener();
      camera.add(listener);

      let sceneGroup = new BounceSceneGroup(movie, false, listener);
      scene.add(sceneGroup.getSceneGroup());

      const numOfLights = 1;
      const lightColor = 0xFFECE1;
      const lightIntensity = 18;
      const lightDecay = 0.2;
      const totalPower = 85;

      for (let i = 0; i < numOfLights; i++) {
         let light = new THREE.PointLight(
          lightColor, lightIntensity, 0, lightDecay);
         light.castShadow = true;
         light.position.set(
          (i + 0.5) * (roomWidth / numOfLights),  
          roomHeight / 3 * 2, sceneGroup.roomDepth / 3 * 2);
         light.power = totalPower / numOfLights; 
         scene.add(light);
      }

      // Plus general ambient
      scene.add(new THREE.AmbientLight(lightColor));

      // CAS FIX: Try moving renderer out of state
      let renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.shadowMap.enabled = true;
      renderer.physicallyCorrectLights = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      
      // Rerender when all pending textures are loaded to show new textures.
      Promise.all(sceneGroup.getPendingPromises()).then(() => {
         renderer.render(scene, camera);
      });

      return {
         scene,
         sceneGroup,
         camera,
         renderer,
         movie
      };
   }

   // Do state setup dependent on this.mount, including:
   //
   // 1. Set size of renderer.
   // 2. Adjust camera aspect ratio from default initial value of 1.
   // 3. Attach the renderer dom element to the mount.
   // 4. Do a render
   componentDidMount() {
      const {roomWidth, roomHeight, roomDepth3D, rigDepth, rigSize}
       = BounceSceneGroup;
      const width = this.mount.clientWidth;
      const height = this.mount.clientHeight;
      let cameraControls;

      this.state.renderer.setSize(width, height);

      this.state.camera.aspect = width / height;
      this.state.camera.updateProjectionMatrix();
      this.mount.appendChild(this.state.renderer.domElement);

      let cameraBounds = new THREE.Box3(new THREE.Vector3(0.5, 0.5, 0.5),
       new THREE.Vector3(roomWidth - 0.5, roomHeight - 0.5, roomDepth3D - 0.5));

      cameraControls = new CameraControls(
         this.state.camera,
         this.state.renderer.domElement
      );
      // Restric right click camera movement
      cameraControls.setBoundary(cameraBounds);
      cameraControls.boundaryEnclosesCamera = true;
      cameraControls.maxDistance = roomDepth3D;
      cameraControls.colliderMeshes = this.state.sceneGroup.getColliderMeshes();

      cameraControls.addEventListener("control", () => {
         cameraControls.update(1);   // Needed w/nonzero param
         this.state.renderer.render(this.state.scene, this.state.camera);
         // console.log(this.state.renderer.info);
      });

      function animate() {
         requestAnimationFrame(animate);
         cameraControls.update(1);
         this.state.renderer.render(this.state.scene, this.state.camera);
      }

      // Point to center of rig
      cameraControls.setTarget(roomWidth / 2, rigSize / 2, rigDepth);  
      cameraControls.update();

      // Do a render
      this.state.renderer.render(this.state.scene, this.state.camera);

      this.state.cameraControls = cameraControls;
   }

   static getDerivedStateFromProps(newProps, oldState) {
      let rtn = oldState;

      if (newProps.movie !== oldState.movie) // Complete reset
         rtn = Bounce3DView.getInitState(newProps.movie);
      return Bounce3DView.setOffset(rtn, newProps.offset);
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
