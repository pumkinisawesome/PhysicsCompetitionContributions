import {BounceMovie} from './BounceMovie';
import * as THREE from 'three';
import pingAudio from '../../../assets/sound/lowPing.mp3';
import {brickMat, plasterMat, streakyPlasticMat, brassMat, scuffedMetalMat,
 olderWoodFloorMat, polishedWoodMat, brassRodMat} from
 '../../Util/AsyncMaterials';
import {cloneMatPrms} from '../../Util/ImageUtil';

// CAS FIX: Please review this header comment to be sure it's still accurate.

// Create a Group with the following elements:
//
// A room with a coarse oak floor, brick walls, plaster ceiling, of dimensions
// adequate to accommodate a 10m x 10m rig with reasonable margins (see
// constants)
//
// A rig at back of room, a little in from from back wall.  This includes a
// wide slot in the floor and up both walls of the room, centered on the rig, 
// into which misfired balls may fall.  The sides of slot are of the same brick 
// as the walls, with the wood floor 10cm thick.  The rig also has brass
// targets, extended from the back wall by steel rods, with a "collar" at 
// attachment to target, and a ring at wall in which rod "slides". Targets 
// extend from back wall to the center of the rig, and retract back to wall 
// when hit. The rig has black enamel obstacles, extended on steel rods like 
// targets, but not retracting.  Finally, the rig includes a 1.8m long brass 
// cannon that fires balls; its muzzle is centered at top left of rig,
// 10m above floor
//
// Center of the top-level group is at lower-left corner of rig, at depth
// centered on the rig's "gutter".  This is the (0,0) location of the Bounce 
// problem itself.
// 
// Center of the room is at the bottom left corner

export class BounceSceneGroup {
   // Room and gutter dimensions
   static roomHeight = 12;     // 12m tall, rig reaches up to 10m
   static roomWidth = 14;      // 2m extra on either side of rig
   static roomDepthVR = 5;     // Don't need a lot of depth
   static roomDepth3D = 12;    // Needs more space for camera to pan around
   static floorHeight = .05;   // 5cm thick wood on floor
   static gutterWidth = .75;   // Rig gutter is 75cm wide
   static gutterDepth = 2.5;   // 2.5m is enough so you can't see the bottom

   // Balcony dimensions
   static balconyNum = 2;         // Number of balconies
   static balconyHeight = 4;      // Height of balcony top above floor
   static balconyDepth = 2;       // Comfortably deep enough for player
   static railRadius = 0.075;     // Balcony rail
   static railHeight = 1;         // Height above balcony floor
   static railRodRadius = 0.025;  // Balcony rail support rod

   // Rig dimensions
   static cannonLength = 1.8;  // 1.5m fits in left margin
   static cannonRadius = .2;   // Outside muzzle radius at right end.
   static ballRadius = .1;     // Ball has 10cm radius, as does inner muzzle
   static rodRadius = .03;     // Steel rods and any struts supporting cannon
   static trgDepth = .2;       // Just as wide as the ball to emphasize accuracy
   static trgRing = .01;       // Ring and rod must be <= 10cm, min block height
   static wallRing = .03;      // Width of ring surrounding rods at wall
   static rigDepth = 1;        // Rig is 1m from back wall
   static rigSize = 10;        // Rig is 10 x 10 meters
   static latheSegments = 32;  // Enough to make lathes look smooth
   static tubeSegments = 32;
   static bevelRadius = .005;  // Radius of bevel on rings

   constructor(movie, isVR, listener) {
      const {roomWidth, rigSize, rigDepth} = BounceSceneGroup;

      // Create materials object
      this.mats = {};

      this.isVR = isVR;
      if (isVR)
         this.roomDepth = BounceSceneGroup.roomDepthVR;
      else
         this.roomDepth = BounceSceneGroup.roomDepth3D;

      if (listener) {
         this.listener = listener;
         this.pendingAudio = [];

         const audioLoader = new THREE.AudioLoader();
         audioLoader.load(pingAudio, (buffer) => {
            this.pingBuffer = buffer;
            this.pendingAudio.forEach(audio => {
               audio.setBuffer(buffer);

               // Audio does a weird stereo pan thing when first played. 
               // Tried .UpdateMatrixWorld(), and console.logging the whole
               // audio object to look for differences, but nothing worked. 
               // This audio thing seems to only happen after listener
               // position has changed, so that's what to investigate next.
            });
         });
      }

      this.movie = movie;
      this.topGroup = new THREE.Group(); // Holds pending material promises
      this.pendingPromises = [];
      this.balls = [];                   // Array of balls currently in play
      this.obstacles = [];               // Total obstacles in scene
      this.evtIdx = -1;                  // Event index currently displayed
      this.currentBall;                  // Current ball in frame
      this.colliderMeshes = [];          // Colliders for camera boundary

      this.room = this.makeRoom();       // Room and gutter
      this.rig = this.makeRig();         // Rig, with ball, cannon and targets
      
      this.topGroup.add(this.room);
      this.rig.position.set((roomWidth - rigSize) / 2, 0, rigDepth);
      this.topGroup.add(this.rig);
      this.setOffset(-0.01);

      // Iterate through this.mats, creating each material and applying it to
      // every object in the this.mats.[name].objs array
      Object.entries(this.mats).forEach(([name, {mat, x, y, objs}]) => {
         // Add promise for material, and a then to run when mat prms load
         this.pendingPromises.push(this.mats[name].mat.then(prms => {
            const mat = new THREE.MeshStandardMaterial(
             cloneMatPrms(prms, {
                x: this.mats[name].x,
                y: this.mats[name].y
             }));

            // Apply material to all relevant objects
            this.mats[name].objs.forEach(obj => {
               obj.material = mat
            })
         }));
      });
   }

   makeRoom() {
      const {roomHeight, roomWidth} = BounceSceneGroup;

      // Create group to house room components
      const roomGroup = new THREE.Group();
      roomGroup.name = 'roomGroup';

      // Create wall sections
      this.makeWalls(roomGroup, brickMat);

      // Create roof
      const roof = this.createPlaneElement(
       'roof', roomGroup, {
          width: roomWidth, 
          height: this.roomDepth
       }, plasterMat);
      roof.rotateX(Math.PI / 2);
      roof.position.set(roomWidth / 2, roomHeight, this.roomDepth / 2);
      this.colliderMeshes.push(roof);

      this.makeFloor(roomGroup, olderWoodFloorMat);

      this.makeGutter(roomGroup, brickMat, plasterMat);

      // If VR, add balcony
      if (this.isVR)
         this.makeBalcony(roomGroup, polishedWoodMat, brassRodMat);

      return roomGroup;
   }

   makeWalls(roomGroup, wallMat) {
      const {roomHeight, roomWidth, gutterWidth, rigDepth}
       = BounceSceneGroup; // JSB

      // Create walls group
      const wallsGroup = new THREE.Group();
      wallsGroup.name = 'wallsGroup';

      // Back wall
      const backWall = this.createPlaneElement(
       'largeWall', wallsGroup, {
          width: roomWidth, 
          height: roomHeight
       }, wallMat);
      backWall.position.set(roomWidth / 2, roomHeight / 2, 0);
      backWall.receiveShadow = true;
      this.colliderMeshes.push(backWall);

      const frontWall = this.createPlaneElement(
       'largeWall', wallsGroup, {
          width: roomWidth,
          height: roomHeight
       }, wallMat);
      frontWall.position.set(roomWidth / 2, roomHeight / 2, this.roomDepth);
      this.colliderMeshes.push(frontWall);

      // Left walls
      const leftBackSideWall = this.createPlaneElement(
       'backSideWall', wallsGroup, {
          width: rigDepth - gutterWidth / 2,
          height: roomHeight
       }, wallMat);
      leftBackSideWall.rotateY(Math.PI / 2);
      leftBackSideWall.position.set(
       0, roomHeight / 2, (rigDepth - gutterWidth / 2) / 2);
      this.colliderMeshes.push(leftBackSideWall);

      const leftFrontSideWall = this.createPlaneElement(
       'frontSideWall', wallsGroup, {
          width: this.roomDepth - (rigDepth + gutterWidth / 2),
          height: roomHeight
       }, wallMat);
      leftFrontSideWall.rotateY(Math.PI / 2);
      leftFrontSideWall.position.set(
       0, roomHeight / 2, (this.roomDepth + rigDepth + gutterWidth / 2) / 2);
      this.colliderMeshes.push(leftFrontSideWall);

      // Right walls
      const rightBackSideWall = this.createPlaneElement(
       'backSideWall', wallsGroup, {
          width: rigDepth - gutterWidth / 2,
          height: roomHeight
       }, wallMat);
      rightBackSideWall.rotateY(-Math.PI / 2);
      rightBackSideWall.position.set(
       roomWidth, roomHeight / 2, (rigDepth - gutterWidth / 2) / 2);
      this.colliderMeshes.push(rightBackSideWall);

      const rightFrontSideWall = this.createPlaneElement(
       'frontSideWall', wallsGroup, {
          width: this.roomDepth - (rigDepth + gutterWidth / 2),
          height: roomHeight
       }, brickMat);
      rightFrontSideWall.rotateY(-Math.PI / 2);
      rightFrontSideWall.position.set(
       roomWidth, roomHeight / 2,
       (this.roomDepth + rigDepth + gutterWidth / 2) / 2);
      this.colliderMeshes.push(rightFrontSideWall);

      // Add walls group to room group
      roomGroup.add(wallsGroup);
   }

   makeFloor(roomGroup, floorMat) {
      const {roomWidth, floorHeight, gutterWidth, rigDepth}
       = BounceSceneGroup;

      // Create roof group
      const floorGroup = new THREE.Group();
      floorGroup.name = 'floorGroup';

      const backFloorTop = this.createPlaneElement(
       'backFloorTop', floorGroup, {
          width: roomWidth,
          height: rigDepth - gutterWidth / 2
       }, floorMat);
      backFloorTop.rotateX(-Math.PI / 2);
      backFloorTop.position.set(
       roomWidth / 2, 0, (rigDepth - gutterWidth / 2) / 2);

      const backFloorSide = this.createPlaneElement(
       'backFloorSide', floorGroup, {
          width: roomWidth,
          height: floorHeight
       }, floorMat);
      backFloorSide.position.set(
       roomWidth / 2, -floorHeight / 2, rigDepth - gutterWidth / 2);

      const frontFloorTop = this.createPlaneElement(
       'frontFloorTop', floorGroup, {
          width: roomWidth,
          height: this.roomDepth - (rigDepth + gutterWidth / 2),
       }, floorMat);
      frontFloorTop.rotateX(-Math.PI / 2);
      frontFloorTop.position.set(
       roomWidth / 2, 0, (this.roomDepth + rigDepth + gutterWidth / 2) / 2);
      this.colliderMeshes.push(frontFloorTop);

      const frontFloorSide = this.createPlaneElement(
       'frontFloorSide', floorGroup, {
          width: roomWidth,
          height: floorHeight
       }, floorMat);
      frontFloorSide.position.set(
       roomWidth / 2, -floorHeight / 2, rigDepth + gutterWidth / 2);

      // Add floor group to room group
      roomGroup.add(floorGroup);
   }

   makeGutter(roomGroup, gutterWallMat, gutterRoofMat) {
      const {roomHeight, roomWidth, floorHeight, gutterWidth, gutterDepth,
       rigDepth} = BounceSceneGroup;

      // Create gutter group
      const gutterGroup = new THREE.Group();
      gutterGroup.name = 'gutterGroup';

      // Bottom gutter
      const bottomGutterBack = this.createPlaneElement(
       'bottomGutter', gutterGroup, {
          width: roomWidth, 
          height: gutterDepth - floorHeight
       }, gutterWallMat);
      bottomGutterBack.position.set(
       roomWidth / 2, - (gutterDepth + floorHeight) / 2,
       rigDepth - gutterWidth / 2);

      const bottomGutterFront = this.createPlaneElement(
       'bottomGutter', gutterGroup, {
          width: roomWidth,
          height: gutterDepth - floorHeight
       }, gutterWallMat);
      bottomGutterFront.position.set(
       roomWidth / 2, - (gutterDepth + floorHeight) / 2,
       rigDepth + gutterWidth / 2);

      // Left gutter
      const leftGutterBack = this.createPlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, gutterWallMat);
      leftGutterBack.position.set(
       -gutterDepth / 2, (roomHeight - gutterDepth) / 2,
       rigDepth - gutterWidth / 2);

      const leftGutterFront = this.createPlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, gutterWallMat);
      leftGutterFront.position.set(
       -gutterDepth / 2, (roomHeight - gutterDepth) / 2, 
       rigDepth + gutterWidth / 2);

      // Right gutter
      const rightGutterBack = this.createPlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, gutterWallMat);
      rightGutterBack.position.set(
       roomWidth + gutterDepth / 2, (roomHeight - gutterDepth) / 2,
       rigDepth - gutterWidth / 2);

      const rightGutterFront = this.createPlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, gutterWallMat);
      rightGutterFront.position.set(
       roomWidth + gutterDepth / 2, (roomHeight - gutterDepth) / 2, 
       rigDepth + gutterWidth / 2);

      // Gutter roof
      const leftGutterRoof = this.createPlaneElement(
       'gutterRoof', gutterGroup, {
          width: gutterDepth,
          height: gutterWidth
       }, gutterRoofMat);
      leftGutterRoof.rotateX(Math.PI / 2);
      leftGutterRoof.position.set(
       -gutterDepth / 2, roomHeight, rigDepth);

      const rightGutterRoof = this.createPlaneElement(
       'gutterRoof', gutterGroup, {
          width: gutterDepth,
          height: gutterWidth
       }, gutterRoofMat);
      rightGutterRoof.rotateX(Math.PI / 2);
      rightGutterRoof.position.set(
       roomWidth + gutterDepth / 2, roomHeight, rigDepth);

      // Add gutter group to room group
      roomGroup.add(gutterGroup);
   }

   makeRig() {

      const rigGroup = new THREE.Group();
      rigGroup.name = 'rig';

      const cannonGroup = new THREE.Group();
      cannonGroup.name = 'cannon';
      rigGroup.add(cannonGroup);

      // Make cannon
      this.makeCannon(cannonGroup);

      // The cannon's uv mapping will be weird, as it assumes all segments
      // are the same length. So, we need to change these uv values to reflect
      // the actual length of each segment.

      // Make cannon wall mount
      this.makeCannonMount(cannonGroup);

      // Create group for obstacles
      const obstaclesGroup = new THREE.Group();
      obstaclesGroup.name = 'obstaclesGroup';
      rigGroup.add(obstaclesGroup);

      // Pre-create starter ball, so that additional balls can copy material
      this.createBall(0, rigGroup);

      return rigGroup;
   }

   // CAS FIX: I think this one needs to be broken into 2+ functions

   // Adjust the scenegraph to reflect time.  This may require either forward
   // or backward movement in time.
   setOffset(timeStamp) {
      const {trgDepth, rigSize, gutterWidth} = BounceSceneGroup;
      let evts = this.movie.evts;
      let evt;

      // While the event after evtIdx exists and needs adding to 3DElms
      while (this.evtIdx + 1 < evts.length
       && evts[this.evtIdx + 1].time <= timeStamp) {
         evt = evts[++this.evtIdx];

         // If the event is ball launch, add the ball to the scene
         if (evt.type === BounceMovie.cBallLaunch) {
            // Create new ball
            let ball;
            if (this.balls[evt.ballNumber]) {
               ball = this.balls[evt.ballNumber];
               this.rig.add(ball);
               console.log('revealed a ball!');
            }
            else {
               ball = this.createBall(evt.ballNumber, this.rig);
               this.balls[evt.ballNumber] = ball;
               console.log('made a ball!');
            }
            console.log('ball number', evt.ballNumber);
            this.currentBall = ball;
            ball.position.set(evt.x, evt.y, 0);
         }

         // If the event is obstacle creation, add the obstacle to the scene
         if (evt.type === BounceMovie.cMakeBarrier
          || evt.type === BounceMovie.cMakeTarget) {
            const width = evt.hiX - evt.loX;
            const height = evt.hiY - evt.loY;
            let objGroup;

            if (evt.type === BounceMovie.cMakeTarget) {
               objGroup = this.createObstacle(
                'target', this.rig, {
                   width: width,
                   height: height,
                   depth: trgDepth,
                }, brassMat);
               // Create hit sound effect
               objGroup.ping = new THREE.PositionalAudio(this.listener);
               if (this.pingBuffer) {
                  objGroup.ping.setBuffer(this.pingBuffer);
               }
               else
                  this.pendingAudio.push(objGroup.ping);
               objGroup.getObjectByName('wallRing').add(objGroup.ping);
            }
            else if (evt.type === BounceMovie.cMakeBarrier) {
               objGroup = this.createObstacle(
                'barrier', this.rig, {
                   width: width,
                   height: height,
                   depth: trgDepth,
                }, streakyPlasticMat, new THREE.Vector2(0.1, 0));
            }

            objGroup.position.set(evt.loX + width / 2, evt.loY + height / 2, 0);
            this.obstacles[evt.id] = objGroup.getObjectByName(
             'obstacleMoveGroup');
         }

         // If the event contains ball position, update the ball's position
         else if (evt.type === BounceMovie.cBallPosition
          || evt.type === BounceMovie.cHitBarrier
          || evt.type === BounceMovie.cHitTarget) {
            if (this.currentBall) {
               console.log('positioning ball');
               this.balls[evt.ballNumber].position.set(evt.x, evt.y, 0);
            }
            else
               console.log('no ball to position');
         }

         // If the event is obstacle hit, play fx
         if (evt.type === BounceMovie.cHitBarrier
          || evt.type === BounceMovie.cHitTarget) {
            if (this.obstacles[evt.targetId].parent.ping.buffer)
               this.obstacles[evt.targetId].parent.ping.play();
         }
         if (evt.type === BounceMovie.cObstacleFade) {
            this.obstacles[evt.targetId].position.z =
             - gutterWidth * evt.fadeLevel;  // fade position
         }
         else if (evt.type === BounceMovie.cBallExit) {
            this.rig.remove(this.balls[evt.ballNumber]);
            console.log('hid a ball!');
         }
         else if (evt.type === BounceMovie.cHitEdge) {
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
            this.balls[evt.ballNumber].position.set(evt.x, evt.y, 0);
         }
         if (evt.type === BounceMovie.cObstacleFade) {
            this.obstacles[evt.targetId].position.z =
             - gutterWidth * evt.fadeLevel;  // fade position
         }
         if (evt.type === BounceMovie.cBallLaunch) {
            this.balls[evt.ballNumber].position.set(0, rigSize, 0);
            this.rig.remove(this.balls[evt.ballNumber]);
            console.log('backwards launch!');
         }
         else if (evt.type === BounceMovie.cBallExit) {
            const ball = this.balls[evt.ballNumber];

            // Unhide ball
            this.rig.add(ball);
            console.log('revealed a ball!');

            // If this is the last ball
            if (evt.ballNumber === this.balls.length - 1)
               this.currentBall = ball;
         }
         else if (evt.type === BounceMovie.cHitEdge)
            this.currentBall = this.balls[evt.ballNumber];
      }
   }

   makeBalcony(parent, woodMat, metalMat) {
      let {roomWidth, floorHeight, balconyDepth, balconyHeight, railRadius,
       railHeight, railRodRadius, balconyNum, latheSegments}
       = BounceSceneGroup;

      for (let i = 1; i <= balconyNum; i++) {
         // Make the floor
         const floorTop = this.createPlaneElement(
          'floorTop', parent, {
             width: balconyDepth,
             height: roomWidth
          }, woodMat);
         floorTop.rotateX(Math.PI / 2);
         floorTop.rotateZ(Math.PI / 2);
         floorTop.position.set(
          roomWidth / 2, balconyHeight * i, this.roomDepth - balconyDepth / 2);
   
         const floorSide = this.createPlaneElement(
          'floorSide', parent, {
             width: floorHeight,
             height: roomWidth
          }, woodMat);
         floorSide.rotateZ(Math.PI / 2);
         floorSide.position.set(
          roomWidth / 2, balconyHeight * i - floorHeight / 2,
          this.roomDepth - balconyDepth);
   
         const floorBottom = this.createPlaneElement(
          'floorBottom', parent, {
             width: balconyDepth,
             height: roomWidth
          }, woodMat);
         floorBottom.rotateX(Math.PI / 2);
         floorBottom.rotateZ(Math.PI / 2);
         floorBottom.position.set(
          roomWidth / 2, balconyHeight * i - floorHeight,
          this.roomDepth - balconyDepth / 2);
   
         // Make the rail
         const rail = this.createCylinderElement(
          'rail', parent, {
             radius: railRadius,
             height: roomWidth,
             segments: latheSegments
          }, woodMat);
         rail.rotateZ(Math.PI / 2);
         rail.position.set(
          roomWidth / 2, balconyHeight * i + railHeight,
          this.roomDepth - balconyDepth + railRadius);
   
         // Brass base for rail
         const railBase = this.createBoxElement(
          'railBase', parent, {
             width: roomWidth,
             height: railRadius + railRodRadius,
             depth: railRadius
          }, metalMat);
         railBase.position.set(
          roomWidth / 2, balconyHeight * i + railHeight - railRadius / 2,
          this.roomDepth - balconyDepth + railRadius);
   
         // Make support rods
         // Support rod pattern repeats every meter
         for (let j = -0.5; j <= roomWidth; j++) {
            // Leftmost straight rod
            const straightRod = this.createCylinderElement(
             'straightRod', parent, {
                radius: railRodRadius,
                height: railHeight,
                segments: latheSegments
             }, metalMat);
            straightRod.rotateY(Math.PI);
            straightRod.position.set(
             (roomWidth - Math.ceil(roomWidth)) / 2 + j,
             balconyHeight * i + railHeight / 2,
             this.roomDepth - balconyDepth + railRadius);
   
            // Leftmost curved rod
            const testRod = this.makeCurvedRailRod(parent, metalMat);
            testRod.position.set(
             (roomWidth - Math.ceil(roomWidth)) / 2 + j + 0.25,
             balconyHeight * i - 0.05,
             this.roomDepth - balconyDepth + railRadius);
            
            const testRod2 = this.makeCurvedRailRod(parent, metalMat);
            testRod2.position.set(
             (roomWidth - Math.ceil(roomWidth)) / 2 + j + 0.75,
             balconyHeight * i - 0.05,
             this.roomDepth - balconyDepth + railRadius);
            testRod2.rotateX(Math.PI);
         }
      }
   }

   makeCurvedRailRod(parent, mat) {
      const {railRodRadius, latheSegments} = BounceSceneGroup;
      class CustonArcTanCurve extends THREE.Curve {
         constructor(scale = 1) {
            super();
            this.scale = scale;
         }

         getPoint( t, optionalTarget = new THREE.Vector3() ) {
            const tx = t * 1.05;
            const ty = Math.atan( 2 * Math.PI * (t - 0.5) ) / 8;
            const tz = 0;

            return optionalTarget.set(tx, ty, tz).multiplyScalar(this.scale);
         }
      }

      const path = new CustonArcTanCurve();
      const rod = new THREE.Mesh(
       new THREE.TubeGeometry(path, 20, railRodRadius, latheSegments, false),
       new THREE.MeshLambertMaterial(mat.fast));
      parent.add(rod);
      rod.rotateZ(Math.PI / 2);
      rod.name = 'curvedRailRod';

      this.addMaterial(rod, {
         x: 1.1,
         y: 0.126
      }, mat);

      return rod;
   }

   makeCannon(cannonGroup) {
      const {cannonLength, cannonRadius, ballRadius, rigSize, latheSegments}
       = BounceSceneGroup;

      const cannonPoints = [];

      // Inside end of barrel
      this.generateArcPoints(
       cannonPoints, ballRadius, {
          x: 0,
          y: cannonLength - 0.2
       }, {
          start: Math.PI / 2,          // Starts at 0, cannonLength - 0.1
          end: 0,                      // Ends at ballRadius, cannonLength - 0.2
          incr: -Math.PI / 16
       });

      // Inner curve of front of muzzle
      this.generateArcPoints(
       cannonPoints, 0.02, {
          x: ballRadius + 0.02,
          y: 0.02
       }, {
          start: - Math.PI,            // Starts at ballRadius, 0.02
          end: - Math.PI / 2,          // Ends at ballRadius + 0.02, 0
          incr: Math.PI / 16
       });

      // Outer curve of front of muzzle
      this.generateArcPoints(
       cannonPoints, 0.02, {
          x: cannonRadius - 0.07,
          y: 0.02
       }, {
          start: - Math.PI / 2,        // Starts at cannonRadius - 0.07, 0
          end: 0,                      // Ends at cannonRadius - 0.05, 0.02
          incr: Math.PI / 16
       });

      // Curve of side of muzzle
      this.generateArcPoints(
       cannonPoints, 0.05, {
          x: cannonRadius - 0.015,
          y: 0.08
       }, {
          start: - 3 * Math.PI / 4,    // Starts at ~cannonRadius - 0.05, 
          end: - 5.01 * Math.PI / 4,   // Ends at ~cannonRadius - 0.05, 
          incr: -Math.PI / 16
       });

      // Curve of back of muzzle
      this.generateArcPoints(
       cannonPoints, 0.02, {
          x: cannonRadius - 0.07,
          y: 0.14
       }, {
          start: 0,                    // Starts at cannonRadius - 0.05, 0.14
          end: Math.PI / 2,            // Ends at cannonRadius - 0.07, 0.16
          incr: Math.PI / 16
       });

      // Curve of back of cannon
      this.generateArcPoints(
       cannonPoints, cannonRadius, {
          x: 0,
          y: cannonLength - cannonRadius
       }, {
          start: 0,
          end: Math.PI / 2,
          incr: Math.PI / 16
       });


      const cannon = this.createLatheElement(
       'cannon', cannonGroup, {
          points: cannonPoints,
          maxRadius: cannonRadius,
          segments: latheSegments
       }, brassMat);
      cannon.rotateZ(Math.PI / 2);
      cannon.rotateY(Math.PI);
      cannon.position.set(0, rigSize, 0);
      cannon.castShadow = true;
   }

   makeCannonMount(cannonGroup) {
      const {roomWidth, rigSize, latheSegments} = BounceSceneGroup;

      for (let i = -1; i < 2; i += 2) {
         const LargeCannonMount = this.createCylinderElement(
          'largeCannonMount', cannonGroup, {
             radius: 0.1,
             height: (roomWidth - rigSize) / 2 - 0.9,
             segments: latheSegments
          }, scuffedMetalMat);
         LargeCannonMount.rotateZ(Math.PI / 2);
         LargeCannonMount.rotateY(Math.PI);
         LargeCannonMount.position.set(
          (rigSize - roomWidth - 1.8) / 4, rigSize, 0.5 * i);
         LargeCannonMount.castShadow = true;

         const MountRing = this.createRingElement(
          'mountRing', cannonGroup, {
             innerRad: 0.1,
             ringSize: 0.03,
             segments: latheSegments
          }, scuffedMetalMat);
         MountRing.rotateZ(-Math.PI / 2);
         MountRing.position.set(
          - (roomWidth - rigSize) / 2, rigSize, 0.5 * i);

         const SmallCannonMount = this.createCylinderElement(
          'smallCannonMount', cannonGroup, {
             radius: 0.05,
             height: 0.5,
             segments: latheSegments
          }, scuffedMetalMat);
         SmallCannonMount.rotateX(Math.PI / 2);
         SmallCannonMount.position.set(-1, rigSize, 0.35 * i);
         SmallCannonMount.castShadow = true;
      }
   }

   createObstacle(name, parent, {width, height, depth}, matPrms, offset) {
      const {rodRadius, trgRing} = BounceSceneGroup;

      // Create group for obstacle
      const obstacleGroup = new THREE.Group();
      parent.add(obstacleGroup);

      // Create group for moveable objects
      const obstacleMoveGroup = new THREE.Group();
      obstacleMoveGroup.name = 'obstacleMoveGroup';
      obstacleGroup.add(obstacleMoveGroup);

      // Create obstacle
      const obstacle = this.createBoxElement(
       name, obstacleMoveGroup, {width, height, depth}, matPrms, offset);
      obstacle.castShadow = true;

      // Calculate rods needed in x and y direction
      const xRods = 1 + Math.floor(width - 2 * (rodRadius + trgRing));
      const yRods = 1 + Math.floor(height - 2 * (rodRadius + trgRing));

      // Loop through to create support rods and rings
      for (let i = 0; i < xRods; i++) {
         for (let j = 0; j < yRods; j++) {
            const x = -(xRods - 1) / 2 + i;
            const y = -(yRods - 1) / 2 + j;

            this.createSupportRods(obstacleGroup, obstacleMoveGroup, {x, y});
         }
      }

      return obstacleGroup;
   }

   createSupportRods(parent, moveParent, {x, y}) {
      const {rodRadius, trgDepth, trgRing, wallRing, rigDepth,
       latheSegments} = BounceSceneGroup;

      // Add rod
      const supportRod = this.createCylinderElement(
       'supportRod', moveParent, {
          radius: rodRadius,
          height: rigDepth,
          segments: latheSegments
       }, scuffedMetalMat);
      supportRod.position.set(x, y, -rigDepth / 2);
      supportRod.rotateX(Math.PI / 2);
      supportRod.castShadow = true;


      if (!this.mats.obstacleRing)
         this.mats.obstacleRing = {
            mat: scuffedMetalMat.slow,
            x: 2 * rodRadius * Math.PI,
            y: rigDepth,
            objs: []
         };
      // Add obstacle ring
      const obstacleRing = this.createRingElement(
       'obstacleRing', moveParent, {
          innerRad: rodRadius,
          ringSize: trgRing,
          segments: latheSegments
       }, scuffedMetalMat);
      obstacleRing.position.set(x, y, -trgDepth / 2);
      obstacleRing.rotateX(-Math.PI / 2);
      obstacleRing.receiveShadow = true;

      // Add wall ring
      const obstacleWallRing = this.createRingElement(
       'wallRing', parent, {
          innerRad: rodRadius,
          ringSize: wallRing,
          segments: latheSegments
       }, scuffedMetalMat);
      obstacleWallRing.position.set(x, y, -rigDepth);
      obstacleWallRing.rotateX(Math.PI / 2);
      obstacleWallRing.receiveShadow = true;
   }

   createBall(ballNumber, parent) {
      const {rigSize, cannonLength} = BounceSceneGroup;
      // Ball dimensions
      const radius = BounceSceneGroup.ballRadius;
      const widthSegments = BounceSceneGroup.latheSegments;
      const heightSegments = BounceSceneGroup.latheSegments / 2;

      const ball = this.createSphereElement(
       `ball`, parent, {
          radius,
          widthSegments,
          heightSegments
       }, brassMat);
      this.balls[ballNumber] = ball;
      ball.castShadow = true;
      
      ball.position.set(-cannonLength / 2, rigSize, 0);
      
      return ball;
   }

   createBoxElement(name, parent, {width, height, depth}, matPrms) {
      const cube = new THREE.Mesh(
       new THREE.BoxGeometry(width, height, depth),
       new THREE.MeshLambertMaterial(matPrms.fast));
      cube.name = name;
      parent.add(cube);

      width = 1;
      height = 1;
      depth = 1;

      this.addMaterial(cube, {
         x: 1,
         y: 1
      }, matPrms);

      return cube;
   }

   createSphereElement(
    name, parent, {radius, widthSegments, heightSegments}, matPrms) {
      const sphere = new THREE.Mesh(
       new THREE.SphereGeometry(radius, widthSegments, heightSegments),
       new THREE.MeshLambertMaterial(matPrms.fast));
      sphere.name = name;
      parent.add(sphere);

      const desiredRep = {
         x: 2 * radius * Math.PI,
         y: radius * Math.PI
      }

      this.addMaterial(sphere, desiredRep, matPrms);

      return sphere;
   }

   createPlaneElement(name, parent, {width, height}, matPrms) {
      const plane = new THREE.Mesh(
       new THREE.PlaneGeometry(width, height),
       new THREE.MeshLambertMaterial(matPrms.fast));
      plane.name = name;
      parent.add(plane);

      this.addMaterial(plane, {
         x: width,
         y: height
      }, matPrms);

      return plane;
   }

   createCylinderElement(
    name, parent, {radius, height, segments}, matPrms) {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(
       radius, radius, height, segments),
       new THREE.MeshLambertMaterial(matPrms.fast));
      cylinder.name = name;
      parent.add(cylinder);

      const desiredRep = {
         x: 2 * radius * Math.PI,
         y: height
      };

      this.addMaterial(cylinder, desiredRep, matPrms);

      return cylinder;
   }

   createRingElement(
    name, parent, {innerRad, ringSize, segments}, matPrms, offset) {
      const {bevelRadius} = BounceSceneGroup;
      const points = [];
      points.push(new THREE.Vector2(innerRad + ringSize, 0));
      this.generateArcPoints(
       points, bevelRadius, {
          x: innerRad + ringSize - bevelRadius,
          y: ringSize,
       }, {
          start: 0,
          end: Math.PI / 2,
          incr: Math.PI / 16
       });
      this.generateArcPoints(
       points, bevelRadius, {
          x: innerRad + bevelRadius,
          y: ringSize
       }, {
          start: Math.PI / 2,
          end: Math.PI,
          incr: Math.PI / 16
       });
      points.push(new THREE.Vector2(innerRad, 0));

      const newDims = {
         points,
         maxRadius: innerRad + ringSize,
         segments: segments
      };

      return this.createLatheElement(name, parent, newDims, matPrms, offset);
   }

   createLatheElement(
    name, parent, {points, maxRadius, segments}, matPrms, offset) {
      const lathe = new THREE.Mesh(
         new THREE.LatheGeometry(points, segments),
         new THREE.MeshLambertMaterial(matPrms.fast));
      lathe.name = name;
      parent.add(lathe);
  
      this.fixLatheUVs(lathe, {points, maxRadius, segments}, matPrms, offset);

      return lathe;
   }

   addMaterial(obj, {x, y}, matPrms) {
      // If material doesn't exist, create it
      if (!this.mats[obj.name])
         this.mats[obj.name] = {
            mat: matPrms.slow,
            x,
            y,
            objs: []
         };
      // Add object to list of objects with this material
      this.mats[obj.name].objs.push(obj);
   }

   // Take a lathe, and adjust its UV values to make the texture map evenly,
   // then apply a texture the correct size.
   fixLatheUVs(lathe, {points, maxRadius, segments}, matPrms) {
      // Go through points array and calculate total length of curve
      let textureLength = 0;
      for (let i = 0; i < points.length - 1; i++) {
         const p1 = points[i];
         const p2 = points[i + 1];
         textureLength += Math.sqrt(
          (p2.x - p1.x) * (p2.x - p1.x) +
          (p2.y - p1.y) * (p2.y - p1.y));
      }

      // Go through Uvs and scale them to total length
      let uvArray = lathe.geometry.getAttribute('uv').array;      
      
      // CAS FIX: comment only nonobvious.  These seem pretty obvious.
      // cycle through uv array and change each v value
      for (let i = 0; i < segments + 1; i++) {
         let lengthFromStart = 0;

         for (let j = 0; j < points.length - 1; j++) {
            const vValue = 2 * (i * points.length + j) + 1;

            const lengthPercent = lengthFromStart / textureLength;
            uvArray[vValue] = lengthPercent;
            const p1 = points[j];
            const p2 = points[j + 1];
            lengthFromStart += Math.sqrt(
             (p2.x - p1.x) * (p2.x - p1.x) +
             (p2.y - p1.y) * (p2.y - p1.y));
         }
      }

      // Set uv array to new array
      lathe.geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

      // Length of texture already calculated, so calculate width
      const textureWidth = 2 * Math.PI * maxRadius;

      const desiredRep = {
         x: textureWidth,
         y: textureLength
      };

      this.addMaterial(lathe, desiredRep, matPrms);
   }

   generateArcPoints(points, radius, center, angle) {
      if (angle.incr < 0) {
         for (let i = angle.start; i >= angle.end; i += angle.incr) {
            const x = center.x + radius * Math.cos(i);
            const y = center.y + radius * Math.sin(i);
            points.push(new THREE.Vector2(x, y));
         }
      }
      else {
         for (let i = angle.start; i <= angle.end; i += angle.incr) {
            const x = center.x + radius * Math.cos(i);
            const y = center.y + radius * Math.sin(i);
            points.push(new THREE.Vector2(x, y));
         }
      }
   }

   // Return root group of scenegraph represented by this class
   getSceneGroup() {
      return this.topGroup;
   }

   getCurrentBall() {
      return this.currentBall;
   }

   getPendingPromises() {
      return this.pendingPromises;
   }

   getColliderMeshes() {
      return this.colliderMeshes;
   }
}