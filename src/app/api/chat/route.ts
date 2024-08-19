import { auth } from "@clerk/nextjs/server";
import { ModelFusionTextStream, asChatMessages } from "@modelfusion/vercel-ai";
import { Message, StreamingTextResponse } from "ai";
import { llamacpp, streamText, trimChatPrompt } from "modelfusion";
import pgvector from "pgvector";
import { VectorNote } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { getTransformersEmbeddings } from "@/lib/pipeline";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // model fusion
    const { messages }: { messages: Message[] } = await req.json();

    const messagesTruncated = messages.slice(-6);
    const textEmbedding = messagesTruncated
      .map((message) => message.content)
      .join("\n");

    const embedding = await getTransformersEmbeddings(textEmbedding);
    const pgEmbedding = pgvector.toSql(embedding);

    const vectors: Pick<VectorNote, "noteid">[] =
      await prisma.$queryRaw`SELECT noteid FROM vector_notes WHERE userid=${userId} ORDER BY embedding <=> ${pgEmbedding}::vector LIMIT 5`;

    const allNotes = await prisma.note.findMany({
      where: {
        userId,
      },
    });

    const relevantNotes = await prisma.note.findMany({
      where: {
        id: {
          in: vectors.map((vector) => vector.noteid),
        },
      },
    });

    const joinedRelevantNotes = relevantNotes
      .map((note) => `Title: ${note.title}\nContent:\n${note.content}`)
      .join("\n\n");

    // model fusion
    const model = llamacpp
      .CompletionTextGenerator({
        promptTemplate: llamacpp.prompt.Llama2, // choose the correct prompt template
        temperature: 0,
        cachePrompt: true,
        contextWindowSize: 4096, // Llama 2 context window size
        maxGenerationTokens: 512, // Room for answer
      })
      .withChatPrompt();

    // Use ModelFusion to call llama.cpp:
    const textStream = await streamText({
      model,
      // reduce chat prompt length to fit the context window:
      prompt: await trimChatPrompt({
        model,
        prompt: {
          system:
            "You are an AI assistant chatbot on a note taking website called LeoBrain. " +
            "The user may ask you questions about their existing notes. " +
            `${allNotes.length === 0 ? "But the user currently do not have any notes yet. Ask them to create one using the 'Add Note' button at the top right of the website and come back to ask questions about it." : relevantNotes.length === 0 ? "There are no relevant notes for this query. Ask them to rephrase the question." : `These are the user's relevant notes for this query:\n` + joinedRelevantNotes}`,
          // map Vercel AI SDK Message to ModelFusion ChatMessage:
          messages: asChatMessages(messages),
        },
      }),
    });

    // Return the result using the Vercel AI SDK:
    return new StreamingTextResponse(
      ModelFusionTextStream(
        textStream,
        // optional callbacks:
        {
          onStart() {
            // console.log("onStart");
          },
          onToken(token) {
            // console.log("onToken", token);
          },
          onCompletion: () => {
            // console.log("onCompletion");
          },
          onFinal(completion) {
            // console.log("onFinal", completion);
          },
        },
      ),
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
