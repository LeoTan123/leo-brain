import Note from "@/components/Note";
import { APP_NAME } from "@/lib/constants";
import prisma from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `${APP_NAME} - Notes`,
};

export default async function NotesPage() {
  const { userId } = auth();

  if (!userId) throw Error("userId undefined");

  const notes = await prisma.note.findMany({
    where: {
      userId,
    },
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <Note key={note.id} note={note} />
      ))}
      {notes.length === 0 && (
        <div className="col-span-full text-center">
          {"You don't have any notes yet. Create one!"}
        </div>
      )}
    </div>
  );
}
