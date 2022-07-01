import * as THREE from "three";

import steelPlateAlbedo from '../../assets/textures/steelPlate/albedo.png';
import steelPlateNormal from '../../assets/textures/steelPlate/normal.png';
import steelPlateRoughness from '../../assets/textures/steelPlate/roughness.png';
import steelPlateAo from '../../assets/textures/steelPlate/ao.png';

import concreteAlbedo from '../../assets/textures/concrete/albedo.jpg';
import concreteNormal from '../../assets/textures/concrete/normal.jpg';
import concreteRoughness from '../../assets/textures/concrete/roughness.jpg';
import concreteAo from '../../assets/textures/concrete/ao.jpg';
import concreteMetalness from '../../assets/textures/concrete/metalness.jpg';

import brickAlbedo from '../../assets/textures/brick/albedo.png';
import brickNormal from '../../assets/textures/brick/normal.png';
import brickRoughness from '../../assets/textures/brick/roughness.png';
import brickAo from '../../assets/textures/brick/ao.png';

import flatSteelRoughness from "../../assets/textures/flatSteel/roughness.png";

import goldAlbedo from '../../assets/textures/gold/albedo.png';
import goldRoughness from '../../assets/textures/gold/roughness.png';

import plasterAlbedo from '../../assets/textures/plaster/albedo.png';
import plasterNormal from '../../assets/textures/plaster/normal.png';
import plasterRoughness from '../../assets/textures/plaster/roughness.png';

import scratchedPlasticAlbedo from '../../assets/textures/scratchedPlastic/albedo.jpg';
import scratchedPlasticNormal from '../../assets/textures/scratchedPlastic/normal.png';
import scratchedPlasticRoughness from '../../assets/textures/scratchedPlastic/roughness.jpg';
import scratchedPlasticAo from '../../assets/textures/scratchedPlastic/ao.jpg';

import streakyPlasticAlbedo from '../../assets/textures/streakyPlastic/albedo.jpg';
import streakyPlasticNormal from '../../assets/textures/streakyPlastic/normal.jpg';
import streakyPlasticRoughness from '../../assets/textures/streakyPlastic/roughness.jpg';

// The materials below are from https://freepbr.com/, and if they are to be used
// comercially, they must be bought. The entire library can be bought for $9.

import brassAlbedo from '../../assets/textures/brass/albedo.png';
import brassNormal from '../../assets/textures/brass/normal.png';
import brassRoughness from '../../assets/textures/brass/roughness.png';
import brassAo from '../../assets/textures/brass/ao.png';

import scuffedMetalAlbedo from '../../assets/textures/scuffedMetal/albedo.png';
import scuffedMetalNormal from '../../assets/textures/scuffedMetal/normal.png';
import scuffedMetalRoughness from '../../assets/textures/scuffedMetal/roughness.png';
import scuffedMetalAo from '../../assets/textures/scuffedMetal/ao.png';

import checkerboardAlbedo from '../../assets/textures/checkerboard/albedo.png';
import checkerboardNormal from '../../assets/textures/checkerboard/normal.png';
import checkerboardRoughness from '../../assets/textures/checkerboard/roughness.png';
import checkerboardAo from '../../assets/textures/checkerboard/ao.png';

import olderWoodFloorAlbedo from '../../assets/textures/olderWoodFloor/albedo.png';
import olderWoodFloorNormal from '../../assets/textures/olderWoodFloor/normal.png';
import olderWoodFloorAo from '../../assets/textures/olderWoodFloor/ao.png';
import olderWoodFloorRoughness from '../../assets/textures/olderWoodFloor/roughness.png';

import polishedWoodAlbedo from '../../assets/textures/polishedWood/albedo.jpeg';
import polishedWoodNormal from '../../assets/textures/polishedWood/normal.jpeg';
import polishedWoodRoughness from '../../assets/textures/polishedWood/roughness.jpeg';
import polishedWoodAo from '../../assets/textures/polishedWood/ao.jpeg';

let steelPrm = {
   map: steelPlateAlbedo,
   normal: steelPlateNormal,
   roughness: steelPlateRoughness,
   ao: steelPlateAo,
   metal: {metalness: 0.5},
   reps: {x: 0.5, y: 0.5}           // what fraction of the texture covers 1x1m
};

let concretePrm = {
   map: concreteAlbedo,
   normal: concreteNormal,
   roughness: concreteRoughness,
   ao: concreteAo,
   metal: {file: concreteMetalness, metalness: 0.5},
   reps: {x: 0.5, y: 0.5}
};

let brickPrm = {
   map: brickAlbedo,
   normal: brickNormal,
   roughness: brickRoughness,
   ao: brickAo,
   reps: {x: 0.25, y: 0.25},
   shininess: 0.01,
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

let plasterPrm = {
   map: plasterAlbedo,
   normal: plasterNormal,
   roughness: plasterRoughness,
   reps: {x: 0.5, y: 0.5}
};

let scratchedPlasticPrm = {
   map: scratchedPlasticAlbedo,
   normal: scratchedPlasticNormal,
   roughness: scratchedPlasticRoughness,
   metal: {metalness: 0},
   ao: scratchedPlasticAo,
   reps: {x: 1, y: 1}
};

let streakyPlasticPrm = {
   map: streakyPlasticAlbedo,
   normal: streakyPlasticNormal,
   roughness: streakyPlasticRoughness,
   reps: {x: 1, y: 1}
};

let brassPrm = {
   map: brassAlbedo,
   normal: brassNormal,
   roughness: brassRoughness,
   // roughnessAmmount: 0.7,
   ao: brassAo,
   metal: {metalness: 0.8},
   reps: {x: 1, y: 1}
};

let ballPrm = {
   map: brassAlbedo,
   roughness: brassRoughness,
   metal: {metalness: 0.8},
   reps: {x: 1, y: 1}
};

let scuffedMetalPrm = {
   map: scuffedMetalAlbedo,
   normal: scuffedMetalNormal,
   roughness: scuffedMetalRoughness,
   ao: scuffedMetalAo,
   metal: {metalness: 0.7},
   reps: {x: 1, y: 1}
};

let checkerboardPrm = {
   map: checkerboardAlbedo,
   normal: checkerboardNormal,
   roughness: checkerboardRoughness,
   ao: checkerboardAo,
   metal: {metalness: 0},
   reps: {x: 1, y: 1}
};

let olderWoodFloorPrm = {
   map: olderWoodFloorAlbedo,
   normal: olderWoodFloorNormal,
   roughness: olderWoodFloorRoughness,
   ao: olderWoodFloorAo,
   metal: {metalness: 0},
   reps: {x: 0.5, y: 0.5}
};

let polishedWoodPrm = {
   map: polishedWoodAlbedo,
   // normal: polishedWoodNormal,
   roughness: polishedWoodRoughness,
   roughnessAmmount: 0.7,
   // ao: polishedWoodAo,
   reps: {x: 2, y: 2}
};

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

   console.log(prmSpec);

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

   if (prmSpec.roughnessAmmount)
      params.roughness = prmSpec.roughnessAmmount;

   if (prmSpec.metal) {
      if (prmSpec.metal.file)
         loads.metalnessMap = loadTextureAsync(prmSpec.metal.file, reps);
      params.metalness = prmSpec.metal.metalness;
   }

   if (prmSpec.shininess) {
      params.shininess = prmSpec.shininess;
      console.log('Shiny!');
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

let plasterMat = {
   slow: loadModelPrms(plasterPrm),
   fast: {
      color: 0xFFFFFF,
      side: THREE.DoubleSide
   }
};

let scratchedPlasticMat = {
   slow: loadModelPrms(scratchedPlasticPrm),
   fast: {
      color: 0x000000,
      side: THREE.DoubleSide
   }
};

let streakyPlasticMat = {
   slow: loadModelPrms(streakyPlasticPrm),
   fast: {
      color: 0x000000,
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

let ballMat = {
   slow: loadModelPrms(ballPrm),
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

let olderWoodFloorMat = {
   slow: loadModelPrms(olderWoodFloorPrm),
   fast: {
      color: 0x5E412C,
      side: THREE.DoubleSide
   }
};

let polishedWoodMat = {
   slow: loadModelPrms(polishedWoodPrm),
   fast: {
      color: 0x3F2736,
      side: THREE.DoubleSide
   }
};

export {steelMat, concreteMat, brickMat, flatSteelMat, goldMat, plasterMat,
 scratchedPlasticMat, streakyPlasticMat, brassMat, ballMat, scuffedMetalMat,
 checkerboardMat, olderWoodFloorMat, polishedWoodMat};