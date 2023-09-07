import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";
import { authenticatedUser } from "../middlewares/authenticated-user";

export function mealRoutes(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: [checkSessionIdExists, authenticatedUser] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        userId: z.string(),
        description: z.string(),
        date: z.date(),
        hour: z.string(),
        isInDiet: z.boolean(),
      });

      const { name, description, date, hour, isInDiet } = createMealBodySchema.parse(request.body);

      const { userId } = request.cookies;

      await knex("meal").insert({
        id: randomUUID(),
        userId,
        name,
        description,
        date,
        hour,
        isInDiet,
      });

      return reply.status(201).send();
    }
  );

  app.put(
    "/:id",
    { preHandler: [checkSessionIdExists, authenticatedUser] },
    async (request, reply) => {
      const putMealBodySchema = z.object({
        id: z.string(),
        name: z.string(),
        userId: z.string(),
        description: z.string(),
        date: z.date(),
        hour: z.string(),
        isInDiet: z.boolean(),
      });

      const { id, name, description, date, hour, isInDiet } = putMealBodySchema.parse(request.body);

      const { userId } = request.cookies;

      await knex("meal")
        .update({
          userId,
          name,
          description,
          date,
          hour,
          isInDiet,
        })
        .where("id", id);

      return reply.status(201).send();
    }
  );

  app.delete(
    "/:id",
    { preHandler: [checkSessionIdExists, authenticatedUser] },
    async (request, reply) => {
      const deleteMealBodySchema = z.object({
        id: z.string(),
      });

      const { id } = deleteMealBodySchema.parse(request.body);

      await knex("meal").delete().where("id", id);

      return reply.status(200);
    }
  );
}
