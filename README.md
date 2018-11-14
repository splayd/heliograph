# heliograph
![npm](https://img.shields.io/npm/v/heliograph.svg)
[![Build Status](https://travis-ci.org/splayd/heliograph.svg?branch=master)](https://travis-ci.org/splayd/heliograph)
[![dependencies Status](https://david-dm.org/splayd/heliograph/status.svg)](https://david-dm.org/splayd/heliograph)
[![devDependencies Status](https://david-dm.org/splayd/heliograph/dev-status.svg)](https://david-dm.org/splayd/heliograph?type=dev)

Tools to support message passing via async iterators

## Usage
Install [heliograph](https://yarnpkg.com/en/package/heliograph)
by running:

```sh
yarn add heliograph
```

### Sources

#### `fromQueue()`
Creates an async iterator that waits for and pulls values pushed into a queue

```js
import * as fs from 'fs'
import { promisify } from 'util'
import { fromQueue } from 'heliograph'

const sleep = promisify(setTimeout)

const queue = fromQueue()

async function produce() {
  queue.push(1)
  await sleep(1000)
  queue.push(2)
  await sleep(2000)
  queue.push(3)

  // queue.pushError(new Error('Something went wrong'))
  queue.end()
}

async function consume() {
  for await (const value of queue) {
    console.log(value)
  }
}

produce()
consume()
```

#### `fromEventEmitter()`
Creates an async iterator that queues up events from an `EventEmitter`.

```js
import EventEmitter from 'events'
import { fromEventEmitter } from 'heliograph'

async function run() {
  const eventEmitter = new EventEmitter()
  const iterator = fromEventEmitter(eventEmitter, 'message')

  eventEmitter.emit('message', 1)
  eventEmitter.emit('message', 2)
  eventEmitter.emit('message', 3)

  for await (const message of iterator) {
    console.log(message)
  }
}

run()
```

#### `fromStream(readableStream)`
Creates an async iterator that pulls values from a Readable Stream.

```js
import * as fs from 'fs'
import { fromStream } from 'heliograph'

async function run() {
  const stream = fs.createReadStream('some-file')
  for await (const chunk of fromStream(stream)) {
    console.log(chunk)
  }
}

run()
```

### Operators

#### `consume(iterator)(processItem)`
Consume the items of the given async iterator

```js
import { pipe, consume } from 'heliograph'

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function run() {
  await pipe(
    numbers(),
    consume(n => console.log(n))
  )
}

run()
```

#### `filter(include)(iterator)`
Return a new async iterator whose items are items from the given iterator that
evaluate to `true` when passed to the given inclusion function.

```js
import { filter } from 'heliograph'

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function run() {
  const iterator = filter(n => n % 2 === 0)(numbers())
  for await (const evenNumber of iterator) {
    console.log(evenNumber)
  }
}
run()
```

#### `fork(iterator, times)`
Copy an async iterator so that separate operators can be applied

```js
import { fork, filter } from 'heliograph'

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function run() {
  const [numbers1, numbers2] = fork(numbers(), 2)
  const evenNumbers = filter(n => n % 2 === 0)(numbers1)
  const oddNumbers = filter(n => n % 2 !== 0)(numbers2)
}
run()
```

#### `map(transform)(iterator)`
Return a new async iterator whose items are the result of transforming each item
of the given async iterator.

```js
import { map } from 'heliograph'

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function run() {
  const iterator = map(n => n * 2)(numbers())
  for await (const doubledNumber of iterator) {
    console.log(doubledNumber)
  }
}
run()
```

#### `merge(...iterators)`
Interleave the items from multiple async iterators as they arrive

```js
import { promisify } from 'util'
import { merge } from 'heliograph'

const sleep = promisify(setTimeout)

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function* otherNumbers() {
  yield 42
  yield 43
  yield 44
}

async function run() {
  const iterator = merge(numbers(), otherNumbers())
  for await (const number of iterator) {
    console.log(number)
  }
}

run()
```

#### `observe(iterator)(processItem)`
Observe the items of an async iterator and return a new async iterator that
yields the same items.

```js
import { pipe, observe } from 'heliograph'

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

const iterator = pipe(
  numbers(),
  observe(n => console.log(n))
)

async function run() {
  for await (const number of iterator) {
    console.log(number)
  }
}

run()

```

### `pipe(iterator, ...transforms)`
Pass an iterator through a series of transforms.

```js
import { pipe, map, filter } from 'heliograph'

async function* numbers() {
  yield 1
  yield 2
  yield 3
  yield 4
}

async function run() {
  const iterator = pipe(
    numbers(),
    filter(number => number % 2 === 0),
    map(evenNumber => evenNumber * 3)
  )

  for await (const number of iterator) {
    console.log(number)
  }
}

run()
```

#### `zip(iterator1, iterator2)`
Pair up items from two async iterators

```js
import { promisify } from 'util'
import { zip } from 'heliograph'

const sleep = promisify(setTimeout)

async function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function* letters() {
  yield 'a'
  yield 'b'
  yield 'c'
}

async function run() {
  const iterator = zip(numbers(), letters())
  for await (const [number, letter] of iterator) {
    console.log(number, leter)
  }
}

run()
```
