import { Cpu, ExternalLink } from "lucide-react";
import React from "react";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import projectsData from "../../data/projects.json";

interface ProjectProps {
	title: string;
	description: string;
	tech: string[];
	status: string;
	link: string;
}

const ProjectList: React.FC = () => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{projectsData.map((project) => (
				<ProjectCard key={project.id} {...project} />
			))}
		</div>
	);
};

const ProjectCard: React.FC<ProjectProps> = ({ title, description, tech, status, link }) => {
	return (
		<Card className="p-5 hover:border-accent-primary/50 group shadow-sm">
			<div className="flex justify-between items-start mb-3">
				<div className="flex items-center gap-2">
					<Cpu size={18} className="text-text-muted group-hover:text-accent-primary/80 transition-colors" />
					<h3 className="font-bold text-text-primary">{title}</h3>
				</div>
				<Badge
					variant={status === "Active" ? "active" : "default"}
					className={status !== "Active" ? "bg-bg-primary/50" : ""}
				>
					{status.toUpperCase()}
				</Badge>
			</div>

			<p className="text-sm text-text-secondary mb-4 h-16 overflow-hidden">{description}</p>

			<div className="flex flex-wrap gap-2 mb-4">
				{tech.map((t) => (
					<Badge key={t} variant="secondary">
						{t}
					</Badge>
				))}
			</div>

			<a
				href={link}
				target="_blank"
				rel="noreferrer"
				className="inline-flex items-center gap-2 text-xs text-accent-primary hover:text-accent-primary/80 hover:underline"
			>
				Launch Module <ExternalLink size={12} />
			</a>
		</Card>
	);
};

export default ProjectList;
