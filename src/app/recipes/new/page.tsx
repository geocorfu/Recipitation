import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { PasteFlow } from "@/components/PasteFlow";

export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
  // One source of truth for the Claude instructions: the file George pastes into the project.
  // next.config.mjs includes it in the deployed function.
  const instructions = await readFile(path.join(process.cwd(), "claude-project-instructions.md"), "utf8").catch(
    () => "Οι οδηγίες βρίσκονται στο claude-project-instructions.md του repo.",
  );

  return (
    <>
      <p className="small">
        <Link href="/" className="muted">
          ← Όλες οι συνταγές
        </Link>
      </p>
      <h1>Νέα συνταγή</h1>
      <p className="muted">Επικόλλησε την απάντηση του Claude, δες την προεπισκόπηση και αποθήκευσε.</p>
      <PasteFlow instructions={instructions} />
    </>
  );
}
