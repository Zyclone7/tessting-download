"use server";

import { prisma } from "@/lib/prisma-singleton";
import { revalidatePath } from "next/cache";
import type {
  CreateTermInput,
  UpdateTermInput,
  CreatePolicyInput,
  UpdatePolicyInput,
} from "@/types/types";

// Terms and Conditions Actions
export async function getAllTerms() {
  try {
    const terms = await prisma.pt_terms.findMany({
      orderBy: {
        display_order: "asc",
      },
    });

    return { terms };
  } catch (error) {
    console.error("Error fetching terms:", error);
    throw new Error("Failed to fetch terms");
  }
}

export async function createTerm(data: CreateTermInput) {
  try {
    // Get the highest display order
    const maxOrderResult = await prisma.pt_terms.findFirst({
      orderBy: {
        display_order: "desc",
      },
      select: {
        display_order: true,
      },
    });

    const newOrder = maxOrderResult ? maxOrderResult.display_order + 1 : 1;

    await prisma.pt_terms.create({
      data: {
        title: data.title,
        content: data.content,
        display_order: newOrder,
        effective_date: data.effective_date || new Date(),
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error creating term:", error);
    throw new Error("Failed to create term");
  }
}

export async function updateTerm(data: UpdateTermInput) {
  try {
    await prisma.pt_terms.update({
      where: {
        term_id: data.term_id,
      },
      data: {
        title: data.title,
        content: data.content,
        effective_date: data.effective_date,
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error updating term:", error);
    throw new Error("Failed to update term");
  }
}

export async function deleteTerm(termId: number) {
  try {
    // Get the term to be deleted
    const termToDelete = await prisma.pt_terms.findUnique({
      where: {
        term_id: termId,
      },
      select: {
        display_order: true,
      },
    });

    if (!termToDelete) {
      throw new Error("Term not found");
    }

    // Delete the term
    await prisma.pt_terms.delete({
      where: {
        term_id: termId,
      },
    });

    // Update the display order of all terms with higher display order
    await prisma.pt_terms.updateMany({
      where: {
        display_order: {
          gt: termToDelete.display_order,
        },
      },
      data: {
        display_order: {
          decrement: 1,
        },
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error deleting term:", error);
    throw new Error("Failed to delete term");
  }
}

export async function reorderTerm(termId: number, direction: "up" | "down") {
  try {
    // Get the current term
    const currentTerm = await prisma.pt_terms.findUnique({
      where: {
        term_id: termId,
      },
      select: {
        display_order: true,
      },
    });

    if (!currentTerm) {
      throw new Error("Term not found");
    }

    const currentOrder = currentTerm.display_order;
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

    // Find the term to swap with
    const termToSwap = await prisma.pt_terms.findFirst({
      where: {
        display_order: newOrder,
      },
    });

    if (!termToSwap) {
      throw new Error("Cannot reorder term");
    }

    // Update the current term's order
    await prisma.pt_terms.update({
      where: {
        term_id: termId,
      },
      data: {
        display_order: newOrder,
      },
    });

    // Update the other term's order
    await prisma.pt_terms.update({
      where: {
        term_id: termToSwap.term_id,
      },
      data: {
        display_order: currentOrder,
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error reordering term:", error);
    throw new Error("Failed to reorder term");
  }
}

// Privacy Policy Actions
export async function getAllPolicies() {
  try {
    const policies = await prisma.pt_policy_section.findMany({
      orderBy: {
        display_order: "asc",
      },
    });

    return { policies };
  } catch (error) {
    console.error("Error fetching policies:", error);
    throw new Error("Failed to fetch policies");
  }
}

export async function createPolicy(data: CreatePolicyInput) {
  try {
    // Get the highest display order
    const maxOrderResult = await prisma.pt_policy_section.findFirst({
      orderBy: {
        display_order: "desc",
      },
      select: {
        display_order: true,
      },
    });

    const newOrder = maxOrderResult ? maxOrderResult.display_order + 1 : 1;

    await prisma.pt_policy_section.create({
      data: {
        title: data.title,
        content: data.content,
        display_order: newOrder,
        effective_date: data.effective_date || new Date(),
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error creating policy:", error);
    throw new Error("Failed to create policy");
  }
}

export async function updatePolicy(data: UpdatePolicyInput) {
  try {
    await prisma.pt_policy_section.update({
      where: {
        policy_id: data.policy_id,
      },
      data: {
        title: data.title,
        content: data.content,
        effective_date: data.effective_date,
        updated_at: new Date(),
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error updating policy:", error);
    throw new Error("Failed to update policy");
  }
}

export async function deletePolicy(policyId: number) {
  try {
    // Get the policy to be deleted
    const policyToDelete = await prisma.pt_policy_section.findUnique({
      where: {
        policy_id: policyId,
      },
      select: {
        display_order: true,
      },
    });

    if (!policyToDelete) {
      throw new Error("Policy not found");
    }

    // Delete the policy
    await prisma.pt_policy_section.delete({
      where: {
        policy_id: policyId,
      },
    });

    // Update the display order of all policies with higher display order
    await prisma.pt_policy_section.updateMany({
      where: {
        display_order: {
          gt: policyToDelete.display_order,
        },
      },
      data: {
        display_order: {
          decrement: 1,
        },
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error deleting policy:", error);
    throw new Error("Failed to delete policy");
  }
}

export async function reorderPolicy(
  policyId: number,
  direction: "up" | "down"
) {
  try {
    // Get the current policy
    const currentPolicy = await prisma.pt_policy_section.findUnique({
      where: {
        policy_id: policyId,
      },
      select: {
        display_order: true,
      },
    });

    if (!currentPolicy) {
      throw new Error("Policy not found");
    }

    const currentOrder = currentPolicy.display_order;
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

    // Find the policy to swap with
    const policyToSwap = await prisma.pt_policy_section.findFirst({
      where: {
        display_order: newOrder,
      },
    });

    if (!policyToSwap) {
      throw new Error("Cannot reorder policy");
    }

    // Update the current policy's order
    await prisma.pt_policy_section.update({
      where: {
        policy_id: policyId,
      },
      data: {
        display_order: newOrder,
      },
    });

    // Update the other policy's order
    await prisma.pt_policy_section.update({
      where: {
        policy_id: policyToSwap.policy_id,
      },
      data: {
        display_order: currentOrder,
      },
    });

    revalidatePath("/admin/terms-management");
    return { success: true };
  } catch (error) {
    console.error("Error reordering policy:", error);
    throw new Error("Failed to reorder policy");
  }
}

// Client-facing actions to get terms and policies for display
export async function getTermsForDisplay() {
  try {
    const terms = await prisma.pt_terms.findMany({
      orderBy: {
        display_order: "asc",
      },
      select: {
        term_id: true,
        title: true,
        content: true,
        display_order: true,
      },
    });

    return { terms };
  } catch (error) {
    console.error("Error fetching terms for display:", error);
    throw new Error("Failed to fetch terms");
  }
}

export async function getPoliciesForDisplay() {
  try {
    const policies = await prisma.pt_policy_section.findMany({
      orderBy: {
        display_order: "asc",
      },
      select: {
        policy_id: true,
        title: true,
        content: true,
        display_order: true,
      },
    });

    return { policies };
  } catch (error) {
    console.error("Error fetching policies for display:", error);
    throw new Error("Failed to fetch policies");
  }
}
