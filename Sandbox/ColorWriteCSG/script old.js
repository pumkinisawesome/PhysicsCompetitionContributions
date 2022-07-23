import * as THREE from 'three';



function main() {
   const canvas = document.querySelector('#c');
   const renderer = new THREE.WebGLRenderer({canvas});

   const fov = 75;
   const aspect = 2;  // the canvas default
   const near = 0.1;
   const far = 50;
   const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
   camera.position.set(0, 1.6, 0);

   const scene = new THREE.Scene();

   {
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(-1, 2, 4);
      scene.add(light);
   }

   const cutoutBox = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({colorWrite: false}));
   cutoutBox.position.set(0, 1, -3);
   // cutoutBox.visible = false;
   scene.add(cutoutBox);
   cutoutBox.renderOrder = 101;

   const foregroundBlock = new THREE.Mesh(
    new THREE.BoxGeometry(5, 2.5, 0.5),
    new THREE.MeshPhongMaterial({color: 0x8844aa}));
   foregroundBlock.position.set(0, 0.5, -3.5);
   foregroundBlock.rotateZ(-Math.PI / 4);
   foregroundBlock.rotateX(Math.PI / 4);
   scene.add(foregroundBlock);
   foregroundBlock.renderOrder = 102;

   const backgroundBlock = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 2.5, 2),
    new THREE.MeshPhongMaterial({color: 0x44aa88}));
   backgroundBlock.position.set(1.5, -0.5, -3.5);
   backgroundBlock.rotateY(Math.PI / 8);
   scene.add(backgroundBlock);

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

      cutoutBox.rotation.y = time / 1000;

      renderer.render(scene, camera);
   }

   renderer.setAnimationLoop(render);
}

main();