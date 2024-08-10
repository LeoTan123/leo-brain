import { auth } from "@clerk/nextjs/server";
import { ModelFusionTextStream, asChatMessages } from "@modelfusion/vercel-ai";
import { Message, StreamingTextResponse } from "ai";
import { llamacpp, streamText, trimChatPrompt } from "modelfusion";

import { notesIndex } from "@/lib/db/pinecone";
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
    console.log("text embedding:", textEmbedding);

    const embedding = await getTransformersEmbeddings(textEmbedding);

    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 4,
      filter: { userId },
    });

    const relevantNotes = await prisma.note.findMany({
      where: {
        id: {
          in: vectorQueryResponse.matches.map((match) => match.id),
        },
      },
    });

    const joinedRelevantNotes = relevantNotes
      .map((note) => `Title: ${note.title}\nContent:\n${note.content}`)
      .join("\n\n");
    console.log(joinedRelevantNotes);

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
            "You are an AI assistant chatbot on a note taking website. " +
            "The user may ask you questions about their existing notes. " +
            "These are the user's relevant notes for this query:\n" +
            joinedRelevantNotes,

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
