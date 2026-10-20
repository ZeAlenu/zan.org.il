import { defineCollection, reference } from "astro:content";
import { file, glob, type Loader } from "astro/loaders";
import { z } from "astro/zod";

const wings = defineCollection({
  loader: file("src/content/wings.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["movement", "arm", "forum"]),
    order: z.number(),
    blurb: z.string(),
  }),
});

const projects = defineCollection({
  loader: quietWhenEmpty(
    glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  ),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(140),
      owners: z.array(reference("wings")).min(1).max(2),
      parent: reference("projects").optional(),
      kind: z.enum(["campaign", "work", "publication", "tool", "page"]),
      image: image().optional(),
      imageAlt: z.string().default(""),
      placeholder: z.boolean().default(false),
      date: z.coerce.date().optional(),
    }),
});

const tiles = defineCollection({
  loader: file("src/content/home-tiles.json"),
  schema: z.object({
    id: z.string(),
    project: reference("projects"),
    size: z.enum(["l", "m", "s", "t", "w"]),
    order: z.number(),
  }),
});

export const collections = { wings, projects, tiles };

function quietWhenEmpty(loader: Loader): Loader {
  return {
    name: "projects",
    load: async (context) => {
      const warn = context.logger.warn.bind(context.logger);
      context.logger.warn = (message) => {
        if (String(message).includes("No files found matching")) return;
        warn(message);
      };
      try {
        await loader.load(context);
        if ([...context.store.keys()].length === 0) {
          context.store.set({ id: "keep", data: {} });
          context.store.delete("keep");
        }
      } finally {
        context.logger.warn = warn;
      }
    },
  };
}
