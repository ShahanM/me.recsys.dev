import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	variant?: "ghost" | "icon";
}

export const Button: React.FC<ButtonProps> = ({
	children,
	className,
	variant = "ghost",
	...props
}) => {
	const variants = {
		ghost: "text-text-muted hover:text-text-primary transition-colors",
		icon: "p-1 rounded hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors",
	};

	return (
		<button
			className={cn("cursor-pointer", variants[variant], className)}
			{...props}
		>
			{children}
		</button>
	);
};
