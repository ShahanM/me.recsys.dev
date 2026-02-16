import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	children: React.ReactNode;
	variant?: "default" | "active" | "outline" | "secondary";
}

export const Badge: React.FC<BadgeProps> = ({
	children,
	className,
	variant = "default",
	...props
}) => {
	const variants = {
		default: "bg-bg-primary border border-border-color text-text-muted",
		active: "bg-accent-primary/10 border border-accent-primary/20 text-accent-primary",
		outline: "border border-border-color text-text-secondary bg-transparent",
		secondary: "bg-bg-secondary border border-border-color text-text-secondary",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center px-2 py-1 rounded text-[10px] font-medium transition-colors",
				variants[variant],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
};
