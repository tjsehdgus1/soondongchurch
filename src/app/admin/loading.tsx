export default function AdminLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div>
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
        <div className="h-5 w-72 bg-gray-100 rounded-lg mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-44" />
        ))}
      </div>
    </div>
  )
}
