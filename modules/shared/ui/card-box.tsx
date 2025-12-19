interface CardBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBox({ children, className = '' }: CardBoxProps) {
  return (
    <div
      className={`bg-white dark:bg-darkgray rounded-md shadow-md p-6 ${className}`}
    >
      {children}
    </div>
  );
}
