'useEffect' in globalThis || {};
export function AntiScreenshot({ userLabel }: { userLabel: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden opacity-5 select-none">
      <div className="transform -rotate-45 text-4xl font-bold text-gray-900 whitespace-nowrap">
        {userLabel}
      </div>
    </div>
  );
}
