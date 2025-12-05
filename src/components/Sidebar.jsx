export default function Sidebar({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 transform bg-white shadow p-6 w-64 transition-transform duration-200 z-40 transition-colors dark:bg-gray-900 dark:text-gray-100 dark:shadow-black/20 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Menu</h2>
          <button
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="space-y-2">
          {["dashboard", "employees", "spreadsheet", "word", "ticketing", "expenses", "reports", "automation"].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-full text-left px-3 py-2 rounded font-medium ${
                currentPage === page
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
