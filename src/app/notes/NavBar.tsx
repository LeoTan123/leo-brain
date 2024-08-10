"use client";

import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

import logo from "@/assets/logo.png";
import AddEditNoteDialog from "@/components/AddEditNoteDialog";
import { APP_NAME } from "@/lib/constants";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import AIChatButton from "@/components/AIChatButton";
import IconButton from "@/components/ui/icon-button";

export default function NavBar() {
  const { theme } = useTheme();

  const [mount, setMount] = useState(false);
  const [showAddEditNoteDialog, setShowAddEditNoteDialog] = useState(false);

  useEffect(() => {
    setMount(true);
  }, []);

  return (
    <>
      <div className="p-4 shadow">
        <div className="m-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/notes" className="flex items-center gap-1">
            <Image src={logo} alt="app logo" width={40} height={40} />
            <span className="font-bold">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } },
              }}
            />

            <ThemeToggleButton />

            {mount && (
              <>
                <IconButton
                  Icon={PlusIcon}
                  text="Add Note"
                  onClick={() => setShowAddEditNoteDialog(true)}
                />

                <AIChatButton />
              </>
            )}
          </div>
        </div>
      </div>
      <AddEditNoteDialog
        open={showAddEditNoteDialog}
        setOpen={setShowAddEditNoteDialog}
      />
    </>
  );
}
