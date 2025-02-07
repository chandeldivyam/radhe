import { Server } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import { Database } from '@hocuspocus/extension-database'

const server = Server.configure({
  name: 'radhe-collaboration',
  port: parseInt(process.env.HOCUSPOCUS_PORT || '1234'),

  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => {
        // Initially return null, we'll implement fetching later
        return null
      },
      store: async ({ documentName, state }) => {
        // Initially just log, we'll implement storing later
        console.log('Storing document:', documentName)
      },
    }),
  ],
})

server.listen()
