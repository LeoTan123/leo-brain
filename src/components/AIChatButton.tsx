import { useState } from "react";
import AIChatBox from "./AIChatBox";
import { Bot } from "lucide-react";
import { Button } from "./ui/button";
import IconButton from "./ui/icon-button";

export default function AIChatButton() {
  const [chatboxOpen, setChatboxOpen] = useState(false);

  return (
    <>
      <IconButton
        Icon={Bot}
        text="AI Chat"
        onClick={() => setChatboxOpen((prev) => !prev)}
      />

      <AIChatBox open={chatboxOpen} onClose={() => setChatboxOpen(false)} />
    </>
  );
}
