export default function OrderAlertBanner({ alertState, message = 'Yeni sipariş geldi!' }) {
  if (alertState === 'none') return null;

  if (alertState === 'banner') {
    return (
      <div className="mb-4 bg-green-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse">
        <span className="text-xl">🔔</span>
        <span className="font-semibold">{message}</span>
      </div>
    );
  }

  // mini: küçük kalıcı şerit
  return (
    <div className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-lg w-fit">
      <span className="text-sm animate-pulse">🔔</span>
      <span className="text-sm font-medium text-green-700">{message}</span>
    </div>
  );
}
