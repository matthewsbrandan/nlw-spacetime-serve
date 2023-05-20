import { FastifyInstance } from "fastify"
import axios from 'axios'
import { z } from "zod"
import { prisma } from "../lib/prisma"

export async function authRoutes(app: FastifyInstance){
  app.post('/register', async (request) => {
    const bodySchema = z.object({
      code: z.string(),
      isMobile: z.coerce.boolean().default(false)
    })
    const { code, isMobile } = bodySchema.parse(request.body);

    const client_id =     isMobile ? process.env.MOBILE_GITHUB_CLIENT_ID : process.env.GITHUB_CLIENT_ID;
    const client_secret = isMobile ? process.env.MOBILE_GITHUB_CLIENT_SECRET : process.env.GITHUB_CLIENT_SECRET;

    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token', null, {
        params:  { client_id, client_secret, code },
        headers: { Accept: 'application/json'     }
      }
    )
    const { access_token } = data;

    const userResponse = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
    const userSchema = z.object({
      id: z.number(),
      login: z.string(),
      name: z.string(),
      avatar_url: z.string().url()
    })
    const userInfo = userSchema.parse(userResponse.data);

    let user = await prisma.user.findUnique({
      where: { githubId: userInfo.id }
    })

    if(!user){
      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          login: userInfo.login,
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url
        }
      })
    }
    
    const token = app.jwt.sign({
      name: user.name,
      avatarUrl: user.avatarUrl
    },{
      sub: user.id,
      expiresIn: '30 days'
    })
    
    return { token }
  })
}