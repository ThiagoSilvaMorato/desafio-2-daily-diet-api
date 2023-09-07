import { FastifyReply, FastifyRequest } from "fastify";
import { knex } from "../database";

export async function authenticatedUser(request: FastifyRequest, reply: FastifyReply) {
  const sessionId = request.cookies.sessionId;

  const userId: string = await knex("user").select("id").where("sessionId", sessionId).first();

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  request.cookies.userId = userId;
}
