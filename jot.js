function K(x) {
  function K1(y) {
    return x
  }
  return K1
}

function S(x) {
  function S1(y) {
    function S2(z) {
      return x(z)(y(z))
    }
    return S2
  }
  return S1
}

function I(x) {
  return x
}

dot = a => b => a(b)

function basis(c) {
  return c(S)(K)
}

function cons(position, value) {
  this.position = position
  this.value = value
}

function iota(string) {
  function process(position) {
    if (position >= string.length) {
      alert('Invalid Iota string: ' + string)
      return new cons(position, basis)
    }
    if (string.charAt(position) != '*') {
      return new cons(position + 1, basis)
    }
    var fn = process(position + 1)
    var arg = process(fn.position)
    return new cons(arg.position, fn.value(arg.value))
  }
  return process(0).value
}

function geach(c) {
  function geach1(fn) {
    function geach2(arg) {
      return c(fn(arg))
    }
    return geach2
  }
  return geach1
}

function jot(string) {
  function process(position, value) {
    if (position >= string.length) {
      return value
    } else if (string.charAt(position) == '0') {
      return process(position + 1, basis(value))
    } else if (string.charAt(position) == '1') {
      return process(position + 1, geach(value))
    } else {
      return process(position + 1, value)
    }
  }
  return process(0, I)
}

ski = function (string, timeout) {
  const finishTime = Date.now() + timeout
  function* iterator() {
    for (let s of string) {
      yield s
    }
  }
  const it = iterator()
  return process(I)

  function process(value) {
    if (Date.now() >= finishTime) return null
    let next = it.next().value
    if (!next) {
      return value
    } else if (next == 'I') {
      return process(value(I))
    } else if (next == 'K') {
      return process(value(K))
    } else if (next == 'S') {
      return process(value(S))
    } else if (next == '(') {
      return process(value(process(I)))
    } else if (next == ')') {
      return value
    } else {
      return process(value)
    }
  }
}

k = '11100'
s = '11111000'

// I = S(K)(K)
plus1 = x => x + 1
succ = S(S(K(S))(K))
sum = S(K(S))(S(K(S(K(S))(K))))
c0 = K(I)
c1 = succ(c0)
c2 = succ(c1)
c3 = succ(c2)
c4 = succ(c3)
c5 = succ(c4)
c6 = succ(c5)
c7 = succ(c6)
c8 = succ(c7)
c9 = succ(c8)

const options = '(SKI)' + new Array(5).fill(' ').join('')
class Individual {
  constructor(p) {
    this.p = p
  }

  static newRandom(individualSize) {
    const i = new Individual(
      new Array(individualSize)
        .fill()
        .map(() => options[random(options.length)])
        .join(''),
    )
    return i
  }

  crossover(other) {
    const p1 = this.p,
      p2 = other.p
    const cutting = random(p1.length - 1) + 1
    return [
      new Individual(p1.slice(0, cutting).concat(p2.slice(cutting))),
      new Individual(p1.slice(cutting).concat(p2.slice(0, cutting))),
    ]
  }

  crossover2(other) {
    const p1 = this.p,
      p2 = other.p
    let c1, c2
    do {
      c1 = random(p1.length)
      c2 = random(p1.length)
    } while (c1 >= c2 && (c1 !== 0 || c2 !== p1.length - 1))
    return [
      new Individual(p1.slice(0, c1).concat(p2.slice(c1, c2)).concat(p1.slice(c2))),
      new Individual(p2.slice(0, c1).concat(p1.slice(c1, c2)).concat(p2.slice(c2))),
    ]
  }

  mutate() {
    const p = this.p
    let opts = options.slice()
    const position = random(p.length)
    const current = p.charAt(position)
    opts = opts.replace(new RegExp('\\' + current, 'g'), '')
    opts = Array.from(new Set(opts)).join('')
    const mutation = opts[random(opts.length)]
    return new Individual(p.slice(0, position) + mutation + p.slice(position + 1))
  }
}

function createPopulation(populationSize, individualSize) {
  return new Array(populationSize).fill().map(() => Individual.newRandom(individualSize))
}

/**
 * @param {Array} population
 * @param {Function} fitness
 * @returns
 */
function fillFitness(population, fitness) {
  population.forEach(p => {
    p.fitness = fitness(p.p)
  })
}

/**
 *
 * @param {Array} population
 * @param {Function} fitness
 */
function search(population, fitness) {
  // const CR = 0.9
  // const MR = 0.03

  population = population.slice()
  let generation = 0
  let CR = 1
  let MR = 0
  while (true) {
    fillFitness(population, fitness)
    const fitnessTotal = population.map(p => p.fitness).reduce((a, b) => a + b, 0)
    const fitnessMax = population.map(p => p.fitness).reduce((a, b) => (a > b ? a : b), 0)
    const fitnessAvg = fitnessTotal / population.length
    if (fitnessMax === 1) break
    if (population.length === 0) break

    let mate = null
    let newPopulation = []
    let crossovers = 0
    population.slice().forEach(p => {
      const isGettingLaid = Math.sqrt(CR) * (p.fitness / fitnessTotal) * population.length >= Math.random()
      if (!isGettingLaid) return
      if (!mate) mate = p
      else {
        newPopulation.push(...mate.crossover(p))
        mate = null
        crossovers += 2
      }
    })
    // // kill old age
    // population = population.slice(newPopulation.length).concat(newPopulation)
    // kill not fitness
    population.sort((a, b) => b.fitness - a.fitness)
    population = newPopulation.concat(population.slice(0, population.length - newPopulation.length))
    population.sort(() => Math.random() - 0.5)

    let mutations = 0
    // mutate all
    population = population.map(p => {
      if (Math.random() > MR) return p
      ++mutations
      return p.mutate()
    })

    MR = fitnessAvg / fitnessMax
    CR = 1 - MR
    ++generation
    let similarity = Math.trunc((100 * fitnessAvg) / fitnessMax)
    console.log({ generation, fitnessMax, similarity, crossovers, mutations, populationLength: population.length })
  }

  return population.filter(p => p.fitness === 1)
}

function random(limit) {
  return Math.trunc(Math.random() * limit)
}

function fib(n) {
  if (n === 1) return 1
  if (n === 2) return 2
  return fib(n - 2) + fib(n - 1)
}

const fitnessFunctions = {
  searchNumber: n => i => {
    return (
      (() => {
        try {
          i = ski(i, 10000)
        } catch {
          return fib(1)
        }
        if (typeof i !== 'function') return fib(2)
        try {
          i = i(plus1)
        } catch {
          return fib(3)
        }
        if (typeof i !== 'function') return fib(4)
        try {
          i = i(0)
        } catch {
          return fib(5)
        }
        if (typeof i !== 'number') return fib(6)
        if (i === n) return fib(7 + n)
        return fib(7 + n - Math.abs(n - i))
      })() / fib(7 + n)
    )
  },
}

searchNumber = function (n) {
  const population = createPopulation(500, 1024)
  return search(population, fitnessFunctions.searchNumber(n))
}

function testSearchNumber(j) {
  return jot(j)(plus1)(0)
}

bruteForceSearchNumber = function (n) {
  const opts = ' 01'
  const fitness = fitnessFunctions.searchNumber(n)
  let length = 1
  let successes = 0
  for (let perm of permute(opts.length)) {
    let expr = perm
      .split('')
      .map(i => opts[i])
      .join('')

    if (expr.length > length) {
      const total = Math.pow(opts.length, length)
      const rate = (100 * successes) / total
      console.log({ length, rate, successes, total })
      successes = 0
      length = expr.length
    }

    if (fitness(expr) === 1) {
      ++successes
    }
  }
}

function* permute(n) {
  let i = 0
  while (true) {
    yield i.toString(n)
    ++i
  }
}

if (typeof window === 'undefined') {
  const repl = require('repl')
  repl.start('> ')
}

const jot20 =
  '11  10 0 101  010 0001 0 000  010 01 01   101000 0011   01 001 0100     00 101011 0   0111 00111  10101 01  1    00 0 101 11 010  0 1 11111  0010 00  0 101 0 0 0 1    111   10 001001  01101 000 0 00 1 01 1 100 110111010011 011100 0 01 1 111  010   111 1 0   10 0101001 0001  01 100 0  11 111 1 10100 00 00 10011 0000011 1 1 1  10000   1  0010101 11 01  111  010 110000 110   10010 01 011101011  0 1 000 0 00  1 0001  1111 00 0   1 10  00 00  0101  101   0 001 1100010  0 1 0 11 11000 0  1010  1 1  011100110100 1  1 0 0 01 0  0 011 0010 10 001 1101 0 00 1111001 0     1101 011110010000010  0011 01 011  01 11   00000 0 0  11010 1 101 11 0 11 110  01010 1 00111 10  1 1    0110   0 0 11  1    11 1   001000 00 0 110000 1 1 1111 001 10100 1 00111101001100 00   001 01  010100110111 10 1   1001 11 1100 1000010001011100 111 1111000 01001 0 0110 01010 100   01 0 1  1101100 110011 0111000110 1010 010  0011 00 1011  0 101 1 11  100100 010   11 00  0 1000 1111 0  10 1  000 01 10 111101  1 101100010000111111110  1100 0000 11 010'
