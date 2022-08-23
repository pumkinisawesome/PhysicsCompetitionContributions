import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

// Load GLTF asset from |url|, obtaining from it just the scene (not cameras,
// animations, etc).  Apply the indicated transformation, and return the scene. 
export function loadGLTFScene(url, transform) {
   let loader = new GLTFLoader();
   let modelUrl = `${window.location.origin}/models/${url}/scene.gltf`;

   loader.load(modelUrl,
      ({scene}) => {
         scene.updateMatrix(transform);
         scene.castShadow = true;
         return scene;
      },
      undefined,
      (err) => console.log(err)
   );
}

export function makeBoxElement(
 name, parent, {width, height, depth}, {matPrms, offset}, mats) {
   const cube = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial(matPrms.fast));
   cube.name = name;
   parent.add(cube);

   addMaterial(cube, {
      x: 1,
      y: 1
   }, {matPrms, offset}, mats);

   return cube;
}

export function makeSphereElement(
 name, parent, {radius, widthSegments, heightSegments}, {matPrms, offset},
 mats) {
   const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, widthSegments, heightSegments),
    new THREE.MeshLambertMaterial(matPrms.fast));
   sphere.name = name;
   parent.add(sphere);

   addMaterial(sphere, {
      x: 2 * radius * Math.PI,
      y: radius * Math.PI
   }, {matPrms, offset}, mats);

   return sphere;
}

export function makePlaneElement(
 name, parent, {width, height}, {matPrms, offset}, mats) {
   const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshLambertMaterial(matPrms.fast));
   plane.name = name;
   parent.add(plane);

   addMaterial(plane, {
      x: width,
      y: height
   }, {matPrms, offset}, mats);

   return plane;
}

export function makeCylinderElement(
 name, parent, {radius, height, segments, openEnded, thetaLength},
 {matPrms, offset}, mats) {
   const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(
    radius, radius, height, segments, 1, openEnded, 0, thetaLength),
    new THREE.MeshLambertMaterial(matPrms.fast));
   cylinder.name = name;
   parent.add(cylinder);

   addMaterial(cylinder, {
      x: 2 * radius * Math.PI,
      y: height
   }, {matPrms, offset}, mats);

   return cylinder;
}

export function makeCircleElement(
 name, parent, {radius, segments, thetaLength}, {matPrms, offset}, mats) {
   const circle = new THREE.Mesh(
    new THREE.CircleGeometry(radius, segments, 0, thetaLength),
    new THREE.MeshLambertMaterial(matPrms.fast));
   circle.name = name;
   parent.add(circle);

   addMaterial(circle, {
      x: 2 * radius,
      y: 2 * radius
   }, {matPrms, offset}, mats);

   return circle;
}

export function makeLatheElement(
 name, parent, {points, maxRadius, segments, phiLength}, {matPrms, offset}, mats) {
   const lathe = new THREE.Mesh(
    new THREE.LatheGeometry(points, segments, 1, phiLength),
    new THREE.MeshLambertMaterial(matPrms.fast));
   lathe.name = name;
   parent.add(lathe);

   // The cannon's uv mapping will be weird, as it assumes all segments
   // are the same length. So, we need to change these uv values to reflect
   // the actual length of each segment.
   fixLatheUVs(lathe, {points, maxRadius, segments, phiLength}, {matPrms, offset}, mats);

   return lathe;
}

// Take a lathe, and adjust its UV values to make the texture map evenly,
// then apply a texture the correct size.
export function fixLatheUVs(
 lathe, {points, maxRadius, segments, phiLength}, {matPrms, offset}, mats) {
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
   const textureWidth = (phiLength || 2 * Math.PI) * maxRadius;

   addMaterial(lathe, {
      x: textureWidth,
      y: textureLength
   }, {matPrms, offset}, mats);
}

export function generateArcPoints(points, radius, {x, y}, {start, end, incr}) {
   if (incr < 0) {
      for (let i = start; i >= end; i += incr)
         points.push(new THREE.Vector2(
          x + radius * Math.cos(i), y + radius * Math.sin(i)));
   }
   else {
      for (let i = start; i <= end; i += incr)
         points.push(new THREE.Vector2(
          x + radius * Math.cos(i), y + radius * Math.sin(i)));
   }
}

export function addMaterial(obj, {x, y}, {matPrms, offset}, mats) {
   // If no complex material exists, leave as is
   if (!matPrms.slow)
      return;

   // Else, prepare to load complex material
   if (!offset)
      offset = {x: 0, y: 0};
   // If material doesn't exist, create it
   if (!mats[obj.name])
      mats[obj.name] = {
         mat: matPrms.slow,
         x,
         y,
         offset,
         objs: []
      };
   // Add object to list of objects with this material
   mats[obj.name].objs.push(obj);
}