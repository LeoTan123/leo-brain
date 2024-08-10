import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { getTransformersEmbeddings } from "@/lib/pipeline";
import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "@/lib/validation/note";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();

    const parsedBody = createNoteSchema.safeParse(body);
    if (!parsedBody.success) {
      console.error(parsedBody.error);
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    const { title, content } = parsedBody.data;

    const embedding = await getEmbeddingForNote(title, content);

    const note = await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title,
          content,
          userId,
        },
      });

      await notesIndex.upsert([
        {
          id: note.id,
          values: embedding,
          metadata: { userId },
        },
      ]);

      return note;
    });

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();

    const parsedBody = updateNoteSchema.safeParse(body);
    if (!parsedBody.success) {
      console.error(parsedBody.error);
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    const { id, title, content } = parsedBody.data;

    // check if note exists
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // check if note belongs to current user
    if (userId !== note.userId) {
      return Response.json({ error: "Unauthorised" }, { status: 403 });
    }

    const embedding = await getEmbeddingForNote(title, content);

    const updatedNote = await prisma.$transaction(async (tx) => {
      const updatedNote = await tx.note.update({
        where: { id },
        data: {
          title,
          content,
        },
      });

      await notesIndex.upsert([
        {
          id,
          values: embedding,
          metadata: { userId },
        },
      ]);

      return updatedNote;
    });

    return Response.json({ updatedNote }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();

    const parsedBody = deleteNoteSchema.safeParse(body);
    if (!parsedBody.success) {
      console.error(parsedBody.error);
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    const { id } = parsedBody.data;

    // check if note exists
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    // check if note belongs to current user
    if (userId !== note.userId) {
      return Response.json({ error: "Unauthorised" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.note.delete({
        where: { id },
      });

      await notesIndex.deleteOne(id);
    });

    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getEmbeddingForNote(title: string, content: string | undefined) {
  return getTransformersEmbeddings(title + "\n\n" + content ?? "");
}
