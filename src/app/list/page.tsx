import Link from "next/link";
import { ShoppingList } from "@/components/ShoppingList";

export default function ListPage() {
  return (
    <>
      <p className="small">
        <Link href="/" className="muted">
          ← Όλες οι συνταγές
        </Link>
      </p>
      <h1>Λίστα αγορών</h1>
      <ShoppingList />
    </>
  );
}
