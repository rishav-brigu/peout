export default async function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <h1 className="font-display text-2xl text-[#1C1917] mb-1">Buyer {id}</h1>
      <p className="text-sm text-[#78716C]">Coming soon — Phase 1</p>
    </div>
  )
}
