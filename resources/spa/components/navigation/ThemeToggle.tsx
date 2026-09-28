import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "../actions/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../overlays/DropdownMenu";
import { useTheme } from "../../stores/theme/ThemeContext";
import type { ThemePreference } from "../../stores/theme/themeReducer";

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Usar configuração do sistema", icon: Monitor },
];

export function ThemeToggle() {
  const { preference, resolved, setPreference } = useTheme();
  const TriggerIcon = resolved === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Alterar tema">
          <TriggerIcon className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={preference === option.value}
              onSelect={() => setPreference(option.value)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {option.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
