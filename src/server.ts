import 'dotenv/config'

import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { memoriesRoutes } from './routes/memories'
import { authRoutes } from './routes/auth'
import { uploadRoutes } from './routes/upload'
import { resolve } from 'path'

const app = fastify()

app.register(multipart)

app.register(require('@fastify/static'), { 
  root: resolve(__dirname, '../uploads'),
  prefix: '/uploads'
})
app.register(cors,{ origin: true })

if(!process.env.JWT_SECRET_KEY) throw new Error(
  '> Is required JWT_SECRET_KEY on .env'
)

app.register(jwt, {
  secret: process.env.JWT_SECRET_KEY
})

app.register(authRoutes)
app.register(uploadRoutes)
app.register(memoriesRoutes)

app.listen({
  port: 3333,
  host: '0.0.0.0'
}).then(() => {
  console.log('🚀 Server is running on port http://localhost:3333')
})
