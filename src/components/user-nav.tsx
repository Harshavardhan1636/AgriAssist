import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"
import { useI18n } from "@/context/i18n-context"
import Link from "next/link";
import { useAuth } from "@/context/auth-context"
import { PlaceHolderImages } from "@/lib/placeholder-images"


export function UserNav() {
  const { t } = useI18n();
  const { logout } = useAuth();
  
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user_avatar');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50">
            <AvatarImage src={userAvatar?.imageUrl} data-ai-hint={userAvatar?.imageHint} alt="@agronomist" />
            <AvatarFallback>AG</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Agronomist</p>
            <p className="text-xs leading-none text-muted-foreground">
              agro@agriassist.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/account">
            <DropdownMenuItem>
              <User className="mr-2" />
              <span>{t('Profile')}</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/account">
            <DropdownMenuItem>
              <Settings className="mr-2" />
              <span>{t('Settings')}</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2" />
          <span>{t('Log out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}