import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[13px] text-slate-800">
      {children}
    </code>
  );
}

function Block({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded border border-slate-200 bg-slate-50 p-3 font-mono text-[12.5px] leading-relaxed text-slate-800">
      {children}
    </pre>
  );
}

const RELATIONSHIPS: { op: string; meaning: string }[] = [
  { op: 'A --|> B', meaning: 'Inheritance (A extends B)' },
  { op: 'A ..|> B', meaning: 'Realization (A implements B)' },
  { op: 'A --> B', meaning: 'Association' },
  { op: 'A *-- B', meaning: 'Composition (filled diamond at A)' },
  { op: 'A o-- B', meaning: 'Aggregation (hollow diamond at A)' },
  { op: 'A ..> B', meaning: 'Dependency (dashed)' },
];

export function HelpDialog({ onClose }: Props) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-base font-semibold text-slate-800">How to write a UML diagram</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="space-y-5 px-5 py-4 text-sm text-slate-700">
          <section>
            <h3 className="mb-1 font-semibold text-slate-800">Define a class</h3>
            <p className="mb-2">
              List fields and methods inside <Code>{'{ }'}</Code>. Visibility prefixes:{' '}
              <Code>+</Code> public, <Code>-</Code> private, <Code>#</Code> protected,{' '}
              <Code>~</Code> package.
            </p>
            <Block>{`class User {
  +id: int
  -name: string
  #createdAt: date
  +login(password: string): bool
  +logout()
}`}</Block>
            <p className="mt-2">
              Fields are <Code>name: type</Code>; methods are{' '}
              <Code>name(params): returnType</Code>. The type and return type are optional. A class
              with no members needs no braces: <Code>class Admin</Code>.
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-slate-800">Relationships</h3>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-1 pr-4 font-medium">Syntax</th>
                  <th className="py-1 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {RELATIONSHIPS.map((r) => (
                  <tr key={r.op} className="border-b border-slate-100">
                    <td className="py-1.5 pr-4">
                      <Code>{r.op}</Code>
                    </td>
                    <td className="py-1.5">{r.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-slate-800">Multiplicity &amp; labels</h3>
            <p className="mb-2">
              Add quoted multiplicities around the arrow, and an optional <Code>: label</Code> at
              the end.
            </p>
            <Block>{`User "1" --> "*" Order : places`}</Block>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-slate-800">Comments</h3>
            <p>
              Anything after <Code>//</Code> on a line is ignored.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-slate-800">Full example</h3>
            <Block>{`class User {
  +id: int
  +login(pw: string): bool
}
class Admin
class Order

Admin --|> User            // inheritance
User "1" --> "*" Order : places
Order *-- LineItem          // composition`}</Block>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-slate-800">Tips</h3>
            <ul className="list-inside list-disc space-y-1">
              <li>The diagram updates live as you type.</li>
              <li>Drag the canvas to pan; scroll to zoom; use the divider to resize panes.</li>
              <li>
                <Code>Cmd/Ctrl+S</Code> saves the text; <Code>Cmd/Ctrl+Shift+S</Code> exports a PNG.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
