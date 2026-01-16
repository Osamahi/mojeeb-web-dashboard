/**
 * Datastores Table Skeleton
 * Loading skeleton for the datastores table
 */

export const DatastoresTableSkeleton = () => {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Datastore
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Type
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Solution
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Data Size
              </th>
              <th className="text-start px-4 py-3 text-sm font-semibold text-neutral-700">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr
                key={index}
                className="border-b border-neutral-100 animate-pulse"
              >
                <td className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-neutral-200 rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-neutral-200 rounded" />
                      <div className="h-3 w-48 bg-neutral-200 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 w-24 bg-neutral-200 rounded-full" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 bg-neutral-200 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 bg-neutral-200 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
