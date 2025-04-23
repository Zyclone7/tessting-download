import { ProjectStatusCard } from "@/components/ui/expandable-card";

function ExpandableCard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ProjectStatusCard
        title="Design System"
        progress={100}
        dueDate="Dec 31, 2023"
        contributors={[
          { name: "Emma" },
          { name: "John" },
          { name: "Lisa" },
          { name: "David" },
        ]}
        tasks={[
          { title: "Create Component Library", completed: true },
          { title: "Implement Design Tokens", completed: true },
          { title: "Write Style Guide", completed: true },
          { title: "Set up Documentation", completed: true },
        ]}
        githubStars={256}
        openIssues={0}
      />
    </div>
  );
}

export { ExpandableCard };