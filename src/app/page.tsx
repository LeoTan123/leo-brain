import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  const { userId } = auth();

  if (userId) redirect("/notes");

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-5">
      <div className="flex items-center gap-4">
        <Image src={logo} alt="app logo" width={100} height={100} />
        <span className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          {APP_NAME}
        </span>
      </div>

      <p className="max-w-prose text-center">
        An intelligent note-taking app with AI integration, built with Next.js,
        Shadcn UI, Clerk, Transformers.js, Pinecone and more.
      </p>

      <Button asChild size="lg">
        <Link href="/notes">Continue</Link>
      </Button>
    </main>
  );
}
