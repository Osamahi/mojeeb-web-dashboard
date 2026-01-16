/**
 * Documents Table Skeleton
 * Loading skeleton for documents table
 */

export const DocumentsTableSkeleton = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Document
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Schema
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Content Type
            </th>
            <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
              Location
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(3)].map((_, index) => (
            <tr
              key={index}
              className="border-b border-neutral-100 animate-pulse"
            >
              <td className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 bg-neutral-200 rounded" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-48" />
                    <div className="h-3 bg-neutral-100 rounded w-64" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="h-6 bg-neutral-200 rounded-full w-20" />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-neutral-200 rounded" />
                  <div className="h-4 bg-neutral-200 rounded w-24" />
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="h-4 bg-neutral-200 rounded w-32" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
