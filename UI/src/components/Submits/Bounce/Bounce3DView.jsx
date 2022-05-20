import React from 'react';
import { BounceMovie } from './BounceMovie';
import * as THREE from "three";
import CameraControls from "camera-controls";
import pingAudio from '../../../assets/sound/ping.mp3';
import UIfx from 'uifx';
import * as ImageUtil from '../../Util/ImageUtil'
import { DoubleSide } from 'three';
CameraControls.install({ THREE });

// Display a room with a "rig" on one wall.  The rig has the launcher, targets,
// obstacles, and ball.  All 3JS units are meters.
export class Bounce3DView extends React.Component {
   static ballRadius = .1;        // Ball has 10cm radius
   static clearColor = "#263238"; // General blue-gray background
   static rigSize = 10;           // Rig of targets/obstacles is 10m x 10m.
   static launcherWidth = 1;      // 1m piston launcher on left side of rig

   static steelMat = ImageUtil.createMaterial(0xffffff, {
      root: 'steelPlate',
      normal: 'steelplate1_normal-dx.png',
      displacement: {file: 'steelplate1_height.png', scale: 0.1},
      roughness: 'steelplate1_roughness.png',
      ao: 'steelplate1_ao.png',
      metal: {file: 'steelplate1_metallic.png', metalness: 0.5},
      side: THREE.DoubleSide,
      reps: {x: 5, y: 5}
   });

   static concreteMat = ImageUtil.createMaterial(0x5C5C5C, {
      root: 'concrete',
      normal: 'normal.jpg',
      displacement: {file: 'displacement.png', scale: 0.1},
      roughness: 'roughness.jpg',
      ao: 'ao.jpg',
      metal: {file: 'basecolor.jpg', metalness: 0.5},
      side: THREE.DoubleSide
   });

   static flatSteelMat = ImageUtil.createMaterial(0xffffff, {
      root: 'flatSteel',
      roughness: 'roughnessMap.png',
      metal: {file: 'metalMap.png', metalness: 0.5},
      side: THREE.DoubleSide
   });

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
   static buildRoom() {
      let concreteMat = Bounce3DView.concreteMat;
      let flatSteelMat = Bounce3DView.flatSteelMat;

      let roomDim = 3 * Bounce3DView.rigSize + 2;  // big boundaries around rig
      let room = new THREE.Mesh(
         new THREE.BoxGeometry(roomDim, roomDim, roomDim), [concreteMat,
         concreteMat, concreteMat, flatSteelMat, concreteMat, concreteMat]);

      room.position.set(0, 0, 9); 

      return room;
   }

   // Return state displaying background grid and other fixtures
   // appropriate for |movie|.  
   static getInitState(movie) {
      const rigSize = Bounce3DView.rigSize;
      const ballRadius = Bounce3DView.ballRadius
      const ballSteps = 16;
      const pistonHeight = .5;
      const pistonWidth = .5;
      const pistonDepth = 1;
      const pistonX = -.25;
      const pistonY =.25;
      const cylinderWidth =.1;
      const cylinderHeight = .1;
      const cylinderLength = .5;
      const cylinderRotate = 1.5708;
      const faceWidth =.1;
      let scene = new THREE.Scene();

      // CAS Fix: Try moving renderer out of state
      let renderer = new THREE.WebGLRenderer({antialias: true});
      renderer.shadowMap.enabled = true;

      let camera = new THREE.PerspectiveCamera(40, 1, .01, 10 * rigSize);
      camera.position.set(0, 0, 15);  // Center of near wall

      // Full range, square-decay, white light high on near wall in center
      let light = new THREE.PointLight(0xffffff, 1);
      light.position.set(rigSize / 2, rigSize / 2, rigSize / 2);
      light.castShadow = true;
      // Plus general ambient
      scene.add(light).add(new THREE.AmbientLight(0x404040));

      let room = this.buildRoom();
      room.name = 'room'
      scene.add(room);

      // Add a launcher at upper-left corner of rig. Flat horizontal steel plate
      //   with right edge at origin launch point minus .1m, so a ball can be
      //   set on the right edge of plate with center at precise upper left 
      //   corner of rig (0, 10).  On plate is a steel piston arrangement that 
      //   snaps forward to hit and launch the ball.

      // Make rig a group so we can put origin at lower left front of base
      let rig = new THREE.Group();
      let base = new THREE.Mesh(new THREE.BoxGeometry(rigSize, rigSize,
         2 * ballRadius), Bounce3DView.steelMat)
      base.position.set(rigSize / 2, rigSize / 2, -ballRadius);
      rig.add(base);
      let platform = new THREE.Mesh(new THREE.BoxGeometry(1, .25, 1),
         Bounce3DView.flatSteelMat)
      let ball = new THREE.Mesh(new THREE.SphereGeometry
         (ballRadius, ballSteps, ballSteps), Bounce3DView.flatSteelMat);
   
      // Put ball at upper left corner of rig, just touching the base.
      ball.position.set(0, rigSize, 2 * ballRadius);
      ball.castShadow = true;
      rig.add(ball);

      // Put platform at upper left corner of rig, just below the ball
      platform.position.set(-.5, rigSize - .25, 0)
      platform.castshadow = true;
      rig.add(platform);

      // Put Piston base on the far left of platform
      let pBase = new THREE.Mesh(new THREE.BoxGeometry(pistonHeight,
          pistonWidth, pistonDepth),Bounce3DView.flatSteelMat);
      pBase.position.set(pistonX,pistonY,0);
      platform.add(pBase);

      // Put Cylinder between piston base and piston face
      let pCyl = new THREE.Mesh(new THREE.CylinderGeometry(cylinderWidth,
          cylinderHeight, cylinderLength),Bounce3DView.flatSteelMat);
      pCyl.position.set(0, 0, 0);
      pCyl.rotateZ(cylinderRotate)
      pCyl.name = 'pCyl'
      pBase.add(pCyl);

      // Place piston face on the far right side of the cylinder
      let pFace = new THREE.Mesh(new THREE.BoxGeometry(pistonHeight,
          faceWidth, pistonDepth),Bounce3DView.flatSteelMat);

      pFace.position.set(0, -.25, 0)
      pCyl.add(pFace);

      // Put rig at back of room.  Assume room origin at center of back wall
      rig.position.set(-rigSize / 2, -rigSize / 2, 2 * ballRadius);
      scene.add(rig);

      return {
         scene,
         rig,
         camera,
         renderer,
         ball,
         targets: [],  // Array of target scene elements indexed by trg id
         evtIdx: -1,
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
      let rigSize = Bounce3DView.rigSize;
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
         this.state.renderer.render(this.state.scene, this.state.camera);
      });

      cameraControls.setTarget(0, 0, 0);  // Center of rig
      this.state.renderer.render(this.state.scene, this.state.camera);
   }

   // Return label for button activating this view
   static getLabel() {
      return "3D";
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
      const ballRadius = Bounce3DView.ballRadius;
      let {targets, ball, evtIdx, scene, rig, camera, renderer, movie} = state;
      let evts = movie.evts;
      let yTop = movie.background.height;
      let evt;
      let pCyl = scene.getObjectByName('pCyl', true)

      // While the event after evtIdx exists and needs adding to 3DElms
      while (evtIdx + 1 < evts.length && evts[evtIdx + 1].time <= timeStamp) {
         evt = evts[++evtIdx];
         if (evt.type === BounceMovie.cMakeBarrier
            || evt.type === BounceMovie.cMakeTarget) {
            // Add the indicated barrier to the scene
            let width = evt.hiX - evt.loX;
            let height = evt.hiY - evt.loY;
            let obj = new THREE.Mesh(new THREE.BoxGeometry(width, height,
               6 * ballRadius), Bounce3DView.flatSteelMat);

            obj.position.set(evt.loX + width / 2, evt.loY + height / 2,
               3 * ballRadius);
            rig.add(obj);
            if (evt.type === BounceMovie.cMakeTarget) {
               targets[evt.id] = obj;
            }
         }
         else if (evt.type === BounceMovie.cBallPosition
            || evt.type === BounceMovie.cHitBarrier
            || evt.type === BounceMovie.cHitTarget) {
            ball.position.set(evt.x, evt.y, ballRadius);
         }
         if (evt.type === BounceMovie.cTargetFade) {
            targets[evt.targetId].position.z         // Move target to current
             = 3 * ballRadius * (1 - evt.fadeLevel); // fade position
         }
         else if (evt.type === BounceMovie.cBallExit)
            ball.position.set(0, Bounce3DView.rigSize, ballRadius);
         else if (evt.type === BounceMovie.cBallLaunch) {
            // Make Launcher fire by moving piston
            pCyl.position.set(.4, 0, 0);
            // Delayed animation to retract piston.
            setTimeout(() => {
               pCyl.position.set(0, 0, 0)
            }, 300);
         }
      }

      // Undo events to move backward in time. (Note that this and the prior
      // while condition are mutually exclusive.) Assume that barrier and
      // target creation occur at negative time and thus will not be "backed
      // over"
      while (evtIdx > 0 && timeStamp < evts[evtIdx].time) {
         evt = evts[evtIdx--];

         if (evt.type === BounceMovie.cBallPosition
            || evt.type === BounceMovie.cHitBarrier
            || evt.type === BounceMovie.cHitTarget) {
            ball.position.set(evt.x, evt.y, ballRadius);
         }
         if (evt.type === BounceMovie.cTargetFade) {
            targets[evt.targetId].position.z          // Move target to current
             = 3 * ballRadius * (1 - evt.fadeLevel);  // fade position
         }
         if (evt.type === BounceMovie.cBallLaunch)
            ball.position.set(0, Bounce3DView.rigSize, ballRadius);
      }

      return {
         scene,
         rig,
         camera,
         renderer,
         ball,
         targets,   // Array of target scene elements indexed by trg id
         evtIdx,
         movie
      };
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