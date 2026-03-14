"use client"

import Link from "next/link"
import { User, Pencil, LogOut } from "lucide-react"
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
import { logoutAction } from "@/lib/actions/auth"

interface HeaderUserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 shrink-0 rounded-full outline-none ring-offset-background transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:h-10 md:w-10"
      >
        <Avatar className="h-8 w-8 md:h-9 md:w-9">
          <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
          <AvatarFallback className="text-sm">
            {user.name?.[0] ?? user.email?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-none">{user.name ?? "User"}</p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/profile" />}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/profile/edit" />}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <form action={logoutAction} className="flex w-full items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <button type="submit" className="flex-1 text-left outline-none">
                Log out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
