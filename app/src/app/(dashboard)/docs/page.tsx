import { Metadata } from "next";
import { DocsSidebar } from "@/components/docs-sidebar";
import { DocsContent } from "@/components/docs-content";

export const metadata: Metadata = {
  title: "Documentation — Copply",
  description: "Complete documentation for the Copply SDK, API, and dashboard.",
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen">
      <DocsSidebar />
      <main className="flex-1 p-8 lg:p-12">
        <DocsContent />
      </main>
    </div>
  );
}
