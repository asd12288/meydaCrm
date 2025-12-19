interface CardBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBox({ children, className = '' }: CardBoxProps) {
  return (
    <div
      className={`bg-white dark:bg-darkgray rounded-md shadow-md dark:shadow-dark-md border border-transparent dark:border-darkborder p-6 ${className}`}
    >
      {children}
    </div>
  );
}
