import {BounceMovie} from './BounceMovie';
import * as THREE from 'three';
import {concreteMat, flatSteelMat, steelMat} from '../../Util/Materials.js';

export class BounceSceneGroup {
   // Suggested members
   //
   // 1. The graph itself.
   // 2. The movie it represents
   // 3. Current time represented by the scene graph
   // 4. Whatever else you need...

   static ballRadius = .1;        // Ball has 10cm radius
   static clearColor = "#263238"; // General blue-gray background
   static rigSize = 10;           // Rig of targets/obstacles is 10m x 10m.
   static launcherWidth = 1;      // 1m piston launcher on left side of rig

   constructor(movie) {
      // Add movie as member
      this.movie = movie;

      // Create the scenegraph for the movie, at time offset 0s
      const rigSize = BounceSceneGroup.rigSize;
      const ballRadius = BounceSceneGroup.ballRadius;
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

      this.topGroup = new THREE.Group();

      // Create standard room with center of far wall at origin
      let roomDim = 3 * rigSize + 2;  // big boundaries around rig
      this.room = new THREE.Mesh(
       new THREE.BoxGeometry(roomDim, roomDim, roomDim), [concreteMat,
       concreteMat, concreteMat, flatSteelMat, concreteMat, concreteMat]);
      this.room.position.set(0, 0, 9);
      this.room.name = 'room';
      this.topGroup.add(this.room);

      // Add a launcher at upper-left corner of rig. Flat horizontal steel plate
      //   with right edge at origin launch point minus .1m, so a ball can be
      //   set on the right edge of plate with center at precise upper left 
      //   corner of rig (0, 10).  On plate is a steel piston arrangement that 
      //   snaps forward to hit and launch the ball.

      // Make rig a group so we can put origin at lower left front of base
      this.rig = new THREE.Group();
      let base = new THREE.Mesh(new THREE.BoxGeometry(rigSize, rigSize,
         2 * ballRadius), steelMat)
      base.position.set(rigSize / 2, rigSize / 2, -ballRadius);
      this.rig.add(base);
      let platform = new THREE.Mesh(new THREE.BoxGeometry(1, .25, 1),
         flatSteelMat);
      this.ball = new THREE.Mesh(new THREE.SphereGeometry
         (ballRadius, ballSteps, ballSteps), flatSteelMat);
   
      // Put ball at upper left corner of rig, just touching the base.
      this.ball.position.set(0, rigSize, 2 * ballRadius);
      this.ball.castShadow = true;
      this.rig.add(this.ball);

      // Put platform at upper left corner of rig, just below the ball
      platform.position.set(-.5, rigSize - .25, 0);
      platform.castshadow = true;
      this.rig.add(platform);

      // Put Piston base on the far left of platform
      let pBase = new THREE.Mesh(new THREE.BoxGeometry(pistonHeight,
          pistonWidth, pistonDepth),flatSteelMat);
      pBase.position.set(pistonX,pistonY,0);
      platform.add(pBase);

      // Put Cylinder between piston base and piston face
      let pCyl = new THREE.Mesh(new THREE.CylinderGeometry(cylinderWidth,
          cylinderHeight, cylinderLength),flatSteelMat);
      pCyl.position.set(0, 0, 0);
      pCyl.rotateZ(cylinderRotate);
      pCyl.name = 'pCyl';
      pBase.add(pCyl);

      // Place piston face on the far right side of the cylinder
      let pFace = new THREE.Mesh(new THREE.BoxGeometry(pistonHeight,
          faceWidth, pistonDepth),flatSteelMat);

      pFace.position.set(0, -.25, 0);
      pCyl.add(pFace);

      // Put rig at back of room.  Assume room origin at center of back wall
      this.rig.position.set(-rigSize / 2, -rigSize / 2, 2 * ballRadius);
      this.topGroup.add(this.rig);

      this.targets = [];
      this.evtIdx = -1;

      this.setOffset(0);
   }

   // Adjust the scenegraph to reflect time.  This may require either forward
   // or backward movement in time.
   setOffset(timeStamp) {
      const ballRadius = BounceSceneGroup.ballRadius;
      const rigSize = BounceSceneGroup.rigSize;
      let evts = this.movie.evts;
      let evt;
      let pCyl = this.topGroup.getObjectByName('pCyl', true);

      // While the event after evtIdx exists and needs adding to 3DElms
      while (this.evtIdx + 1 < evts.length
       && evts[this.evtIdx + 1].time <= timeStamp) {
         evt = evts[++this.evtIdx];
         if (evt.type === BounceMovie.cMakeBarrier
          || evt.type === BounceMovie.cMakeTarget) {
            // Add the indicated barrier to the scene
            let width = evt.hiX - evt.loX;
            let height = evt.hiY - evt.loY;
            let obj = new THREE.Mesh(new THREE.BoxGeometry(width, height,
             6 * ballRadius), flatSteelMat);
            
            obj.position.set(evt.loX + width / 2, evt.loY + height / 2,
             3 * ballRadius);
            this.rig.add(obj);
            if (evt.type === BounceMovie.cMakeTarget) {
               this.targets[evt.id] = obj;
            }
         }
         else if (evt.type === BounceMovie.cBallPosition
          || evt.type === BounceMovie.cHitBarrier
          || evt.type === BounceMovie.cHitTarget) {
            this.ball.position.set(evt.x, evt.y, ballRadius);
         }
         if (evt.type === BounceMovie.cTargetFade) {
            this.targets[evt.targetId].position.z
             = 3 * ballRadius * (1 - evt.fadeLevel);
         }
         else if (evt.type === BounceMovie.cBallExit) {
            this.ball.position.set(0, rigSize, ballRadius);
         }
         else if (evt.type === BounceMovie.cBallLaunch) {
            // Make launcher fire by moving piston
            pCyl.position.set(.4, 0, 0);
            // Delayed animation to retract piston.
            setTimeout(() => {
               pCyl.position.set(0, 0, 0);
            }, 300);
         }
      }

      // Undo events to move backward in time. (Note that this and the prior
      // while condition are mutually exclusive.) Assume that barrier and
      // target creation occur at negative time and thus will not be "backed
      // over"
      while (this.evtIdx > 0 && timeStamp < evts[this.evtIdx].time) {
         evt = evts[this.evtIdx--];

         if (evt.type === BounceMovie.cBallPosition
            || evt.type === BounceMovie.cHitBarrier
            || evt.type === BounceMovie.cHitTarget) {
            this.ball.position.set(evt.x, evt.y, ballRadius);
         }
         if (evt.type === BounceMovie.cTargetFade) {
            this.targets[evt.targetId].position.z     // Move target to current
             = 3 * ballRadius * (1 - evt.fadeLevel);  // fade position
         }
         if (evt.type === BounceMovie.cBallLaunch)
            this.ball.position.set(0, rigSize, ballRadius);
      }
   }

   // Return root group of scenegraph represented by this class
   getSceneGroup() {
      return this.topGroup;
   }
}