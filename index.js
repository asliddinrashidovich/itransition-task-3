const crypto = require('crypto');
const readline = require('readline');

// argv array
const dices = process.argv.slice(2)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// ====================== MINI FUNCTIONS =====================
// generate random number
function getRandomNumber(max) {
  return crypto.randomInt(0, max)
}
// generate secure random 32 bytes
function generateRandomInt() {
  return crypto.randomBytes(32)
}
// generate hmac sha3_256
function generateHmac(key, message) {
  return crypto.createHmac('sha3-256', key).update(message).digest('hex')
}
// user prompt
function promptUser(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}
// delete selected element of array
function restEl(arr, index) {
  const left = arr.slice(0, index)
  const right = arr.slice(index + 1, arr.length)
  return left.concat(right)
}
// string array to number array 
function stringToNumberFunc(strArr) {
  return strArr.split(',').map(i => Number(i))
}
// console logs
function consoleCreater(max) {
  for(let i = 0; i < max; i++) {
    console.log(`${i} - ${i}`)
  }
  console.log(`X - exit`)
  console.log(`? - help`)
}

// ====================== WHO FIRST MOVE =====================
async function findFirstMover() {
  const randomNumber = getRandomNumber(2)
  const hmac = generateHmac(generateRandomInt(), randomNumber.toString())
  
  console.log("Let's determine who makes the first move.")
  console.log(`I selected a random value in the range 0..1 \n (HMAC=${hmac}).`)
  console.log("Try to guess my selection.")
  consoleCreater(2)
  
  let inputValue = await promptUser("Your selection: ");
  if(inputValue.toLowerCase() == 'x') process.exit(0)
  if(inputValue == '?') {
    console.log("Computer selected 0 or 1 and you should guess one of them to find who will move first \n")
    return await findFirstMover()
  }
  if(inputValue == 0 || inputValue == 1) {
    console.log(`My selection: ${randomNumber}`)
    if(inputValue == randomNumber) {
      return "your"
    } else {
      return "my"
    }
  }
  if(isNaN(inputValue) || inputValue < 0 || inputValue >= 2) {
    console.log('Invalid button, please press other button, \n')
    return await findFirstMover()
  }
}

// ====================== CHOOSE THE DICE =====================
async function chooseTheDice(user) {
  const randomNumber = getRandomNumber(dices.length)
  const key = generateRandomInt().toString('hex')
  const availableEl = restEl(dices, randomNumber)
  const restDices = {}

  console.log(`(KEY=${key})`)
  if(user == 'my') {
    console.log(`I make the first move and chooose the [${dices[randomNumber]}] dice.`)
  }
  if(user == 'your') {
    console.log(`You guessed correctly! You make the first move.`)
  }
  console.log("Choose your dice:")
  for(let i = 0; i < availableEl.length; i++) {
    console.log(`${i} - ${availableEl[i]}`)
    restDices[`${i}`] = availableEl[i]
  }
  console.log(`X - exit`)
  console.log(`? - help`)

  const inputValue = await promptUser("Your selection: ")
  if(inputValue == 'x') process.exit(0)
  if(inputValue == '?') {
    console.log(`Computer and you have to choose dices, please press ${Object.keys(restDices)} buttons to choose the dice`)
    return await chooseTheDice(user)
  } 
  if(Object.keys(restDices).includes(inputValue)) { 
    console.log(`You choose the [${availableEl[inputValue]}] dice.`)
    if(user == 'your') {
      console.log(`I choose the [${dices[randomNumber]}] dice.`)
    }
    return {user: stringToNumberFunc(availableEl[inputValue]), computer: stringToNumberFunc(dices[randomNumber])}
  } 
  if(isNaN(inputValue) || inputValue < 0 || inputValue >= availableEl.length) {
    console.log('Invalid button, please press other button,')
    return await chooseTheDice(user)
  }
}

// ====================== MOVE PLAY =====================
async function rollPlay(user) {
  const variantValues = [0,1,2,3,4,5]
  const randomNumber = getRandomNumber(6)
  const key = generateRandomInt().toString('hex')
  const hmac = generateHmac(key, randomNumber.toString())
  console.log(`It's time for ${user} role.`)
  console.log(`I selected a random value in the range 0..5 \n (HMAC=${hmac}).`)
  console.log(`Add your number module 6.`)
  consoleCreater(6)

  const inputValue = await promptUser("Your selection: ")
  if(inputValue == 'x') process.exit(0)
  if(inputValue == '?') {
    console.log(`Computer selected a random value in the range 0...5 and you should choose 0, 1, 2, 3, 4, 5`)
    return await rollPlay(user)
  }  
  if (variantValues.includes(Number(inputValue))) {
    return {computerRole: randomNumber, myRole: inputValue, key}
  } 
  if(isNaN(inputValue) || inputValue < 0 || inputValue >= 6) {
    console.log('Invalid button, please press other button,')
    return await rollPlay(user)
  }
}

// ====================== RESULT CALCULATOR =====================
function resultGenerator(com, my, dice, user, key) {
  const indexDices = (Number(com) + Number(my)) % 6
  const result = dice[indexDices]
  console.log(`My number is ${com}`)
  console.log(`(KEY=${key})`)
  console.log(`The fair number generation result ${com} + ${my} = ${indexDices} (mod 6).`)
  console.log(`${user} roll result is ${result}.`)
  return result
}

// ====================== FINAL RESULT =====================
async function finalResult(com, user) {
  if(com > user) {
    console.log(`I win (${com} > ${user})!`)
  } else if (com < user){
    console.log(`You win (${user} > ${com})!`)
  } else {
    console.log(`It's a draw (${user} = ${com}).`);
  }
  process.exit(0)
}

// ====================== PLAY =====================
async function play() {
  const result = await findFirstMover()
  const choosedDices = await chooseTheDice(result)
  if(result == 'my') {
    const computerMove = await rollPlay('my')
    const resultComputer = resultGenerator(computerMove.computerRole, computerMove.myRole, choosedDices.computer, 'My', choosedDices.key)
    const myMove = await rollPlay('your')
    const resultUser = resultGenerator(myMove.computerRole, myMove.myRole, choosedDices.user, 'Your', choosedDices.key)
    finalResult(resultComputer, resultUser)
  } else {
    const myMove = await rollPlay('your')
    const resultUser = resultGenerator(myMove.computerRole, myMove.myRole, choosedDices.user, 'Your', choosedDices.key)
    const computerMove = await rollPlay('my')
    const resultComputer = resultGenerator(computerMove.computerRole, computerMove.myRole, choosedDices.computer, 'My', choosedDices.key)
    finalResult(resultComputer, resultUser)
  }
}
play()





// else Invalid or taken dice. Try again.
// user You guessed correctly! You make the first move.
// ? This is a fair random number generation using HMAC. You select a number, we add both numbers modulo range.

// index.js

// const crypto = require('crypto');
// const readline = require('readline');

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// const args = process.argv.slice(2);

// // --- Dice parsing and validation ---
// function parseDiceArgs(args) {
//   if (args.length < 3) {
//     console.log("Error: You must specify at least 3 dice.");
//     console.log("Example: node index.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
//     process.exit(1);
//   }

//   const dice = args.map((arg, i) => {
//     const parts = arg.split(',');
//     if (parts.length !== 6 || parts.some(p => isNaN(parseInt(p)))) {
//       console.log(`Error: Dice #${i + 1} is invalid. Each dice must have 6 comma-separated integers.`);
//       process.exit(1);
//     }
//     return parts.map(Number);
//   });
//   return dice;
// }

// // --- Crypto HMAC helpers ---
// function generateRandomKey() {
//   return crypto.randomBytes(32); // 256 bits
// }

// function generateSecureRandomInt(max) {
//   return crypto.randomInt(0, max);
// }

// function createHmac(key, message) {
//   return crypto.createHmac('sha3-256', key).update(message).digest('hex');
// }

// function promptUser(question) {
//   return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
// }

// async function provableFairRandom(maxValue) {
//   const key = generateRandomKey();
//   const computerValue = generateSecureRandomInt(maxValue);
//   const hmac = createHmac(key, computerValue.toString());

//   console.log(`I selected a random value in the range 0..${maxValue - 1} (HMAC=${hmac}).`);
//   console.log(`Add your number modulo ${maxValue}.`);

//   for (let i = 0; i < maxValue; i++) {
//     console.log(`${i} - ${i}`);
//   }
//   console.log("X - exit");
//   console.log("? - help");

//   let userInput = await promptUser("Your selection: ");
//   if (userInput.toLowerCase() === 'x') process.exit(0);
//   if (userInput === '?') {
//     console.log("This is a fair random number generation using HMAC. You select a number, we add both numbers modulo range.");
//     return await provableFairRandom(maxValue);
//   }

//   const userChoice = parseInt(userInput);
//   if (isNaN(userChoice) || userChoice < 0 || userChoice >= maxValue) {
//     console.log("Invalid input.");
//     return await provableFairRandom(maxValue);
//   }

//   const result = (computerValue + userChoice) % maxValue;
//   console.log(`My number is ${computerValue} (KEY=${key.toString('hex')}).`);
//   console.log(`The fair number generation result is ${computerValue} + ${userChoice} = ${result} (mod ${maxValue}).`);
//   return result;
// }

// async function chooseWhoStarts() {
//   console.log("Let's determine who makes the first move.");
//   const key = generateRandomKey();
//   const computerChoice = generateSecureRandomInt(2);
//   const hmac = createHmac(key, computerChoice.toString());
//   console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);
//   console.log("Try to guess my selection.");
//   console.log("0 - 0\n1 - 1\nX - exit\n? - help");

//   let userInput = await promptUser("Your selection: ");

//   if (userInput.toLowerCase() === 'x') process.exit(0);
//   if (userInput === '?') {
//     console.log("Guess 0 or 1. After your guess, the key will be revealed so you can verify the HMAC.");
//     return await chooseWhoStarts();
//   }

//   const userGuess = parseInt(userInput);
//   if (isNaN(userGuess) || userGuess < 0 || userGuess > 1) {
//     console.log("Invalid guess.");
//     return await chooseWhoStarts();
//   }

//   console.log(`My selection: ${computerChoice} (KEY=${key.toString('hex')})`);
//   if (userGuess === computerChoice) {
//     console.log("You guessed correctly! You make the first move.");
//     return 'user';
//   } else {
//     console.log("I make the first move.");
//     return 'computer';
//   }
// }

// async function chooseDice(diceSet, takenIndex = -1) {
//   console.log("Choose your dice:");
//   diceSet.forEach((dice, idx) => {
//     if (idx !== takenIndex) console.log(`${idx} - ${dice.join(',')}`);
//   });
//   console.log("X - exit\n? - help");

//   let input = await promptUser("Your selection: ");
//   if (input.toLowerCase() === 'x') process.exit(0);
//   if (input === '?') {
//     console.log("Each dice has 6 values. Choose one that is not taken by the opponent.");
//     return await chooseDice(diceSet, takenIndex);
//   }

//   const index = parseInt(input);
//   if (isNaN(index) || index < 0 || index >= diceSet.length || index === takenIndex) {
//     console.log("Invalid or taken dice. Try again.");
//     return await chooseDice(diceSet, takenIndex);
//   }

//   return index;
// }

// async function rollDice(dice) {
//   const resultIndex = await provableFairRandom(dice.length);
//   return dice[resultIndex];
// }

// async function main() {
//   const diceSet = parseDiceArgs(args);
//   const firstMover = await chooseWhoStarts();

//   let userDiceIndex, computerDiceIndex;

//   if (firstMover === 'computer') {
//     computerDiceIndex = generateSecureRandomInt(diceSet.length);
//     console.log(`I make the first move and choose the [${diceSet[computerDiceIndex].join(',')}] dice.`);
//     userDiceIndex = await chooseDice(diceSet, computerDiceIndex);
//     console.log(`You choose the [${diceSet[userDiceIndex].join(',')}] dice.`);
//   } else {
//     userDiceIndex = await chooseDice(diceSet);
//     console.log(`You choose the [${diceSet[userDiceIndex].join(',')}] dice.`);
//     computerDiceIndex = generateSecureRandomInt(diceSet.length);
//     while (computerDiceIndex === userDiceIndex) {
//       computerDiceIndex = generateSecureRandomInt(diceSet.length);
//     }
//     console.log(`I choose the [${diceSet[computerDiceIndex].join(',')}] dice.`);
//   }

//   console.log("It's time for my roll.");
//   const computerRoll = await rollDice(diceSet[computerDiceIndex]);
//   console.log(`My roll result is ${computerRoll}.`);

//   console.log("It's time for your roll.");
//   const userRoll = await rollDice(diceSet[userDiceIndex]);
//   console.log(`Your roll result is ${userRoll}.`);

//   if (userRoll > computerRoll) {
//     console.log(`You win (${userRoll} > ${computerRoll})!`);
//   } else if (userRoll < computerRoll) {
//     console.log(`I win (${computerRoll} > ${userRoll})!`);
//   } else {
//     console.log(`It's a draw (${userRoll} = ${computerRoll}).`);
//   }

//   rl.close();
// }

// main();