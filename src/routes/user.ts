import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";
import { authenticatedUser } from "../middlewares/authenticated-user";

export function userRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
    });

    const { name, email, password } = createUserBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex("user").insert({
      id: randomUUID(),
      email,
      name,
      password,
      sessionId,
    });

    return reply.status(201).send();
  });

  app.get(
    "/info/:id",
    { preHandler: [checkSessionIdExists, authenticatedUser] },
    async (request) => {
      // const getUserInfosBodySchema = z.object({
      //   totalAmountMeal: z.number(),
      //   totalAmountMealInDiet: z.number(),
      //   totalAmountMealOutDiet: z.number(),
      //   bestSequenceMealInDiet: z.number(),
      // })
      // const {totalAmountMeal, totalAmountMealInDiet, totalAmountMealOutDiet, bestSequenceMealInDiet} = getUserInfosBodySchema.parse(request.body)

      function getBestMealSequenceInDiet(mealArr: any) {
        let mealSequenceCounter = 0;
        let bestMealSequenceCounter = 0;

        for (const obj of mealArr) {
          if (obj.isInDiet) {
            mealSequenceCounter++;
          }
          if (mealSequenceCounter > bestMealSequenceCounter) {
            bestMealSequenceCounter = mealSequenceCounter;
          } else {
            mealSequenceCounter;
          }
        }

        return bestMealSequenceCounter;
      }

      const getUserInfoParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getUserInfoParamsSchema.parse(request.params);

      const userMeals = await knex("meal").select().where("userId", id);

      const totalAmountMeal = userMeals.length;
      const totalAmountMealInDiet = userMeals.filter((doc) => doc.isInDiet).length;
      const totalAmountMealOutDiet = userMeals.filter((doc) => !doc.isInDiet).length;
      const bestSequenceMealInDiet = getBestMealSequenceInDiet(userMeals);

      return {
        totalAmountMeal,
        totalAmountMealInDiet,
        totalAmountMealOutDiet,
        bestSequenceMealInDiet,
      };
    }
  );
}
