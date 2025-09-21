// Script to decode market ID and extract parameters
const { ethers } = require('ethers');

// Market ID from our deployment
const marketId = '0x5579596ef4e22ea1f38a56c32256ad37963f628e7e4da219d40a1c737ac87dc6';

// The market ID is a keccak256 hash of the packed market parameters
// We need to find what oracle was used

console.log('Market ID:', marketId);

// Known parameters
const loanToken = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // WETH
const collateralToken = '0xB82381A3fBD3FaFA77B3a7bE693342618240067b'; // wstETH  
const irm = '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC'; // Adaptive IRM
const lltv = '860000000000000000'; // 86% as uint256

// Potential oracle addresses to try
const oracleAddresses = [
  '0x4D47fFD9E58328A0cd3E99B56B3F7e84d48F1d6B',
  '0x0000000000000000000000000000000000000000', // No oracle
  '0x2a01EB9496094dA03c4E364Def50f5aD1280AD72', // Oracle factory
];

console.log('\nTrying to find matching oracle...\n');

for (const oracle of oracleAddresses) {
  // Pack the parameters in the same order as Morpho does
  // struct MarketParams {
  //   address loanToken;
  //   address collateralToken;
  //   address oracle;
  //   address irm;
  //   uint256 lltv;
  // }
  
  const encoded = ethers.utils.solidityPack(
    ['address', 'address', 'address', 'address', 'uint256'],
    [loanToken, collateralToken, oracle, irm, lltv]
  );
  
  const computedId = ethers.utils.keccak256(encoded);
  
  console.log(`Oracle: ${oracle}`);
  console.log(`Computed ID: ${computedId}`);
  console.log(`Match: ${computedId.toLowerCase() === marketId.toLowerCase()}\n`);
  
  if (computedId.toLowerCase() === marketId.toLowerCase()) {
    console.log('✅ FOUND MATCHING ORACLE:', oracle);
    break;
  }
}