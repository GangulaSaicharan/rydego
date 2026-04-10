"use client"

import ReactSelect from "react-select"
import { cn } from "@/lib/utils"

interface CityOption {
  value: string
  label: string
}

export interface CityComboboxProps {
  name: string
  value: string
  onValueChange: (value: string) => void
  cities: { id: string; city: string }[]
  loading?: boolean
  placeholder?: string
  controlClassName?: string
  required?: boolean
  disabled?: boolean
}

export function CityCombobox({
  name,
  value,
  onValueChange,
  cities,
  loading = false,
  placeholder = "Select city",
  controlClassName,
  required,
  disabled,
}: CityComboboxProps) {
  const options: CityOption[] = cities.map((c) => ({ value: c.id, label: c.city }))
  const selectedOption = options.find((o) => o.value === value) ?? null

  return (
    <ReactSelect<CityOption>
      instanceId={`city-select-${name}`}
      unstyled
      name={name}
      options={options}
      value={selectedOption}
      onChange={(opt) => onValueChange(opt?.value ?? "")}
      isLoading={loading}
      isDisabled={disabled || loading}
      isSearchable
      isClearable={false}
      placeholder={placeholder}
      required={required}
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      menuPosition="fixed"
      classNames={{
        container: () => "w-full",
        control: ({ isFocused }) =>
          cn(
            "flex w-full items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors cursor-pointer min-h-8",
            isFocused && "border-ring ring-2 ring-ring/50",
            controlClassName
          ),
        valueContainer: () => "flex flex-1 items-center gap-1 py-0.5",
        singleValue: () => "text-sm leading-tight",
        placeholder: () => "text-muted-foreground text-sm",
        input: () => "text-sm [&_input]:outline-none",
        indicatorsContainer: () => "flex shrink-0 items-center",
        dropdownIndicator: () => "text-muted-foreground px-1",
        loadingIndicator: () => "text-muted-foreground px-1",
        menu: () =>
          "mt-1 rounded-lg border border-border bg-popover text-popover-foreground shadow-md overflow-hidden z-50",
        menuList: () => "p-1 max-h-56 overflow-y-auto",
        option: ({ isFocused, isSelected }) =>
          cn(
            "flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm select-none",
            isFocused && "bg-accent text-accent-foreground",
            isSelected && !isFocused && "bg-accent/60 font-medium"
          ),
        loadingMessage: () => "py-6 text-center text-sm text-muted-foreground",
        noOptionsMessage: () => "py-6 text-center text-sm text-muted-foreground",
      }}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  )
}
