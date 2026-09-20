import { afterEach, describe, expect, it } from 'vitest'
import { createServer, type Server, type RequestListener } from 'node:http'
import { once } from 'node:events'
import { Soledgic } from './client'

const servers: Server[] = []
async function listen(handler: RequestListener) {
  const server = createServer(handler)
  servers.push(server)
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing server address')
  return `http://127.0.0.1:${address.port}`
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => {
    server.close(() => resolve())
    server.closeAllConnections()
  })))
})

describe('SDK credential redirect boundary', () => {
  const operations: Array<[string, (sdk: Soledgic) => Promise<unknown>]> = [
    ['JSON POST', sdk => sdk.listPeriods()],
    ['JSON GET', sdk => sdk.getTaxDocument('document_fixture')],
    ['DELETE', sdk => sdk.unmatchTransaction('transaction_fixture')],
    ['CSV GET', sdk => sdk.exportTaxDocuments(2026, 'csv')],
    ['CSV POST', sdk => sdk.exportReport({ reportType: 'transaction_detail', format: 'csv' })],
  ]
  it.each(operations)('%s never forwards credentials to a redirect target', async (_label, operation) => {
    let redirectedRequests = 0
    const target = await listen((_req, res) => {
      redirectedRequests++
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ success: true, periods: [] }))
    })
    const source = await listen((req, res) => {
      req.resume()
      res.writeHead(307, { location: `${target}/capture` })
      res.end()
    })
    const sdk = new Soledgic({ apiKey: 'slk_test_redirectfixture0000', baseUrl: source })
    await expect(operation(sdk)).rejects.toThrow()
    expect(redirectedRequests).toBe(0)
  })
})
