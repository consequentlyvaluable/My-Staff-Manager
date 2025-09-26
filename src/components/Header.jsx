export default function Header({ onSidebarToggle }) {
  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100"
          onClick={onSidebarToggle}
        >
          <div className="space-y-1">
            <div className="w-6 h-0.5 bg-gray-600"></div>
            <div className="w-6 h-0.5 bg-gray-600"></div>
            <div className="w-6 h-0.5 bg-gray-600"></div>
          </div>
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#660666" }}>
          Marcela&apos;s Employee Manager
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-600 hover:text-gray-800">
          Settings
        </button>
        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
          M
        </div>
      </div>
    </header>
  );
}
