'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const getTitle = (pathname: string) => {
    switch (pathname) {
        case "/dashboard":
            return "Dashboard";
        case "/dashboard/analyze":
            return "New Analysis";
        case "/dashboard/history":
            return "Analysis History";
        case "/dashboard/review":
            return "Review Queue";
        default:
            return "AgriAssist";
    }
};

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold font-headline text-foreground">{getTitle(pathname)}</h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/dashboard/analyze">
            <Upload className="mr-2" />
            New Analysis
          </Link>
        </Button>
        <UserNav />
      </div>
    </header>
  );
}
