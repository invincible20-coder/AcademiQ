import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  return <DashboardHome userId={userId!} />;
}
