"use client";

import ActivationCodesTables from "@/components/table/activation-codes-table";
import { Separator } from "@/components/ui/separator";
import { useUserContext } from "@/hooks/use-user";

export default function ActivationCodesPage() {
  const { user } = useUserContext();

  return (
    <main className="w-full px-6 py-8 md:px-12">
      <header>
        <h1 className="text-3xl font-bold">Activation Codes</h1>
        <p className="mt-2 text-muted-foreground">
          Configure and manage Activation Codes details and communication
          settings.
        </p>
      </header>
      <Separator className="my-6" />
      <section aria-label="Activation Codes Table">
        {user ? (
          <ActivationCodesTables userId={user.id} />
        ) : (
          <p className="text-muted-foreground">
            Please log in to view your activation codes.
          </p>
        )}
      </section>
    </main>
  );
}

