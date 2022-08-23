import * as THREE from 'three';

// CameraControls.install({THREE});

function main() {
   const canvas = document.querySelector('#c');
   const renderer = new THREE.WebGLRenderer({canvas});

   const fov = 75;
   const aspect = 2;  // the canvas default
   const near = 0.1;
   const far = 50;
   const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
   camera.position.set(0, 0, 0);

   // const CameraControls = new CameraControls(camera, renderer.domElement);

   const scene = new THREE.Scene();

   {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);

      scene.add(new THREE.AmbientLight(0x555555));
   }

   const block = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 2.5, 0.5),
    new THREE.MeshPhongMaterial({color: 0x44aa88}));
   block.position.set(0, 0, -3);
   scene.add(block);
   block.renderOrder = 102;

   const cutoutCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.50005, 32, 1, false, 0, Math.PI / 3),
   //  new THREE.CylinderGeometry(0.5, 0.5, 0.50005, 32),
    new THREE.MeshPhongMaterial({colorWrite: false}));
   cutoutCylinder.position.set(0, 0, -3);
   cutoutCylinder.rotateX(Math.PI / 2);
   scene.add(cutoutCylinder);
   cutoutCylinder.renderOrder = 101;
   console.log(cutoutCylinder);

   const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.5, 32, 1, true),
    new THREE.MeshPhongMaterial({color: 0x8844aa, side: THREE.BackSide}));
   cylinder.position.set(0, 0, -3);
   cylinder.rotateX(Math.PI / 2);
   scene.add(cylinder);

   const testBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshPhongMaterial({color: 0x8844aa}));
   testBlock.position.set(0, 0.6, -3);
   testBlock.rotateX(Math.PI / 8);
   testBlock.rotateY(Math.PI / 8);
   scene.add(testBlock);

   function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
         renderer.setSize(width, height, false);
      }
      return needResize;
   }

   function render(time) {
      if (resizeRendererToDisplaySize(renderer)) {
         const canvas = renderer.domElement;
         camera.aspect = canvas.clientWidth / canvas.clientHeight;
         camera.updateProjectionMatrix();
      }

      // cutoutBox.rotation.y = time / 1000;

      renderer.render(scene, camera);
   }

   renderer.setAnimationLoop(render);
}

main();