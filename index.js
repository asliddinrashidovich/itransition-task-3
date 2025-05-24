const crypto = require('crypto');
const readline = require('readline');
const Table = require('cli-table3');

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

// show the hmac graohic table
const diceArr = dices.map(d => d.split(',').map(Number));
const diceLabels = dices;

function showHelpTable() {
  console.log("\nProbability of the win for the user:");
  console.log("(Each cell shows the probability that the user wins if they pick the row dice and the computer picks the column dice)");

  const table = new Table({
    head: ['User dice v', ...diceLabels],
    style: { head: [], border: [] },
    wordWrap: true,
  });

  function getWinProbability(dice1, dice2) {
    let wins = 0;
    const total = dice1.length * dice2.length;
    for (let i of dice1) {
      for (let j of dice2) {
        if (i > j) wins++;
      }
    }
    return (wins / total).toFixed(4);
  }

  for (let i = 0; i < diceArr.length; i++) {
    const row = [];
    for (let j = 0; j < diceArr.length; j++) {
      if (i === j) {
        // O‘zi bilan solishtirilganda ehtimol emas
        const drawProb = getWinProbability(diceArr[i], diceArr[j]);
        row.push(`- (${drawProb})`);
      } else {
        const prob = getWinProbability(diceArr[i], diceArr[j]);
        row.push(prob);
      }
    }
    table.push([diceLabels[i], ...row]);
  }

  console.log(table.toString());
}



// ====================== WHO FIRST MOVE =====================
async function findFirstMover() {
  const randomNumber = getRandomNumber(2);
  const key = generateRandomInt()
  const hmac = generateHmac(key, randomNumber.toString())
  
  console.log("Let's determine who makes the first move.")
  console.log(`I selected a random value in the range 0..1 \n (HMAC=${hmac}).`)
  console.log("Try to guess my selection.")
  consoleCreater(2)
  
  let inputValue = await promptUser("Your selection: ");
  if(inputValue.toLowerCase() == 'x') process.exit(0)
  if(inputValue == '?') {
    console.log("To verify fairness, you will receive a KEY after the result.")
    console.log("You can compute: HMAC_SHA3_256(key, computer_number)")
    console.log("Compare it with the HMAC shown before to verify the number wasn't changed.\n")
    showHelpTable()
    return await findFirstMover()
  }
  if(inputValue == 0 || inputValue == 1) {
    console.log(`My selection: ${randomNumber}`)
    return { mover: (inputValue == randomNumber ? "your" : "my"), key };
  }
  if(isNaN(inputValue) || inputValue < 0 || inputValue >= 2) {
    console.log('Invalid button, please press other button, \n')
    return await findFirstMover()
  }
}

// ====================== CHOOSE THE DICE =====================
async function chooseTheDice(user, key) {
  if(user == 'my') {
    const randomNumber = getRandomNumber(dices.length)
    const availableEl = restEl(dices, randomNumber)
    const restDices = {}
    console.log(`(KEY=${key.toString('hex')})`)
    console.log(`I make the first move and chooose the [${dices[randomNumber]}] dice.`)
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
      console.log("To verify fairness, you will receive a KEY after the result.")
      console.log("You can compute: HMAC_SHA3_256(key, computer_number)")
      console.log("Compare it with the HMAC shown before to verify the number wasn't changed.\n")
      showHelpTable()
      return await chooseTheDice(user)
    } 
    if(Object.keys(restDices).includes(inputValue)) { 
      console.log(`You choose the [${availableEl[inputValue]}] dice.`)
      return {user: stringToNumberFunc(availableEl[inputValue]), computer: stringToNumberFunc(dices[randomNumber])}
    } 
    if(isNaN(inputValue) || inputValue < 0 || inputValue >= availableEl.length) {
      console.log('Invalid button, please press other button,')
      return await chooseTheDice(user)
    }
  } else {
    const randomNumber = getRandomNumber(dices.length - 1)
    let deleteEl = randomNumber; 
    const availableEl = restEl(dices, deleteEl)
    const restDices = {}
    console.log(`(KEY=${key.toString('hex')})`)
    
    console.log('You guessed correctly! You make the first move.')
    console.log("Choose your dice:")
    for(let i = 0; i < dices.length; i++) {
      console.log(`${i} - ${dices[i]}`)
      restDices[`${i}`] = dices[i]
    }
    console.log(`X - exit`)
    console.log(`? - help`)
  
    const inputValue = await promptUser("Your selection: ")
    if(inputValue == 'x') process.exit(0)
    if(inputValue == '?') {
      console.log("To verify fairness, you will receive a KEY after the result.")
      console.log("You can compute: HMAC_SHA3_256(key, computer_number)")
      console.log("Compare it with the HMAC shown before to verify the number wasn't changed.\n")
      showHelpTable()
      return await chooseTheDice(user)
    } 
    if(Object.keys(restDices).includes(inputValue)) { 
      deleteEl = inputValue
      console.log(`You choose the [${dices[inputValue]}] dice.`)
      console.log(`I choose the [${availableEl[randomNumber]}] dice.`)
      return {user: stringToNumberFunc(dices[inputValue]), computer: stringToNumberFunc(availableEl[randomNumber])}
    } 
    if(isNaN(inputValue) || inputValue < 0 || inputValue >= dices.length) {
      console.log('Invalid button, please press other button,')
      return await chooseTheDice(user)
    }
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
  const choosedDices = await chooseTheDice(result.mover, result.key)
  if(result.mover == 'my') {
    const computerMove = await rollPlay('my')
    const resultComputer = resultGenerator(computerMove.computerRole, computerMove.myRole, choosedDices.computer, 'My', computerMove.key)
    const myMove = await rollPlay('your')
    const resultUser = resultGenerator(myMove.computerRole, myMove.myRole, choosedDices.user, 'Your', myMove.key)
    finalResult(resultComputer, resultUser)
  } else {
    const myMove = await rollPlay('your')
    const resultUser = resultGenerator(myMove.computerRole, myMove.myRole, choosedDices.user, 'Your', myMove.key)
    const computerMove = await rollPlay('my')
    const resultComputer = resultGenerator(computerMove.computerRole, computerMove.myRole, choosedDices.computer, 'My', computerMove.key)
    finalResult(resultComputer, resultUser)
  }
}

function validateDices(dices) {
  if (dices.length < 3) {
    console.error('Error: At least 3 dice must be provided.');
    return false;
  }
  for (let i = 0; i < dices.length; i++) {
    const sides = dices[i].split(',');
    if (sides.length !== 6) {
      console.error(`Error: Dice #${i + 1} does not have exactly 6 sides.`);
      return false;
    }
    if (!sides.every(s => /^\d+$/.test(s))) {
      console.error(`Error: Dice #${i + 1} contains non-integer values.`);
      return false;
    }
  }
  return true;
}

if (!validateDices(dices)) {
  process.exit(1);
}
play()
