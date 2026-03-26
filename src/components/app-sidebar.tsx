"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  PlusCircle,
  Clock,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  TicketCheck,
  ShieldCheck,
  MessageSquare,
  Info,
} from "lucide-react"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navMainAll = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Publish", url: "/publish", icon: PlusCircle, adminOnly: true },
  { title: "Find a Ride", url: "/search", icon: Search },
  { title: "My Rides", url: "/rides", icon: Clock, adminOnly: true },
  { title: "My Bookings", url: "/bookings", icon: TicketCheck },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "About Us", url: "/about", icon: Info },
  { title: "Contact Us", url: "/contact", icon: MessageSquare },
  { title: "Admin", url: "/admin", icon: ShieldCheck, superAdminOnly: true },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  isAdmin?: boolean
  isSuperAdmin?: boolean
}

export function AppSidebar({ user, isAdmin = false, isSuperAdmin = false, ...props }: AppSidebarProps) {
  // Defer isAdmin/isSuperAdmin to after mount so server and client always render the same nav list
  // and avoid hydration mismatch (session/role can differ between server and client initially).
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const effectiveAdmin = mounted ? isAdmin : false
  const effectiveSuperAdmin = mounted ? isSuperAdmin : false
  const navMain = navMainAll.filter((item) => {
    if ("superAdminOnly" in item && item.superAdminOnly) return effectiveSuperAdmin
    if ("adminOnly" in item && item.adminOnly) return effectiveAdmin
    return true
  })
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
                <Image
                  src={LOGO_URL}
                  alt={APP_NAME}
                  width={32}
                  height={32}
                  className="size-8 object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{APP_NAME}</span>
                <span className="truncate text-xs">Ride Sharing</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                  <AvatarFallback className="rounded-lg">{user.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                        <AvatarFallback className="rounded-lg">{user.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user.name}</span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link
                      href="/api/auth/signout?callbackUrl=/"
                      className="flex w-full items-center gap-1.5 outline-none"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
