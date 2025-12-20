interface CardBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBox({ children, className = '' }: CardBoxProps) {
  return (
    <div
      className={`w-full bg-white dark:bg-dark rounded-md shadow-sm dark:shadow-none border border-bordergray/50 dark:border-darkborder p-4 lg:p-5 ${className}`}
    >
      {children}
    </div>
  );
}
