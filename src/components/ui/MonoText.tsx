import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface MonoTextProps extends React.HTMLAttributes<HTMLSpanElement> {
	children: React.ReactNode;
	as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const MonoText: React.FC<MonoTextProps> = ({
	children,
	className,
	as: Component = "span",
	...props
}) => {
	return (
		<Component
			className={cn("font-mono text-xs", className)}
			{...props}
		>
			{children}
		</Component>
	);
};
