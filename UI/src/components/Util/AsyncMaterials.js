import * as THREE from "three";

import steelPlateAlbedo from '../../assets/textures/steelPlate/albedo.png';
import steelPlateNormal from '../../assets/textures/steelPlate/normal.png';
import steelPlateHeight from '../../assets/textures/steelPlate/height.png';
import steelPlateRoughness from '../../assets/textures/steelPlate/roughness.png';
import steelPlateAo from '../../assets/textures/steelPlate/ao.png';

import concreteAlbedo from '../../assets/textures/concrete/albedo.jpg';
import concreteNormal from '../../assets/textures/concrete/normal.jpg';
import concreteHeight from '../../assets/textures/concrete/height.png';
import concreteMetalness from '../../assets/textures/concrete/metalness.jpg';
import concreteRoughness from '../../assets/textures/concrete/roughness.jpg';
import concreteAo from '../../assets/textures/concrete/ao.jpg';

import brickAlbedo from '../../assets/textures/brick/albedo.png';
import brickNormal from '../../assets/textures/brick/normal.png';
import brickHeight from '../../assets/textures/brick/height.png';
import brickRoughness from '../../assets/textures/brick/roughness.png';
import brickAo from '../../assets/textures/brick/ao.png';

import flatSteelRoughness from "../../assets/textures/flatSteel/roughness.png";

import goldAlbedo from '../../assets/textures/gold/albedo.png';
import goldRoughness from '../../assets/textures/gold/roughness.png';

import verticalLinedMetalAlbedo from '../../assets/textures/verticalLinedMetal/albedo.png';
import verticalLinedMetalNormal from '../../assets/textures/verticalLinedMetal/normal.png';
import verticalLinedMetalHeight from '../../assets/textures/verticalLinedMetal/height.png';
import verticalLinedMetalRoughness from '../../assets/textures/verticalLinedMetal/roughness.png';
import verticalLinedMetalMetalness from '../../assets/textures/verticalLinedMetal/metalness.png';
import verticalLinedMetalAo from '../../assets/textures/verticalLinedMetal/ao.png';

import brassAlbedo from '../../assets/textures/brass/albedo.png';
import brassNormal from '../../assets/textures/brass/normal.png';
import brassRoughness from '../../assets/textures/brass/roughness.png';
import brassMetalness from '../../assets/textures/brass/metalness.png';
import brassAo from '../../assets/textures/brass/ao.png';

import scuffedMetalAlbedo from '../../assets/textures/scuffedMetal/albedo.png';
import scuffedMetalNormal from '../../assets/textures/scuffedMetal/normal.png';
import scuffedMetalHeight from '../../assets/textures/scuffedMetal/height.png';
import scuffedMetalRoughness from '../../assets/textures/scuffedMetal/roughness.png';
import scuffedMetalMetalness from '../../assets/textures/scuffedMetal/metalness.png';
import scuffedMetalAo from '../../assets/textures/scuffedMetal/ao.png';

import checkerboardAlbedo from '../../assets/textures/checkerboard/albedo.png';
import checkerboardNormal from '../../assets/textures/checkerboard/normal.png';
import checkerboardHeight from '../../assets/textures/checkerboard/height.png';
import checkerboardRoughness from '../../assets/textures/checkerboard/roughness.png';
import checkerboardMetalness from '../../assets/textures/checkerboard/metalness.png';
import checkerboardAo from '../../assets/textures/checkerboard/ao.png';

let steelPrm = {
   map: steelPlateAlbedo,
   normal: steelPlateNormal,
   displacement: {file: steelPlateHeight, scale: 0.1},
   roughness: steelPlateRoughness,
   ao: steelPlateAo,
   metal: {metalness: 0.5},
   reps: {x: 0.5, y: 0.5}
};

let concretePrm = {
   map: concreteAlbedo,
   normal: concreteNormal,
   displacement: {file: concreteHeight, scale: 0.1},
   roughness: concreteRoughness,
   ao: concreteAo,
   metal: {file: concreteMetalness, metalness: 0.5},
   reps: {x: 0.5, y: 0.5}
};

let brickPrm = {
   map: brickAlbedo,
   normal: brickNormal,
   displacement: {file: brickHeight, scale: 0.05},
   roughness: brickRoughness,
   ao: brickAo,
   reps: {x: 0.25, y: 0.25},
};

let flatSteelPrm = {
   roughness: flatSteelRoughness,
   metal: {metalness: 0.5},
   reps: {x: 0.5, y: 0.5}
};

let goldPrm = {
   map: goldAlbedo,
   roughness: goldRoughness,
   metal: {metalness: 0.5},
   reps: {x: 0.5, y: 0.5}
};

let verticalLinedMetalPrm = {
   map: verticalLinedMetalAlbedo,
   normal: verticalLinedMetalNormal,
   displacement: {file: verticalLinedMetalHeight, scale: 0.1},
   roughness: verticalLinedMetalRoughness,
   metal: {file: verticalLinedMetalMetalness, metalness: 0.5},
   ao: verticalLinedMetalAo,
   reps: {x: 0.5, y: 0.5}
};

let brassPrm = {
   color: 0xAAAAAA,
   map: brassAlbedo,
   normal: brassNormal,
   roughness: brassRoughness,
   metal: {file: brassMetalness, metalness: 0.5},
   ao: brassAo,
   reps: {x: 1, y: 1}
};

let scuffedMetalPrm = {
   map: scuffedMetalAlbedo,
   normal: scuffedMetalNormal,
   displacement: {file: scuffedMetalHeight, scale: 0.1},
   roughness: scuffedMetalRoughness,
   metal: {file: scuffedMetalMetalness, metalness: .8},
   ao: scuffedMetalAo,
   reps: {x: 1, y: 1}
};

let checkerboardPrm = {
   map: checkerboardAlbedo,
   normal: checkerboardNormal,
   displacement: {file: checkerboardHeight, scale: 0.1},
   roughness: checkerboardRoughness,
   metal: {file: checkerboardMetalness, metalness: 0.5},
   ao: checkerboardAo,
   reps: {x: 1, y: 1}
}

// Return promise that awaits load of all parameters in the object passed.
// "Then" on this promise yields an object of loaded param objects, labelled
// by the param names, e.g. steelPrm, concretePrm, etc.  Use these to make
// StandardMaterials or other materials.
function loadMatPrms(prmSpecs) {
   let loads = {};  // Labeled Promises returned from loadModelParams

   Object.entries(prmSpecs).forEach(([key, value]) => {
      loads[key] = loadModelPrms(value);
   });

   return Promise.all(Object.values(loads))
   .then(res => {
      let rtn = {};
      Object.keys(loads).forEach((key, idx) => {
         rtn[key] = res[idx];
      })
      return rtn;
   })
}

function loadModelPrms(prmSpec) {
   let reps = prmSpec.reps;
   let params = {color: 0xFFFFFF, side: prmSpec.side || THREE.DoubleSide};
   let loads = {};

   if (prmSpec.color)
      params.color = prmSpec.color;

   if (prmSpec.map)
      loads.map = loadTextureAsync(prmSpec.map, reps);

   if (prmSpec.normal)
      loads.normalMap = loadTextureAsync(prmSpec.normal, reps);

   // if (prmSpec.displacement) {
   //    loads.displacementMap = loadTextureAsync(prmSpec.displacement.file, reps);
   //    params.displacementScale = prmSpec.displacement.scale
   // }
   
   if (prmSpec.aoMap)
      loads.aoMap = loadTextureAsync(prmSpec.ao, reps);

   if (prmSpec.roughness)
      loads.roughnessMap = loadTextureAsync(prmSpec.roughness, reps);

   if (prmSpec.metal) {
      if (prmSpec.metal.file)
         loads.metalnessMap = loadTextureAsync(prmSpec.metal.file, reps);
      params.metalness = prmSpec.metal.metalness;
   }
   
   return Promise.all(Object.values(loads))
   .then (res => {
      Object.keys(loads).forEach((key, idx) => {
         params[key] = res[idx];
      });

      return params; 
   });
}

function loadTextureAsync(path, reps) {
   return new THREE.TextureLoader().loadAsync(path)
   .then(tex => {
      if (reps) {
         tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
         tex.repeat.set(reps.x, reps.y);
      }
      return tex;
   });
}

/* Main program might be:
loadMatPrms({steelPrm, concretePrm, brickPrm}).then(prms => {
   Prms is now an object of loaded mat params:
   {
      steelPrm: loadedSteePrm
      concretePrm: loadedConcretePrm,
      etc...
   }
}
*/

let brickMat = {
   slow: loadModelPrms(brickPrm),
   fast: {
      color: 0x9F8779,
      side: THREE.DoubleSide
   }
};

let steelMat = {
   slow: loadModelPrms(steelPrm),
   fast: {
      color: 0x838381,
      side: THREE.DoubleSide
   }
};

let concreteMat = {
   slow: loadModelPrms(concretePrm),
   fast: {
      color: 0x5F5F5F,
      side: THREE.DoubleSide
   }
};

let flatSteelMat = {
   slow: loadModelPrms(flatSteelPrm),
   fast: {
      color: 0x5F5F5F,
      side: THREE.DoubleSide
   }
};

let goldMat = {
   slow: loadModelPrms(goldPrm),
   fast: {
      color: 0xC6994B,
      side: THREE.DoubleSide
   }
};

let verticalLinedMetalMat = {
   slow: loadModelPrms(verticalLinedMetalPrm),
   fast: {
      color: 0x1C1C1F,
      side: THREE.DoubleSide
   }
};

let brassMat = {
   slow: loadModelPrms(brassPrm),
   fast: {
      color: 0x5A482D,
      side: THREE.DoubleSide
   }
};

let scuffedMetalMat = {
   slow: loadModelPrms(scuffedMetalPrm),
   fast: {
      color: 0x413F36,
      side: THREE.DoubleSide
   }
};

let checkerboardMat = {
   slow: loadModelPrms(checkerboardPrm),
   fast: {
      color: 0x777777,
      side: THREE.DoubleSide
   }
};

export {steelMat, concreteMat, brickMat, flatSteelMat, goldMat, verticalLinedMetalMat, brassMat, scuffedMetalMat, checkerboardMat};