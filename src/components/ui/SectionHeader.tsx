import type { LucideIcon } from "lucide-react";
import React from "react";
import { MonoText } from "./MonoText";

interface SectionHeaderProps {
	title: string;
	icon?: LucideIcon;
	subtitle?: string;
	className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
	title,
	icon: Icon,
	subtitle,
	className,
}) => {
	return (
		<div className={`flex items-center gap-2 text-text-muted ${className}`}>
			{Icon && <Icon size={14} />}
			<MonoText className="uppercase tracking-widest font-bold">
				{title} {subtitle && <span className="text-accent-primary">// {subtitle}</span>}
			</MonoText>
		</div>
	);
};
