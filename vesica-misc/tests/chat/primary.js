'use strict'
/* eslint-disable no-console */

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const libp2p = require('../../libp2p.js')
const multiaddr = require('multiaddr')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const app = require('./app.json');
const p = Pushable()

PeerId.createFromJSON(require('./peer-id-listener'), (err, idListener) => {
  if (err) throw err
  setStuffUp(idListener);
})

function setStuffUp(idListener) {
  const peerListener = new PeerInfo(idListener)
  peerListener.multiaddr.add(multiaddr('/ip4/0.0.0.0/tcp/' + app.primary.port))
  const nodeListener = new libp2p.Node(peerListener)
  nodeListener.start((err) => {
    if (err) throw err
    nodeListener.swarm.on('peer-mux-established', (peerInfo) => {
      console.log(peerInfo.id.toB58String())
    })
    console.log('PRIMARY Listener ready, listening on:')
    peerListener.multiaddrs.forEach((ma) => {
      console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
    })
    nodeListener.handle('/chat/1.0.0', (protocol, conn) => {
      pull(p, conn)
      pull(conn, pull.drain(console.log))
    })/* Handler one ends */
  })
}

process.stdin.setEncoding('utf8')
process.openStdin().on('data', (chunk) => {
  var data = chunk.toString()
  p.push(data)
})
