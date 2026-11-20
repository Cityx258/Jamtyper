type Props = {
  message: string;
  children: React.ReactNode;
};

export default function KeyboardOnly({ message, children }: Props) {
  return (
    <>
      <div className="keyboard-only">{children}</div>
      <p role="note" className="keyboard-only-message rounded-lg border border-teal bg-teal/10 px-4 py-3 text-ink">
        {message}
      </p>
    </>
  );
}
