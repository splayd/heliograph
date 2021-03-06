import test from 'ava'
import {sleep} from '../../util/index.js'
import fromQueue from './index.js'

test('consuming and waiting for values from a queue', async (t) => {
  t.plan(4)

  const queue = fromQueue()

  await sleep(100)
  queue.push(1)
  queue.push(2)
  await sleep(100)
  queue.push(3)
  await sleep(100)
  queue.end()

  async function consume() {
    t.deepEqual(await queue.next(), {done: false, value: 1})
    t.deepEqual(await queue.next(), {done: false, value: 2})
    t.deepEqual(await queue.next(), {done: false, value: 3})
    t.deepEqual(await queue.next(), {done: true})
  }

  await consume()
})

test('pushing errors', async (t) => {
  t.plan(2)

  const queue = fromQueue()

  await sleep(100)
  queue.push(1)
  queue.pushError(new Error('Something went wrong'))

  async function consume() {
    t.deepEqual(await queue.next(), {done: false, value: 1})
    await t.throwsAsync(queue.next(), {message: 'Something went wrong'})
  }

  await consume()
})
