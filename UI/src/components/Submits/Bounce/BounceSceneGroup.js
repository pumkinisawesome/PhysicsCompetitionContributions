import {BounceMovie} from './BounceMovie';
import * as THREE from 'three';
import pingAudio from '../../../assets/sound/lowPing.mp3';
import {brickMat, plasterMat, streakyPlasticMat, brassMat, scuffedMetalMat,
 olderWoodFloorMat, polishedWoodMat, brassRodMat} from
 '../../Util/AsyncMaterials';
import {makePlaneElement, makeBoxElement, makeSphereElement,
 makeCylinderElement, makeLatheElement, generateArcPoints,
 addMaterial} from '../../Util/SceneUtil';
import {cloneMatPrms} from '../../Util/ImageUtil';

// Create a Group with the following elements:
//
// A room with a coarse wood floor, brick walls, plaster ceiling, of dimensions
// adequate to accommodate a 10m x 10m rig with reasonable margins (see
// constants)
//
// A rig at back of room, a little in from from back wall. This includes a
// wide slot in the floor and up both walls of the room, centered on the rig, 
// into which misfired balls may fall. The sides of slot are of the same brick 
// as the walls, with the wood floor 5cm thick. The rig also has brass
// targets, extended from the back wall by steel rods, with a "collar" at 
// attachment to target, and a ring at wall in which rod "slides". Targets 
// extend from back wall to the center of the rig, and retract back to wall 
// when hit. The rig has black enamel obstacles, extended on steel rods like 
// targets. Finally, the rig includes a 1.8m long brass cannon that fires
// balls; its muzzle is centered at top left of rig, 10m above floor
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
      this.topGroup = new THREE.Group();
      this.pendingPromises = [];         // Holds pending material promises
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
      Object.values(this.mats).forEach(({mat, x, y, offset, objs}) => {
         // Add promise for material, and a then to run when mat prms load
         this.pendingPromises.push(mat.then(prms => {
            const mat = new THREE.MeshStandardMaterial(
             cloneMatPrms(prms, {
                x,
                y
             }, offset));
            // Apply material to all relevant objects
            objs.forEach(obj => {
               obj.material = mat
            });
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
      const roof = makePlaneElement(
       'roof', roomGroup, {
          width: roomWidth, 
          height: this.roomDepth
       }, {matPrms: plasterMat}, this.mats);
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

   makeWalls(group, wallMat) {
      const {roomHeight, roomWidth, gutterWidth, rigDepth}
       = BounceSceneGroup;

      const wallsGroup = new THREE.Group();
      wallsGroup.name = 'wallsGroup';

      const backWall = makePlaneElement(
       'largeWall', wallsGroup, {
          width: roomWidth, 
          height: roomHeight
       }, {matPrms: wallMat}, this.mats);
      backWall.position.set(roomWidth / 2, roomHeight / 2, 0);
      backWall.receiveShadow = true;
      this.colliderMeshes.push(backWall);

      const frontWall = makePlaneElement(
       'largeWall', wallsGroup, {
          width: roomWidth,
          height: roomHeight
       }, {matPrms: wallMat}, this.mats);
      frontWall.rotateY(Math.PI);
      frontWall.position.set(roomWidth / 2, roomHeight / 2, this.roomDepth);
      this.colliderMeshes.push(frontWall);

      const leftBackSideWall = makePlaneElement(
       'backSideWall', wallsGroup, {
          width: rigDepth - gutterWidth / 2,
          height: roomHeight
       }, {matPrms: wallMat}, this.mats);
      leftBackSideWall.rotateY(Math.PI / 2);
      leftBackSideWall.position.set(
       0, roomHeight / 2, (rigDepth - gutterWidth / 2) / 2);
      leftBackSideWall.receiveShadow = true;
      this.colliderMeshes.push(leftBackSideWall);

      const leftFrontSideWall = makePlaneElement(
       'frontSideWall', wallsGroup, {
          width: this.roomDepth - (rigDepth + gutterWidth / 2),
          height: roomHeight
       }, {matPrms: wallMat}, this.mats);
      leftFrontSideWall.rotateY(Math.PI / 2);
      leftFrontSideWall.position.set(
       0, roomHeight / 2, (this.roomDepth + rigDepth + gutterWidth / 2) / 2);
      this.colliderMeshes.push(leftFrontSideWall);

      const rightBackSideWall = makePlaneElement(
       'backSideWall', wallsGroup, {
          width: rigDepth - gutterWidth / 2,
          height: roomHeight
       }, {matPrms: wallMat}, this.mats);
      rightBackSideWall.rotateY(-Math.PI / 2);
      rightBackSideWall.position.set(
       roomWidth, roomHeight / 2, (rigDepth - gutterWidth / 2) / 2);
      rightBackSideWall.receiveShadow = true;
      this.colliderMeshes.push(rightBackSideWall);

      const rightFrontSideWall = makePlaneElement(
       'frontSideWall', wallsGroup, {
          width: this.roomDepth - (rigDepth + gutterWidth / 2),
          height: roomHeight
       }, {matPrms: brickMat}, this.mats);
      rightFrontSideWall.rotateY(-Math.PI / 2);
      rightFrontSideWall.position.set(
       roomWidth, roomHeight / 2,
       (this.roomDepth + rigDepth + gutterWidth / 2) / 2);
      this.colliderMeshes.push(rightFrontSideWall);

      group.add(wallsGroup);
   }

   makeFloor(roomGroup, floorMat) {
      const {roomWidth, floorHeight, gutterWidth, rigDepth}
       = BounceSceneGroup;

      // Create roof group
      const floorGroup = new THREE.Group();
      floorGroup.name = 'floorGroup';

      const backFloorTop = makePlaneElement(
       'backFloorTop', floorGroup, {
          width: roomWidth,
          height: rigDepth - gutterWidth / 2
       }, {matPrms: floorMat}, this.mats);
      backFloorTop.rotateX(-Math.PI / 2);
      backFloorTop.position.set(
       roomWidth / 2, 0, (rigDepth - gutterWidth / 2) / 2);

      const backFloorSide = makePlaneElement(
       'backFloorSide', floorGroup, {
          width: roomWidth,
          height: floorHeight
       }, {matPrms: floorMat}, this.mats);
      backFloorSide.position.set(
       roomWidth / 2, -floorHeight / 2, rigDepth - gutterWidth / 2);

      const frontFloorTop = makePlaneElement(
       'frontFloorTop', floorGroup, {
          width: roomWidth,
          height: this.roomDepth - (rigDepth + gutterWidth / 2),
       }, {matPrms: floorMat}, this.mats);
      frontFloorTop.rotateX(-Math.PI / 2);
      frontFloorTop.position.set(
       roomWidth / 2, 0, (this.roomDepth + rigDepth + gutterWidth / 2) / 2);
      this.colliderMeshes.push(frontFloorTop);

      const frontFloorSide = makePlaneElement(
       'frontFloorSide', floorGroup, {
          width: roomWidth,
          height: floorHeight
       }, {matPrms: floorMat}, this.mats);
      frontFloorSide.rotateX(Math.PI);
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
      const bottomGutterBack = makePlaneElement(
       'bottomGutter', gutterGroup, {
          width: roomWidth, 
          height: gutterDepth - floorHeight
       }, {matPrms: gutterWallMat}, this.mats);
      bottomGutterBack.position.set(
       roomWidth / 2, - (gutterDepth + floorHeight) / 2,
       rigDepth - gutterWidth / 2);
      bottomGutterBack.receiveShadow = true;

      const bottomGutterFront = makePlaneElement(
       'bottomGutter', gutterGroup, {
          width: roomWidth,
          height: gutterDepth - floorHeight
       }, {matPrms: gutterWallMat}, this.mats);
      bottomGutterFront.rotateY(Math.PI);
      bottomGutterFront.position.set(
       roomWidth / 2, - (gutterDepth + floorHeight) / 2,
       rigDepth + gutterWidth / 2);
      bottomGutterFront.castShadow = true;

      // Left gutter
      const leftGutterBack = makePlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, {matPrms: gutterWallMat}, this.mats);
      leftGutterBack.position.set(
       -gutterDepth / 2, (roomHeight - gutterDepth) / 2,
       rigDepth - gutterWidth / 2);
      leftGutterBack.receiveShadow = true;

      const leftGutterFront = makePlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, {matPrms: gutterWallMat}, this.mats);
      leftGutterFront.rotateY(Math.PI);
      leftGutterFront.position.set(
       -gutterDepth / 2, (roomHeight - gutterDepth) / 2, 
       rigDepth + gutterWidth / 2);
      leftGutterFront.castShadow = true;

      const rightGutterBack = makePlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, {matPrms: gutterWallMat}, this.mats);
      rightGutterBack.position.set(
       roomWidth + gutterDepth / 2, (roomHeight - gutterDepth) / 2,
       rigDepth - gutterWidth / 2);
      rightGutterBack.receiveShadow = true;

      const rightGutterFront = makePlaneElement(
       'sideGutter', gutterGroup, {
          width: gutterDepth,
          height: roomHeight + gutterDepth
       }, {matPrms: gutterWallMat}, this.mats);
      rightGutterFront.rotateY(Math.PI);
      rightGutterFront.position.set(
       roomWidth + gutterDepth / 2, (roomHeight - gutterDepth) / 2, 
       rigDepth + gutterWidth / 2);
      rightGutterFront.castShadow = true;

      // Gutter roof
      const leftGutterRoof = makePlaneElement(
       'gutterRoof', gutterGroup, {
          width: gutterDepth,
          height: gutterWidth
       }, {matPrms: gutterRoofMat}, this.mats);
      leftGutterRoof.rotateX(Math.PI / 2);
      leftGutterRoof.position.set(
       -gutterDepth / 2, roomHeight, rigDepth);
      leftGutterRoof.receiveShadow = true;

      const rightGutterRoof = makePlaneElement(
       'gutterRoof', gutterGroup, {
          width: gutterDepth,
          height: gutterWidth
       }, {matPrms: gutterRoofMat}, this.mats);
      rightGutterRoof.rotateX(Math.PI / 2);
      rightGutterRoof.position.set(
       roomWidth + gutterDepth / 2, roomHeight, rigDepth);
      rightGutterRoof.receiveShadow = true;

      // Add gutter group to room group
      roomGroup.add(gutterGroup);
   }

   makeBalcony(parent, woodMat, metalMat) {
      const {roomWidth, floorHeight, balconyDepth, balconyHeight, railRadius,
       railHeight, railRodRadius, balconyNum, latheSegments}
       = BounceSceneGroup;

      for (let i = 1; i <= balconyNum; i++) {
         // Make the floor
         const balconyFloorTop = makePlaneElement(
          'balconyFloorTop', parent, {
             width: balconyDepth,
             height: roomWidth
          }, {matPrms: woodMat}, this.mats);
         balconyFloorTop.rotateX(-Math.PI / 2);
         balconyFloorTop.rotateZ(Math.PI / 2);
         balconyFloorTop.position.set(
          roomWidth / 2, balconyHeight * i, this.roomDepth - balconyDepth / 2);
   
         const balconyFloorSide = makePlaneElement(
          'balconyFloorSide', parent, {
             width: floorHeight,
             height: roomWidth
          }, {matPrms: woodMat}, this.mats);
         balconyFloorSide.rotateX(Math.PI);
         balconyFloorSide.rotateZ(Math.PI / 2);
         balconyFloorSide.position.set(
          roomWidth / 2, balconyHeight * i - floorHeight / 2,
          this.roomDepth - balconyDepth);
   
         const balconyFloorBottom = makePlaneElement(
          'balconyFloorBottom', parent, {
             width: balconyDepth,
             height: roomWidth
          }, {matPrms: woodMat}, this.mats);
         balconyFloorBottom.rotateX(Math.PI / 2);
         balconyFloorBottom.rotateZ(Math.PI / 2);
         balconyFloorBottom.position.set(
          roomWidth / 2, balconyHeight * i - floorHeight,
          this.roomDepth - balconyDepth / 2);
   
         // Make the rail
         const rail = makeCylinderElement(
          'rail', parent, {
             radius: railRadius,
             height: roomWidth,
             segments: latheSegments
          }, {matPrms: woodMat}, this.mats);
         rail.rotateZ(Math.PI / 2);
         rail.position.set(
          roomWidth / 2, balconyHeight * i + railHeight,
          this.roomDepth - balconyDepth + railRadius);
   
         // Brass base for rail
         const railBase = makeBoxElement(
          'railBase', parent, {
             width: roomWidth,
             height: railRadius + railRodRadius,
             depth: railRadius
          }, {matPrms: metalMat}, this.mats);
         railBase.position.set(
          roomWidth / 2, balconyHeight * i + railHeight - railRadius / 2,
          this.roomDepth - balconyDepth + railRadius);
   
         // Make support rods
         // Support rod pattern repeats every meter
         for (let j = -0.5; j <= roomWidth; j++) {
            // Leftmost straight rod
            const straightRod = makeCylinderElement(
             'straightRod', parent, {
                radius: railRodRadius,
                height: railHeight,
                segments: latheSegments
             }, {matPrms: metalMat}, this.mats);
            straightRod.rotateY(Math.PI);
            straightRod.position.set(
             (roomWidth - Math.ceil(roomWidth)) / 2 + j,
             balconyHeight * i + railHeight / 2,
             this.roomDepth - balconyDepth + railRadius);
   
            // Leftmost curved rod
            const testRod = this.makeCurvedRailRod(parent, {matPrms: metalMat});
            testRod.position.set(
             (roomWidth - Math.ceil(roomWidth)) / 2 + j + 0.25,
             balconyHeight * i - 0.05,
             this.roomDepth - balconyDepth + railRadius);
            
            const testRod2 = this.makeCurvedRailRod(
             parent, {matPrms: metalMat});
            testRod2.position.set(
             (roomWidth - Math.ceil(roomWidth)) / 2 + j + 0.75,
             balconyHeight * i - 0.05,
             this.roomDepth - balconyDepth + railRadius);
            testRod2.rotateX(Math.PI);
         }
      }
   }

   makeCurvedRailRod(parent, {matPrms, offset}) {
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
       new THREE.MeshLambertMaterial(matPrms.fast));
      parent.add(rod);
      rod.rotateZ(Math.PI / 2);
      rod.name = 'curvedRailRod';

      addMaterial(rod, {
         x: 1.1,
         y: 0.126
      }, {matPrms, offset}, this.mats);

      return rod;
   }

   makeRig() {

      const rigGroup = new THREE.Group();
      rigGroup.name = 'rig';

      const cannonGroup = new THREE.Group();
      cannonGroup.name = 'cannon';
      rigGroup.add(cannonGroup);

      // Make cannon
      this.makeCannon(cannonGroup);

      // Make cannon wall mount
      this.makeCannonMount(cannonGroup);

      // Create group for obstacles
      const obstaclesGroup = new THREE.Group();
      obstaclesGroup.name = 'obstaclesGroup';
      rigGroup.add(obstaclesGroup);

      // Pre-create starter ball, so that additional balls can copy material
      this.makeBall(0, rigGroup);

      return rigGroup;
   }

   makeCannon(cannonGroup) {
      const {cannonLength, cannonRadius, ballRadius, rigSize, latheSegments}
       = BounceSceneGroup;

      const cannonPoints = [];

      // Inside end of barrel
      generateArcPoints(
       cannonPoints, ballRadius, {
          x: 0,
          y: cannonLength - 0.2
       }, {
          start: Math.PI / 2,          // Starts at 0, cannonLength - 0.1
          end: 0,                      // Ends at ballRadius, cannonLength - 0.2
          incr: -Math.PI / 16
       });

      // Inner curve of front of muzzle
      generateArcPoints(
       cannonPoints, 0.02, {
          x: ballRadius + 0.02,
          y: 0.02
       }, {
          start: - Math.PI,            // Starts at ballRadius, 0.02
          end: - Math.PI / 2,          // Ends at ballRadius + 0.02, 0
          incr: Math.PI / 16
       });

      // Outer curve of front of muzzle
      generateArcPoints(
       cannonPoints, 0.02, {
          x: cannonRadius - 0.07,
          y: 0.02
       }, {
          start: - Math.PI / 2,        // Starts at cannonRadius - 0.07, 0
          end: 0,                      // Ends at cannonRadius - 0.05, 0.02
          incr: Math.PI / 16
       });

      // Curve of side of muzzle
      generateArcPoints(
       cannonPoints, 0.05, {
          x: cannonRadius - 0.015,
          y: 0.08
       }, {
          start: - 3 * Math.PI / 4,    // Starts at ~cannonRadius - 0.05, 
          end: - 5.01 * Math.PI / 4,   // Ends at ~cannonRadius - 0.05, 
          incr: -Math.PI / 16
       });

      // Curve of back of muzzle
      generateArcPoints(
       cannonPoints, 0.02, {
          x: cannonRadius - 0.07,
          y: 0.14
       }, {
          start: 0,                    // Starts at cannonRadius - 0.05, 0.14
          end: Math.PI / 2,            // Ends at cannonRadius - 0.07, 0.16
          incr: Math.PI / 16
       });

      // Curve of back of cannon
      generateArcPoints(
       cannonPoints, cannonRadius, {
          x: 0,
          y: cannonLength - cannonRadius
       }, {
          start: 0,
          end: Math.PI / 2,
          incr: Math.PI / 16
       });


      const cannon = makeLatheElement(
       'cannon', cannonGroup, {
          points: cannonPoints,
          maxRadius: cannonRadius,
          segments: latheSegments,
       }, {matPrms: brassMat}, this.mats);
      cannon.rotateZ(Math.PI / 2);
      cannon.rotateY(Math.PI);
      cannon.position.set(0, rigSize, 0);
      cannon.castShadow = true;
   }

   makeCannonMount(cannonGroup) {
      const {roomWidth, rigSize, latheSegments} = BounceSceneGroup;

      for (let i = -1; i < 2; i += 2) {
         const LargeCannonMount = makeCylinderElement(
          'largeCannonMount', cannonGroup, {
             radius: 0.1,
             height: (roomWidth - rigSize) / 2 - 0.9,
             segments: latheSegments
          }, {matPrms: scuffedMetalMat}, this.mats);
         LargeCannonMount.rotateZ(Math.PI / 2);
         LargeCannonMount.rotateY(Math.PI);
         LargeCannonMount.position.set(
          (rigSize - roomWidth - 1.8) / 4, rigSize, 0.5 * i);
         LargeCannonMount.castShadow = true;

         const MountRing = this.makeRingElement(
          'mountRing', cannonGroup, {
             innerRad: 0.1,
             ringSize: 0.03,
             segments: latheSegments
          }, {matPrms: scuffedMetalMat});
         MountRing.rotateZ(-Math.PI / 2);
         MountRing.position.set(
          - (roomWidth - rigSize) / 2, rigSize, 0.5 * i);

         const SmallCannonMount = makeCylinderElement(
          'smallCannonMount', cannonGroup, {
             radius: 0.05,
             height: 0.5,
             segments: latheSegments
          }, {matPrms: scuffedMetalMat}, this.mats);
         SmallCannonMount.rotateX(Math.PI / 2);
         SmallCannonMount.position.set(-1, rigSize, 0.35 * i);
         SmallCannonMount.castShadow = true;
      }
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
               ball = this.makeBall(evt.ballNumber, this.rig);
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
               objGroup = this.makeObstacle(
                'target', this.rig, {
                   width: width,
                   height: height,
                   depth: trgDepth,
                }, {matPrms: brassMat});
               // Create hit sound effect
               objGroup.ping = new THREE.PositionalAudio(this.listener);
               if (this.pingBuffer)
                  objGroup.ping.setBuffer(this.pingBuffer);
               else
                  this.pendingAudio.push(objGroup.ping);
               objGroup.getObjectByName('wallRing').add(objGroup.ping);
            }
            else {
               objGroup = this.makeObstacle(
                'barrier', this.rig, {
                   width: width,
                   height: height,
                   depth: trgDepth,
                }, {
                   matPrms: streakyPlasticMat,
                   offset: new THREE.Vector2(0.1, 0)
                });
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
         if (evt.type === BounceMovie.cHitTarget) {
            if (this.obstacles[evt.targetId].parent.ping
             && this.obstacles[evt.targetId].parent.ping.buffer)
               this.obstacles[evt.targetId].parent.ping.play();
         }
         if (evt.type === BounceMovie.cHitBarrier) {
            if (this.obstacles[evt.barrierId].parent.ping
             && this.obstacles[evt.barrierId].parent.ping.buffer)
               this.obstacles[evt.barrierId].parent.ping.play();
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

   makeObstacle(name, parent, {width, height}, {matPrms, offset}) {
      const {rodRadius, trgRing, trgDepth} = BounceSceneGroup;

      // Create group for obstacle
      const obstacleGroup = new THREE.Group();
      parent.add(obstacleGroup);

      // Create group for moveable objects
      const obstacleMoveGroup = new THREE.Group();
      obstacleMoveGroup.name = 'obstacleMoveGroup';
      obstacleGroup.add(obstacleMoveGroup);

      // Create obstacle
      const obstacle = makeBoxElement(
       name, obstacleMoveGroup, {width, height, depth: trgDepth},
       {matPrms: matPrms, offset}, this.mats);
      obstacle.castShadow = true;

      // Calculate rods needed in x and y direction
      const xRods = 1 + Math.floor(width - 2 * (rodRadius + trgRing));
      const yRods = 1 + Math.floor(height - 2 * (rodRadius + trgRing));

      // Loop through to create support rods and rings
      for (let i = 0; i < xRods; i++) {
         for (let j = 0; j < yRods; j++) {
            const x = -(xRods - 1) / 2 + i;
            const y = -(yRods - 1) / 2 + j;

            this.makeSupportRods(obstacleGroup, obstacleMoveGroup, {x, y});
         }
      }

      return obstacleGroup;
   }

   makeSupportRods(parent, moveParent, {x, y}) {
      const {rodRadius, trgDepth, trgRing, wallRing, rigDepth,
       latheSegments} = BounceSceneGroup;

      // Add rod
      const supportRod = makeCylinderElement(
       'supportRod', moveParent, {
          radius: rodRadius,
          height: rigDepth,
          segments: latheSegments
       }, {matPrms: scuffedMetalMat}, this.mats);
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
      const obstacleRing = this.makeRingElement(
       'obstacleRing', moveParent, {
          innerRad: rodRadius,
          ringSize: trgRing,
          segments: latheSegments
       }, {matPrms: scuffedMetalMat});
      obstacleRing.position.set(x, y, -trgDepth / 2);
      obstacleRing.rotateX(-Math.PI / 2);
      obstacleRing.receiveShadow = true;

      // Add wall ring
      const obstacleWallRing = this.makeRingElement(
       'wallRing', parent, {
          innerRad: rodRadius,
          ringSize: wallRing,
          segments: latheSegments
       }, {matPrms: scuffedMetalMat});
      obstacleWallRing.position.set(x, y, -rigDepth);
      obstacleWallRing.rotateX(Math.PI / 2);
      obstacleWallRing.receiveShadow = true;
   }

   makeBall(ballNumber, parent) {
      const {rigSize, cannonLength} = BounceSceneGroup;
      // Ball dimensions
      const radius = BounceSceneGroup.ballRadius;
      const widthSegments = BounceSceneGroup.latheSegments;
      const heightSegments = BounceSceneGroup.latheSegments / 2;

      const ball = makeSphereElement(
       `ball`, parent, {
          radius,
          widthSegments,
          heightSegments
       }, {matPrms: brassMat}, this.mats);
      this.balls[ballNumber] = ball;
      ball.castShadow = true;
      if (this.currentBall)
         ball.material = this.currentBall.material;
      
      ball.position.set(-cannonLength / 2, rigSize, 0);
      
      return ball;
   }

   makeRingElement(
    name, parent, {innerRad, ringSize, segments}, {matPrms, offset}) {
      const {bevelRadius} = BounceSceneGroup;
      const points = [];
      points.push(new THREE.Vector2(innerRad + ringSize, 0));
      generateArcPoints(
       points, bevelRadius, {
          x: innerRad + ringSize - bevelRadius,
          y: ringSize,
       }, {
          start: 0,
          end: Math.PI / 2,
          incr: Math.PI / 16
       });
      generateArcPoints(
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

      return makeLatheElement(
       name, parent, newDims, {matPrms: matPrms, offset}, this.mats);
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