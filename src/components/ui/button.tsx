import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_24px_-16px_rgba(53,70,51,0.75),0_1px_0_rgba(255,255,255,0.16)_inset] hover:bg-olive-light hover:shadow-[0_16px_30px_-18px_rgba(53,70,51,0.82),0_1px_0_rgba(255,255,255,0.18)_inset]",
        outline:
          "border border-border/75 bg-card/75 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] hover:border-primary/20 hover:bg-cream",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] hover:bg-accent",
        ghost: "hover:bg-muted/75 hover:text-foreground",
        destructive:
          "bg-danger text-white shadow-[0_10px_24px_-16px_rgba(196,92,82,0.7)] hover:bg-danger/90",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
