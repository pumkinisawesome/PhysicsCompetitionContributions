import React from 'react';
import {BounceMovie} from './BounceMovie';
import * as THREE from "three";
import CameraControls from "camera-controls";
import pingAudio from '../../../assets/sound/ping.mp3';
import UIfx from 'uifx';
import {concreteMat, flatSteelMat, steelMat} from '../../Util/Materials.js';
import {BounceSceneGraph} from './BounceSceneGraph';

CameraControls.install({THREE});

// Display a room with a "rig" on one wall.  The rig has the launcher, targets,
// obstacles, and ball.  All 3JS units are meters.
export class Bounce3DView extends React.Component {
   static ballRadius = .1;        // Ball has 10cm radius
   static clearColor = "#263238"; // General blue-gray background
   static rigSize = 10;           // Rig of targets/obstacles is 10m x 10m.
   static launcherWidth = 1;      // 1m piston launcher on left side of rig

   // Props are: {
   //    movie: movie to display
   //    offset: time offset from movie start in sec
   // }
   constructor(props) {
      super(props);

      this.ping = new UIfx(pingAudio, {volume: 0.5, throttleMs: 100});

      this.state = Bounce3DView.setOffset(
         Bounce3DView.getInitState(props.movie), props.offset);
   }

   // Create standard room with center of far wall at origin
/*    static buildRoom() {
      let roomDim = 3 * Bounce3DView.rigSize + 2;  // big boundaries around rig
      let room = new THREE.Mesh(
         new THREE.BoxGeometry(roomDim, roomDim, roomDim), [concreteMat,
         concreteMat, concreteMat, flatSteelMat, concreteMat, concreteMat]);

      room.position.set(0, 0, 9); 

      return room;
   } */

   // Return state displaying background grid and other fixtures
   // appropriate for |movie|.  
   static getInitState(movie) {
      let sceneGraph = new BounceSceneGraph(movie);

      // CAS Fix: Try moving renderer out of state
      let renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.shadowMap.enabled = true;

      let camera = new THREE.PerspectiveCamera(
       40, 1, .01, 10 * BounceSceneGraph.rigSize);
      camera.position.set(0, 0, 15);  // Center of near wall

      return {
         sceneGraph,
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
      const width = this.mount.clientWidth;
      const height = this.mount.clientHeight;
      let rigSize = BounceSceneGraph.rigSize;
      let cameraControls;

      this.state.renderer.setSize(width, height);

      this.state.camera.aspect = width / height;
      this.state.camera.updateProjectionMatrix();
      this.mount.appendChild(this.state.renderer.domElement);

      let cameraBounds = new THREE.Box3(new THREE.Vector3(rigSize - 24,
         rigSize - 19, rigSize - 8), new THREE.Vector3(rigSize + 4, rigSize + 4,
         rigSize + 5))

      cameraControls = new CameraControls(
         this.state.camera,
         this.state.renderer.domElement
      );
      // Restric right click camera movement
      cameraControls.setBoundary(cameraBounds);
      cameraControls.boundaryEnclosesCamera = true;

      cameraControls.addEventListener("control", () => {
         cameraControls.update(1);   // Needed w/nonzero param
         this.state.renderer.render(
          this.state.sceneGraph.getSceneGraph(), this.state.camera);
      });

      cameraControls.setTarget(0, 0, 0);  // Center of rig
      this.state.renderer.render(
       this.state.sceneGraph.getSceneGraph(), this.state.camera);
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
      let {sceneGraph, camera, renderer, movie} = state;
      sceneGraph.setOffset(timeStamp);
      return {
         sceneGraph,
         camera,
         renderer,
         movie
      }
   }

   render() {
      this.state.renderer.render(this.state.sceneGraph.getSceneGraph(), this.state.camera);
      return (
         <div
            style={{height: "600px", width: "100%"}}
            ref={(mount) => {
               this.mount = mount;
            }}
         ></div>
      )
   }
