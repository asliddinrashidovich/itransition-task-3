const crypto = require('crypto');

const argv = process.argv.slice(2)

function getHmac(key, message) {
  return crypto.createHmac('sha3-256', key).update(message).digest('hex');
}

const keyHex = argv[0];    
const number = argv[2];                     
const hmacFromComputer = argv[1];

const keyBuffer = Buffer.from(keyHex, 'hex');
const recalculatedHmac = getHmac(keyBuffer, number);

console.log('Checked HMAC:', recalculatedHmac);
console.log('Computer created HMAC:', hmacFromComputer);

if (recalculatedHmac === hmacFromComputer) {
  console.log('✅ HMAC matched — reliable!');
} else {
  console.log('❌ HMAC did not match — possible fraud!');
}
