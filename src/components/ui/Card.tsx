import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	variant?: "default" | "glass" | "bordered";
}

export const Card: React.FC<CardProps> = ({
	children,
	className,
	variant = "default",
	...props
}) => {
	const variants = {
		default: "bg-bg-secondary border border-border-color",
		glass: "bg-bg-secondary/50 backdrop-blur border border-border-color",
		bordered: "border border-border-color bg-transparent",
	};

	return (
		<div
			className={cn(
				"rounded-lg overflow-hidden transition-all duration-300",
				variants[variant],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};
