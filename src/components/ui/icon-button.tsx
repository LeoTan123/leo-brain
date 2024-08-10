import { ForwardRefExoticComponent, RefAttributes } from "react";
import { LucideProps } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

type IconButtonProps = {
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  text: string;
} & ButtonProps;

export default function IconButton({ Icon, text, ...props }: IconButtonProps) {
  const mdScreen = useMediaQuery("(min-width: 768px)");

  return (
    <Button
      size={mdScreen ? "default" : "icon"}
      className={cn(
        "overflow-hidden rounded-full transition-all duration-100 ease-in-out",
      )}
      {...props}
    >
      <Icon size={20} className="md:mr-2" />
      <span
        className={cn(
          "w-0 opacity-0 transition-all duration-100 ease-in-out md:w-full md:opacity-100",
        )}
      >{`${text}`}</span>
    </Button>
  );
}
