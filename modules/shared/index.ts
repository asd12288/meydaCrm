// UI Primitives (shadcn/ui style)
export { Button, buttonVariants } from './ui/button';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './ui/popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
export { Skeleton } from './ui/skeleton';
export { Textarea } from './ui/textarea';
export { Calendar, type CalendarProps } from './ui/calendar';
export { DateTimePicker } from './ui/datetime-picker';

// UI components
export { CardBox } from './ui/card-box';
export {
  Spinner,
  LoadingState,
  InlineSpinner,
  type SpinnerSize,
  type SpinnerVariant,
  type SpinnerType,
  type SpinnerProps,
} from './ui/spinner';
export { PageHeader } from './ui/page-header';
export { ThemeSwitcher } from './ui/theme-switcher';
export { Logo } from './ui/logo';
export { FilterDropdown, type FilterOption } from './ui/filter-dropdown';
export { CopyableText } from './ui/copyable-text';
export { UserAvatar } from './ui/user-avatar';
export { PasswordInput } from './ui/password-input';
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from './ui/badge';
export { Pagination, type PaginationProps } from './ui/pagination';
export { SearchInput, type SearchInputProps } from './ui/search-input';

// Dropdown components
export {
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
  DropdownMenuFooter,
  type DropdownMenuProps,
  type DropdownMenuHeaderProps,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
  type DropdownMenuDividerProps,
  type DropdownMenuFooterProps,
} from './ui/dropdown-menu';

// Selection components
export { OptionCard, OptionCardGroup, type OptionCardProps, type OptionCardGroupProps } from './ui/option-card';
export { ToggleChip, ToggleChipGroup, type ToggleChipProps, type ToggleChipGroupProps } from './ui/toggle-chip';
export { Checkbox, CheckboxCard, type CheckboxProps, type CheckboxCardProps } from './ui/checkbox';
export { Select, InlineSelect, type SelectProps, type SelectOption, type InlineSelectProps } from './ui/select';
export { SearchableSelect, type SearchableSelectProps, type SearchableSelectOption } from './ui/searchable-select';
export {
  InlineDropdown,
  type InlineDropdownOption,
  type InlineDropdownOptionGroup,
} from './ui/inline-dropdown';

// Empty states
export {
  EmptyState,
  EmptyNotifications,
  EmptySearchResults,
  EmptyList,
  type EmptyStateProps,
  type EmptyStatePresetProps,
} from './ui/empty-state';

// Form components (DRY)
export { FormField, type FormFieldProps } from './ui/form-field';
export { FormPasswordField, type FormPasswordFieldProps } from './ui/form-password-field';
export { FormTextarea, type FormTextareaProps } from './ui/form-textarea';
export {
  FormAlert,
  FormErrorAlert,
  FormSuccessAlert,
  type FormAlertProps,
  type FormAlertType,
} from './ui/form-alert';
export { FormActions, type FormActionsProps } from './ui/form-actions';
export { FormSelect, type FormSelectProps, type FormSelectOption } from './ui/form-select';
export { FormSelectDropdown, type FormSelectDropdownProps, type FormSelectDropdownOption } from './ui/form-select-dropdown';
export { FormSection, type FormSectionProps } from './ui/form-section';
export { Modal, useModal, type ModalProps, type ModalSize } from './ui/modal';
export { ConfirmDialog, type ConfirmDialogProps } from './ui/confirm-dialog';
export { SectionHeader } from './ui/section-header';
export { TableSkeleton, type TableSkeletonProps, type TableSkeletonColumn } from './ui/table-skeleton';
export { TableEmptyState, type TableEmptyStateProps } from './ui/table-empty-state';
export { SimpleTable, type SimpleTableProps, type SimpleTableColumn } from './ui/simple-table';

// Hooks
export { useFormState, type UseFormStateReturn } from './hooks/use-form-state';
export { useClickOutside } from './hooks/use-click-outside';
export { useFilterNavigation, type UseFilterNavigationOptions } from './hooks/use-filter-navigation';

// Toast system
export { ToastProvider, type Toast, type ToastType, type ToastContextValue } from './ui/toast';
export { useToast } from './hooks/use-toast';

// Error Boundaries (react-error-boundary)
export { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';
export { ErrorFallback, type FallbackProps } from './ui/error-fallback';
export { SectionErrorFallback } from './ui/section-error-fallback';

// Banner system
export { SystemBanner, type SystemBannerProps, type BannerType } from './components/system-banner';
export { BannerContainer } from './components/banner-container';
export { BannerProvider, useBanner, type Banner } from './context/banner-context';
export { useSystemBanners } from './hooks/use-system-banners';
