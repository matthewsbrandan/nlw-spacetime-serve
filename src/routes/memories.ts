import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { z } from 'zod'

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    await request.jwtVerify();
  })

  app.get('/memories', async (request) => {
    const userId = request.user.sub;

    const memories = await prisma.memory.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return memories.map((memory) => ({
      id: memory.id,
      coverUrl: memory.coverUrl,
      excerpt: memory.content.substring(0, 115).concat('...'),
    }))
  })
  app.get('/memories/:id', async (request, replay) => {
    const userId = request.user.sub;

    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: { id },
    })

    if(!memory.isPublic && memory.userId !== userId){
      return replay.status(401).send();
    }

    return memory
  })
  app.post('/memories', async (request) => {
    const userId = request.user.sub;

    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false)
    })

    const { 
      content,
      coverUrl,
      isPublic
    } = bodySchema.parse(request.body);

    const memory = await prisma.memory.create({
      data: {
        content,
        coverUrl,
        isPublic,
        userId
      }
    })

    return memory
  })
  app.put('/memories/:id', async (request, reply) => {
    const userId = request.user.sub;

    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false)
    })

    const { 
      content,
      coverUrl,
      isPublic
    } = bodySchema.parse(request.body);

    let memory = await prisma.memory.findUniqueOrThrow({
      where: { id }
    })

    if(memory.userId !== userId){
      return reply.status(401).send();
    }

    memory = await prisma.memory.update({
      where: { id },
      data: {
        content,
        coverUrl,
        isPublic
      }
    })

    return memory
  })
  app.delete('/memories/:id', async (request, reply) => {
    const userId = request.user.sub;

    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: { id }
    })

    if(memory.userId !== userId){
      return reply.status(401).send();
    }

    await prisma.memory.delete({
      where: { id },
    })
  })
}