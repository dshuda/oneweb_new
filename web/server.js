const http = require('http')
const net = require('net')

const TARGET_PORT = 3000
const PORT = parseInt(process.env.PORT || '3003', 10)
const HOST = process.env.HOSTNAME || '0.0.0.0'

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${TARGET_PORT}`,
      'x-forwarded-host': req.headers.host || `127.0.0.1:${PORT}`,
      'x-forwarded-proto': 'http'
    }
  }

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy HTTP error:', err.message)
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Bad Gateway: Unable to connect to Next.js dev server on port 3001.')
  })

  req.pipe(proxyReq)
})

server.on('upgrade', (req, socket, head) => {
  const proxySocket = net.connect(TARGET_PORT, '127.0.0.1', () => {
    let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i]
      const val = key.toLowerCase() === 'host' ? `127.0.0.1:${TARGET_PORT}` : req.rawHeaders[i + 1]
      rawHeaders += `${key}: ${val}\r\n`
    }
    rawHeaders += '\r\n'

    proxySocket.write(rawHeaders)
    if (head && head.length > 0) {
      proxySocket.write(head)
    }

    proxySocket.pipe(socket)
    socket.pipe(proxySocket)
  })

  proxySocket.on('error', () => {
    socket.destroy()
  })

  socket.on('error', () => {
    proxySocket.destroy()
  })
})

server.listen(PORT, HOST, () => {
  console.log(`✓ Web server listening on http://${HOST}:${PORT}`)
})