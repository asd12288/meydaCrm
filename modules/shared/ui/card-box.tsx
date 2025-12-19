interface CardBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBox({ children, className = '' }: CardBoxProps) {
  return (
    <div
      className={`bg-white dark:bg-dark rounded-md shadow-sm dark:shadow-none border border-bordergray/50 dark:border-darkborder p-6 ${className}`}
    >
      {children}
    </div>
  );
}
