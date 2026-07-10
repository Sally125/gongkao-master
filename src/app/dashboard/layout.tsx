import Sidebar from "@/components/Sidebar";
import { auth } from '@/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={session?.user ?? null} />
      <main className="flex-1 lg:ml-64 mt-16 lg:mt-0 mb-16 lg:mb-0 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}